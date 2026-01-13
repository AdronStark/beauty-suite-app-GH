import { PrismaClient } from '@prisma/client';
import fs from 'fs';

async function main() {
    console.log('📦 Reading local data (SQLite)...');
    const prisma = new PrismaClient();

    try {
        const data = {
            users: await prisma.user.findMany(),
            companies: await prisma.company.findMany(),
            clients: await prisma.client.findMany(),
            reactors: await prisma.reactor.findMany(),
            configurations: await prisma.configuration.findMany(),
            holidays: await prisma.holiday.findMany(),
            briefings: await prisma.briefing.findMany(),
            formulas: await prisma.formula.findMany(),
            offers: await prisma.offer.findMany(),
            productionBlocks: await prisma.productionBlock.findMany(),
            reactorMaintenances: await prisma.reactorMaintenance.findMany(),
            salesBudgets: await prisma.salesBudget.findMany(),
            stabilityTests: await prisma.stabilityTest.findMany(),
            samples: await prisma.sample.findMany(),
        };

        console.log(`✅ Loaded ${Object.values(data).reduce((acc, arr) => acc + arr.length, 0)} records.`);

        fs.writeFileSync('migration_dump.json', JSON.stringify(data, null, 2));
        console.log('💾 Data exported to migration_dump.json');
    } catch (e) {
        console.error('❌ Export failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
