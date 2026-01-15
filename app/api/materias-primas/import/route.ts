import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import * as XLSX from 'xlsx';

// Excel Column Mapping
// EjercicioPedido -> orderYear
// FechaPedido -> orderDate
// NumeroPedido -> orderNumber
// CodigoArticulo -> articleCode
// DescripcionArticulo -> articleName
// UnidadesPed -> unitsOrdered
// UnidadesRec -> unitsReceived
// UnidadesPendientes -> unitsPending
// Avance Recepción -> (Calculated: Received / Ordered)
// FechaRecepcion -> deliveryDate
// FechaNecesaria -> expectedDate
// Estado -> status
// RazonSocial -> supplierName
// LineasPosicion -> erpId (UNIQUE KEY)

function parseDate(dateValue: any): Date | null {
    if (!dateValue) return null;
    if (typeof dateValue === 'number') {
        // Excel serial date
        const d = new Date(Math.round((dateValue - 25569) * 86400 * 1000));
        return d;
    }
    if (typeof dateValue === 'string') {
        const d = new Date(dateValue);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
}

// Helper to parse numbers that might be formatted as strings with commas/dots
// e.g. "1.200,50" -> 1200.50
// e.g. "500" -> 500
function parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;

    if (typeof value === 'string') {
        // Remove thousands separators (.) if present, change decimal separator (,) to (.)
        // But need to be careful: is dot thousand or decimal?
        // Assumption: ERP Spanish export uses dot for thousands and comma for decimal.
        // "1.234,56" -> "1234.56"
        let clean = value.trim();
        if (clean.includes(',') && clean.includes('.')) {
            clean = clean.replace(/\./g, '').replace(',', '.');
        } else if (clean.includes(',')) {
            // "1234,56" -> "1234.56"
            clean = clean.replace(',', '.');
        }
        // If it only has dots "1.234" -> could be 1234 or 1.234. 
        // Usually excel parsed raw is number. If string, likely formatted.

        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
    }
    return 0;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) {
            return NextResponse.json({ message: 'Empty file' }, { status: 200 });
        }

        const importStats = {
            created: 0,
            updated: 0,
            completed: 0,
            errors: 0
        };

        const [excludedSuppliers, excludedTerms] = await Promise.all([
            prisma.rawMaterialExcludedSupplier.findMany({ select: { name: true } }),
            prisma.rawMaterialExcludedTerm.findMany()
        ]);
        const excludedSet = new Set(excludedSuppliers.map(s => s.name.toLowerCase().trim()));

        const importedErpIds = new Set<string>();

        // 1. Process Spreadsheet Rows
        let i = 0;
        for (const row of jsonData as any[]) {
            i++;
            const erpId = row['LineasPosicion'] ? String(row['LineasPosicion']) : null;
            const supplierName = row['RazonSocial'] ? String(row['RazonSocial']).trim() : '';

            // --- EXCLUSION CHECKS ---

            // 1. Supplier Check
            if (supplierName && excludedSet.has(supplierName.toLowerCase())) {
                continue; // Skip excluded supplier
            }

            // 2. Text Rule Check
            let isExcludedByTerm = false;
            const articleCode = row['CodigoArticulo'] ? String(row['CodigoArticulo']) : '';
            const articleName = row['DescripcionArticulo'] ? String(row['DescripcionArticulo']) : '';

            for (const rule of excludedTerms) {
                const valueToCheck = rule.field === 'CODE' ? articleCode : articleName;
                const normalize = (s: string) => s.toLowerCase().trim();

                if (rule.matchType === 'EXACT') {
                    if (normalize(valueToCheck) === normalize(rule.term)) {
                        isExcludedByTerm = true;
                        break;
                    }
                } else { // CONTAINS
                    if (normalize(valueToCheck).includes(normalize(rule.term))) {
                        isExcludedByTerm = true;
                        break;
                    }
                }
            }

            if (isExcludedByTerm) continue;

            if (!erpId) {
                importStats.errors++;
                continue;
            }

            importedErpIds.add(erpId);

            const orderData = {
                orderYear: row['EjercicioPedido'] ? parseInt(row['EjercicioPedido']) : null,
                orderDate: parseDate(row['FechaPedido']),
                orderNumber: row['NumeroPedido'] ? String(row['NumeroPedido']) : '',
                articleCode: row['CodigoArticulo'] ? String(row['CodigoArticulo']) : '',
                articleName: row['DescripcionArticulo'] ? String(row['DescripcionArticulo']) : '',
                unitsOrdered: parseNumber(row['UnidadesPedidas']),
                unitsReceived: parseNumber(row['UnidadesRecibidas']),
                unitsPending: parseNumber(row['UnidadesPendientes']),
                deliveryDate: parseDate(row['FechaRecepcion']),
                expectedDate: parseDate(row['FechaNecesaria']),
                status: row['Estado'] ? String(row['Estado']) : '',
                supplierName: row['RazonSocial'] ? String(row['RazonSocial']) : '',
                isCompleted: false // Mark as active if it's in the list
            };

            // Upsert
            const existing = await prisma.rawMaterialOrder.findUnique({
                where: { erpId }
            });

            if (existing) {
                await prisma.rawMaterialOrder.update({
                    where: { erpId },
                    data: orderData
                });
                importStats.updated++;
            } else {
                await prisma.rawMaterialOrder.create({
                    data: {
                        erpId,
                        ...orderData
                    }
                });
                importStats.created++;
            }
        }

        // 2. Mark missing items as Completed
        // Find all currently active items in DB that were NOT in this import
        const missingItems = await prisma.rawMaterialOrder.findMany({
            where: {
                isCompleted: false,
                erpId: { notIn: Array.from(importedErpIds) }
            }
        });

        if (missingItems.length > 0) {
            await prisma.rawMaterialOrder.updateMany({
                where: {
                    id: { in: missingItems.map(i => i.id) }
                },
                data: {
                    isCompleted: true,
                    status: 'COMPLETADO (100% ERP)',
                    unitsPending: 0, // Force pending to 0 if it disappeared from open lines
                }
            });
            importStats.completed = missingItems.length;
        }

        return NextResponse.json({
            success: true,
            stats: importStats,
            totalProcessed: jsonData.length
        });

    } catch (e: any) {
        console.error("Import Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
