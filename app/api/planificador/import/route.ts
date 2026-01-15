import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Helper to find value by aliases
function getValue(row: any, aliases: string[]): any {
    // Row keys should be normalized or we loop through keys
    const rowKeys = Object.keys(row);
    for (const alias of aliases) {
        // Direct match
        if (row[alias] !== undefined) return row[alias];

        // Case insensitive match
        const foundKey = rowKeys.find(k => k.toLowerCase().trim() === alias.toLowerCase());
        if (foundKey && row[foundKey] !== undefined) return row[foundKey];
    }
    return null;
}

// Helper to parse dates from Excel (Serial or String)
function parseExcelDate(value: any): Date | undefined {
    if (!value) return undefined;

    // If number, assume Excel Serial Date (days since 1900-01-01)
    if (typeof value === 'number') {
        // Excel base date correction (approximate)
        return new Date(Math.round((value - 25569) * 86400 * 1000));
    }

    // If string
    if (typeof value === 'string') {
        const trimmed = value.trim();
        // DD/MM/YYYY format
        if (trimmed.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            const [day, month, year] = trimmed.split('/').map(Number);
            return new Date(year, month - 1, day);
        }
        // Try standard ISO
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) return d;
    }

    // If Date object
    if (value instanceof Date && !isNaN(value.getTime())) return value;

    return undefined;
}

// Helper to parse numbers (handling comma as decimal)
function parseExcelNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const str = String(value).replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

export async function POST(request: Request) {
    try {
        const body = await request.json(); // Expecting array of objects

        if (!Array.isArray(body)) {
            return NextResponse.json({ error: 'Expected an array of records' }, { status: 400 });
        }

        const stats = {
            processed: 0,
            created: 0,
            updated: 0,
            closed: 0,
            skipped: 0,
            errors: 0,
            newClients: 0
        };

        const touchedIds: string[] = [];

        // 1. Process Incoming Records (Upsert)
        for (const [index, row] of body.entries()) {
            try {
                // Flexible Mapping
                const erpIdRaw = getValue(row, ['id', 'erp_id', 'id_erp', 'unique_id']);
                const orderRaw = getValue(row, ['numeropedido', 'pedido', 'nº pedido', 'order', 'num_pedido', 'order_number', 'numero pedido']);
                const codeRaw = getValue(row, ['codigoarticulo', 'codigo', 'código', 'articulo', 'artículo', 'ref', 'referencia', 'item_code']);

                const clientRaw = getValue(row, ['razonsocial', 'nombre', 'cliente', 'client', 'customer', 'nombre cliente']);
                const descRaw = getValue(row, ['descripcionarticulo', 'descripcion', 'descripción', 'description', 'nombre articulo']);
                const qtyRaw = getValue(row, ['unidadespendientes', 'cantidad', 'unidades', 'quantity', 'units', 'uds', 'cant']);
                const dateRaw = getValue(row, ['fechanecesaria', 'fechaentrega', 'entrega', 'deadline', 'delivery_date', 'fecha']);
                const orderDateRaw = getValue(row, ['fechapedido', 'fecha_pedido', 'order_date', 'date', 'fecha pedido']);

                // Identifiers
                const erpId = erpIdRaw ? String(erpIdRaw) : null;
                const orderNumber = orderRaw ? String(orderRaw) : null;
                const articleCode = codeRaw ? String(codeRaw) : null;

                if (!erpId && (!orderNumber || !articleCode)) {
                    // Only log if it looks like a data row (has some values)
                    if (Object.keys(row).length > 2) {
                        console.warn(`Skipping row ${index} due to missing IDs:`, row);
                        stats.errors++;
                    }
                    continue; // Skip empty/invalid rows without error count if just empty
                }

                // FILTERING RULES
                // Rule: Strictly XXXFXXX (3 digits, 1 letter, 3 digits)
                // Excludes everything else (including 'env')
                const strictFormat = /^\d{3}[a-zA-Z]\d{3}$/;

                if (articleCode && !strictFormat.test(articleCode)) {
                    // console.log(`Skipping invalid format: ${articleCode}`);
                    stats.skipped++;
                    continue;
                }

                // Construct Unique Identifier Logic for DB lookup
                let existingBlock = null;
                if (erpId) {
                    existingBlock = await prisma.productionBlock.findFirst({ where: { erpId } });
                } else if (orderNumber && articleCode) {
                    existingBlock = await prisma.productionBlock.findFirst({
                        where: { orderNumber, articleCode, status: { not: 'PRODUCED' } }
                    });
                }

                // Data mapping
                const blockData = {
                    erpId: erpId || undefined,
                    articleCode: articleCode || 'UNKNOWN',
                    articleDesc: descRaw ? String(descRaw) : 'Sin descripción',
                    clientName: clientRaw ? String(clientRaw) : 'Sin Cliente',
                    orderNumber: orderNumber || undefined,
                    units: parseExcelNumber(qtyRaw),
                    unitsOrdered: parseExcelNumber(qtyRaw), // Assuming full order if importing pending
                    deadline: parseExcelDate(dateRaw),
                    orderDate: parseExcelDate(orderDateRaw) || undefined,
                };

                if (existingBlock) {
                    // Update
                    const updated = await prisma.productionBlock.update({
                        where: { id: existingBlock.id },
                        data: blockData
                    });
                    touchedIds.push(updated.id);
                    stats.updated++;
                } else {
                    // Create New
                    const created = await prisma.productionBlock.create({
                        data: {
                            ...blockData,
                            status: 'PENDING',
                            // Default values for required fields if any? (Model allows defaults)
                        }
                    });
                    touchedIds.push(created.id);
                    stats.created++;
                }
                stats.processed++;

            } catch (err: any) {
                console.error(`Error processing row ${index}:`, row, err);
                stats.errors++;
                // Continue processing other rows? Yes, partial success is better.
            }
        }

        // SAFETY GUARD: If we didn't match ANY valid rows, Do NOT close anything.
        // It implies the file column mapping failed completely.
        if (touchedIds.length === 0) {
            const firstRowHeaders = body.length > 0 ? Object.keys(body[0]).join(', ') : 'None';
            return NextResponse.json({
                success: false,
                error: `No records processed. Headers: [${firstRowHeaders}]. Errors: ${stats.errors}`,
                stats
            });
        }

        // 2. Sync / Close Logic (The "Double Check")
        // Find all blocks that are PENDING or PLANNED but NOT in the touched list
        try {
            const missingBlocks = await prisma.productionBlock.findMany({
                where: {
                    id: { notIn: touchedIds },
                    status: { in: ['PENDING', 'PLANNED'] }
                }
            });

            if (missingBlocks.length > 0) {
                await prisma.productionBlock.updateMany({
                    where: {
                        id: { in: missingBlocks.map(b => b.id) }
                    },
                    data: {
                        status: 'PRODUCED',
                        unitsPending: 0,
                    }
                });
                stats.closed = missingBlocks.length;
            }
        } catch (syncErr) {
            console.error("Sync error:", syncErr);
            // Don't fail the whole request if closing fails
        }

        // --- CLIENT SYNC LOGIC ---
        // Extract unique clients from the processed rows (body)
        const uniqueClients = new Map<string, { name: string, businessName?: string, erpId?: string }>();

        for (const row of body) {
            // Strict mapping based on user screenshot:
            // S: RazonSocial -> businessName
            // T: Nombre -> clientName (Display Name)
            // R: CodigoCliente -> erpId

            // We use 'getValue' with specific aliases matching the screenshot headers exactly
            const clientName = getValue(row, ['Nombre', 'nombre']);
            const businessName = getValue(row, ['RazonSocial', 'razonsocial', 'razón social', 'Razon Social']);
            const erpId = getValue(row, ['CodigoCliente', 'codigocliente', 'codigo cliente', 'Codigo Cliente']);

            if (clientName || businessName) {
                // Use businessName as name if clientName is missing, or vice versa
                const finalName = clientName ? String(clientName).trim() : String(businessName).trim();
                const finalBusinessName = businessName ? String(businessName).trim() : finalName;
                const finalErpId = erpId ? String(erpId) : undefined;

                // Key for deduplication in this batch
                const key = finalErpId ? String(finalErpId) : finalName;

                if (!uniqueClients.has(key)) {
                    uniqueClients.set(key, {
                        name: finalName,
                        businessName: finalBusinessName,
                        erpId: finalErpId
                    });
                }
            }
        }

        if (uniqueClients.size > 0) {
            try {
                const candidates = Array.from(uniqueClients.values());

                // INTERNAL DEDUPLICATION ALREADY DONE BY MAP KEY IN PREVIOUS STEP
                // Now check against Database using "Business Name" (Razon Social) as the SINGLE TRUTH
                // We normalize names for comparison (trim + lowercase)

                const businessNamesToCheck = candidates.map(c => (c.businessName || c.name || "").trim());

                // Fetch existing clients where businessName matches or name matches
                const existingClients = await prisma.client.findMany({
                    where: {
                        OR: [
                            { businessName: { in: businessNamesToCheck } }, // Exact match
                            { name: { in: businessNamesToCheck } }          // Check name field too just in case
                        ]
                    },
                    select: { name: true, businessName: true }
                });

                // Create a Set of normalized existing names for fast lookup
                const existingSet = new Set<string>();
                existingClients.forEach(c => {
                    if (c.businessName) existingSet.add(c.businessName.toLowerCase().trim());
                    if (c.name) existingSet.add(c.name.toLowerCase().trim());
                });

                const newClientsToCreate = [];

                for (const candidate of candidates) {
                    const identifier = (candidate.businessName || candidate.name).toLowerCase().trim();

                    if (!existingSet.has(identifier)) {
                        newClientsToCreate.push({
                            name: candidate.name, // Display Name
                            businessName: candidate.businessName, // The "Unique" ID effectively
                            erpId: candidate.erpId, // Just a reference now, not unique
                            source: 'ERP'
                        });
                    }
                }

                if (newClientsToCreate.length > 0) {
                    let createdCount = 0;
                    for (const clientData of newClientsToCreate) {
                        try {
                            await prisma.client.create({ data: clientData });
                            createdCount++;
                        } catch (e) {
                            // Catch race conditions where it might have been created milliseconds ago
                        }
                    }
                    stats.newClients = createdCount;
                    stats.newClients = createdCount;
                    // console.log(`[Import] Successfully created ${createdCount} new clients (matched by Business Name).`);
                } else {
                    console.log(`[Import] No new clients to create (all exist by Name/BusinessName).`);
                }

            } catch (clientErr) {
                console.error("Client Sync Error:", clientErr);
            }
        } else {
            // DEBUG: If no clients found, log what headers we ARE seeing
            if (body.length > 0) {
                const firstRowKeys = Object.keys(body[0]);
                console.log("[Import Debug] No clients found. Headers seen in first row:", firstRowKeys);
            }
        }

        // Return stats AND debug info
        return NextResponse.json({
            success: true,
            stats,
            debugHeaders: body.length > 0 ? Object.keys(body[0]) : []
        });

        return NextResponse.json({ success: true, stats });

    } catch (error: any) {
        console.error('Import Main Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to process import' }, { status: 500 });
    }
}
