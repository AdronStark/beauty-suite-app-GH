import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Paths to legacy data
// Assuming the script is run from beauty-suite-node root
const SUITE_ROOT = path.resolve('..'); // c:\Users\...\Beauty App Suite
const P0_DATA = path.join(SUITE_ROOT, 'Beauty App Suite', 'P0 - Briefings', 'data', 'briefings.json');
const P5_DATA = path.join(SUITE_ROOT, 'Beauty App Suite', 'P5 - Ofertas Beauty', 'offers_db.json');
const P6_DB = path.join(SUITE_ROOT, 'Beauty App Suite', 'P6 - Planificacion Coper', 'planner.db');

async function main() {
    console.log('🚀 Starting Data Migration...');
    console.log('Looking for data at:');
    console.log(`- Briefings: ${P0_DATA}`);
    console.log(`- Offers: ${P5_DATA}`);
    console.log(`- Planner DB: ${P6_DB}`);

    // --- 1. BRIEFINGS MIGRATION ---
    if (fs.existsSync(P0_DATA)) {
        console.log('\n📦 Migrating Briefings...');
        try {
            const rawData = fs.readFileSync(P0_DATA, 'utf-8');
            const briefings = JSON.parse(rawData);

            let count = 0;
            for (const b of briefings) {
                // Map fields
                // Legacy: id, client_name, product_name, category, status...
                await prisma.briefing.create({
                    data: {
                        // If ID conflicts (uuids), we might want to keep it or let prisma gen new one. 
                        // Let's try to keep it if it fits, otherwise omit id to gen new one.
                        // But prisma schema uses String @id, so we can set it.
                        id: b.id,
                        clientName: b.client_name || 'Sin Cliente',
                        productName: b.product_name || 'Sin Producto',
                        category: b.category,
                        status: b.status === 'Completed' ? 'Completed' : 'Draft',
                        formData: JSON.stringify(b), // Store full original data just in case
                        createdAt: b.created_at ? new Date(b.created_at) : new Date(),
                        updatedAt: new Date()
                    }
                });
                count++;
            }
            console.log(`✅ Migrated ${count} briefings.`);
        } catch (e) {
            console.error('Error migrating briefings:', e);
        }
    } else {
        console.log('⚠️ Briefings data file not found.');
    }

    // --- 2. OFERTAS MIGRATION ---
    if (fs.existsSync(P5_DATA)) {
        console.log('\n📦 Migrating Offers...');
        try {
            const rawData = fs.readFileSync(P5_DATA, 'utf-8');
            const offersMap = JSON.parse(rawData); // It's a dict { "id": {obj} }

            let count = 0;
            for (const [key, o] of Object.entries(offersMap)) {
                const offer = o as any;

                await prisma.offer.create({
                    data: {
                        id: offer.id,
                        client: offer.client,
                        product: offer.product,
                        status: offer.status,
                        inputData: JSON.stringify(offer.input_data || {}),
                        resultsSummary: JSON.stringify(offer.results_summary || {}),
                        createdAt: offer.created_at ? new Date(offer.created_at) : new Date(),
                        updatedAt: offer.updated_at ? new Date(offer.updated_at) : new Date(),
                    }
                });
                count++;
            }
            console.log(`✅ Migrated ${count} offers.`);
        } catch (e) {
            console.error('Error migrating offers:', e);
        }
    } else {
        console.log('⚠️ Offers data file not found.');
    }

    // --- 3. PLANIFICADOR MIGRATION ---
    if (fs.existsSync(P6_DB)) {
        console.log('\n📦 Migrating Production Planner...');
        try {
            const legacyDb = new Database(P6_DB, { readonly: true });

            // Get Production Blocks
            const stmt = legacyDb.prepare('SELECT * FROM production_blocks');
            const rows = stmt.all();

            let count = 0;
            for (const row of rows as any[]) {
                // Schema mapping
                // id (legacy text) -> id
                // erp_id -> erpId

                await prisma.productionBlock.create({
                    data: {
                        id: String(row.id),
                        erpId: row.erp_id,
                        articleCode: row.article_code || '',
                        articleDesc: row.article_desc || '',
                        clientName: row.client_name || '',
                        orderNumber: row.order_number,
                        units: parseFloat(row.units) || 0,
                        status: row.status || 'PENDING',

                        // Dates are strings YYYY-MM-DD in legacy
                        deadline: row.deadline ? new Date(row.deadline) : null,
                        orderDate: row.order_date ? new Date(row.order_date) : null,
                        plannedDate: row.planned_date ? new Date(row.planned_date) : null,

                        plannedReactor: row.planned_reactor,
                        plannedShift: row.planned_shift,
                        batchLabel: row.batch_label,

                        unitsOrdered: row.units_ordered ? parseFloat(row.units_ordered) : null,
                        unitsServed: row.units_served ? parseFloat(row.units_served) : null,
                        unitsPending: row.units_pending ? parseFloat(row.units_pending) : null,
                    }
                });
                count++;
            }
            console.log(`✅ Migrated ${count} production blocks.`);

            // Get Holidays
            try {
                const holRows = legacyDb.prepare('SELECT * FROM holidays').all();
                let hCount = 0;
                for (const h of holRows as any[]) {
                    await prisma.holiday.create({
                        data: {
                            date: new Date(h.date),
                            description: h.description
                        }
                    });
                    hCount++;
                }
                console.log(`✅ Migrated ${hCount} holidays.`);
            } catch (e) {
                console.log('No holidays table found or empty.');
            }

            legacyDb.close();

        } catch (e) {
            console.error('Error migrating planner:', e);
        }
    } else {
        console.log('⚠️ Planner DB file not found.');
    }

    console.log('\n✨ Migration Complete!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
