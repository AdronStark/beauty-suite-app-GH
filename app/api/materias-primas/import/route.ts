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
        const validRows: any[] = [];

        // 1. Process Spreadsheet Rows (In Memory)
        for (const row of jsonData as any[]) {
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
                erpId,
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

            validRows.push(orderData);
        }

        // 2. Batch Processing
        // Fetch valid existing IDs
        const existingRecords = await prisma.rawMaterialOrder.findMany({
            where: {
                erpId: { in: Array.from(importedErpIds) }
            },
            select: { erpId: true }
        });

        const existingErpIds = new Set(existingRecords.map(r => r.erpId));

        const toCreate: any[] = [];
        const toUpdate: any[] = [];

        for (const row of validRows) {
            if (existingErpIds.has(row.erpId)) {
                toUpdate.push(row);
            } else {
                toCreate.push(row);
            }
        }

        // A. BULK CREATE
        if (toCreate.length > 0) {
            // Processing in chunks of 100 just to be safe with query size limits
            const CREATE_CHUNK = 100;
            for (let i = 0; i < toCreate.length; i += CREATE_CHUNK) {
                const chunk = toCreate.slice(i, i + CREATE_CHUNK);
                // @ts-ignore - createMany is not available in SQLite (local) but works in Postgres (Vercel)
                await (prisma.rawMaterialOrder as any).createMany({
                    data: chunk
                });
            }
            importStats.created = toCreate.length;
        }

        // B. BULK UPDATE (Simulated via Promise.all with concurrency control)
        // Updating one by one is still necessary with Prisma unless we use raw queries, 
        // but parallelizing it speeds it up massively.
        if (toUpdate.length > 0) {
            const UPDATE_CHUNK = 50; // Concurrency limit
            for (let i = 0; i < toUpdate.length; i += UPDATE_CHUNK) {
                const chunk = toUpdate.slice(i, i + UPDATE_CHUNK);
                await Promise.all(chunk.map((row) =>
                    prisma.rawMaterialOrder.update({
                        where: { erpId: row.erpId },
                        data: {
                            orderYear: row.orderYear,
                            orderDate: row.orderDate,
                            orderNumber: row.orderNumber,
                            articleCode: row.articleCode,
                            articleName: row.articleName,
                            unitsOrdered: row.unitsOrdered,
                            unitsReceived: row.unitsReceived,
                            unitsPending: row.unitsPending,
                            deliveryDate: row.deliveryDate,
                            expectedDate: row.expectedDate,
                            status: row.status,
                            supplierName: row.supplierName,
                            isCompleted: false
                        }
                    })
                ));
            }
            importStats.updated = toUpdate.length;
        }

        // 3. Mark missing items as Completed
        // Find all currently active items in DB that were NOT in this import
        const missingItems = await prisma.rawMaterialOrder.findMany({
            where: {
                isCompleted: false,
                erpId: { notIn: Array.from(importedErpIds) }
            },
            select: { id: true }
        });

        if (missingItems.length > 0) {
            // Update in chunks to avoid "too many variables" error in SQL
            const MISSING_CHUNK = 500;
            const ids = missingItems.map(item => item.id);
            for (let i = 0; i < ids.length; i += MISSING_CHUNK) {
                const chunkIds = ids.slice(i, i + MISSING_CHUNK);
                await prisma.rawMaterialOrder.updateMany({
                    where: {
                        id: { in: chunkIds }
                    },
                    data: {
                        isCompleted: true,
                        status: 'COMPLETADO (100% ERP)',
                        unitsPending: 0,
                    }
                });
            }
            importStats.completed = missingItems.length;
        }

        // 4. Update Last Import Date
        await prisma.configuration.upsert({
            where: { key: 'LAST_RAW_MATERIALS_IMPORT' },
            update: { value: new Date().toISOString() },
            create: { key: 'LAST_RAW_MATERIALS_IMPORT', value: new Date().toISOString() }
        });

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
