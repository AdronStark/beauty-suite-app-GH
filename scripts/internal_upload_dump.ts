// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import dotenv from 'dotenv';

// Load envs from .env.migration manually
dotenv.config({ path: '.env.migration' });

async function upload() {
    console.log('🔌 Connecting to Cloud Database...');
    const prisma = new PrismaClient(); // Now this uses the Postgres Client we just generated

    const rawData = fs.readFileSync('migration_dump.json', 'utf-8');
    const data = JSON.parse(rawData);

    // Helper for batch inserts (using createMany would be faster but upsert is safer for conflicts)
    // Actually, for migration to empty DB, createMany is best.
    // But foreign keys matter.

    // 1. Independent Tables
    console.log('Inserting Companies...');
    if (data.companies.length) await prisma.company.createMany({ data: data.companies, skipDuplicates: true });

    console.log('Inserting Users...');
    if (data.users.length) await prisma.user.createMany({ data: data.users, skipDuplicates: true });

    console.log('Inserting Configurations...');
    if (data.configurations.length) await prisma.configuration.createMany({ data: data.configurations, skipDuplicates: true });

    console.log('Inserting Reactors...');
    if (data.reactors.length) await prisma.reactor.createMany({ data: data.reactors, skipDuplicates: true });

    console.log('Inserting Holidays...');
    if (data.holidays.length) await prisma.holiday.createMany({ data: data.holidays, skipDuplicates: true });

    // 2. Dependent Tables (Level 1)
    console.log('Inserting Clients...');
    if (data.clients.length) await prisma.client.createMany({ data: data.clients, skipDuplicates: true });

    console.log('Inserting SalesBudgets...');
    if (data.salesBudgets.length) await prisma.salesBudget.createMany({ data: data.salesBudgets, skipDuplicates: true });

    console.log('Inserting Briefings...');
    if (data.briefings.length) await prisma.briefing.createMany({ data: data.briefings, skipDuplicates: true });

    console.log('Inserting ProductionBlocks...');
    if (data.productionBlocks.length) await prisma.productionBlock.createMany({ data: data.productionBlocks, skipDuplicates: true });

    console.log('Inserting ReactorMaintenances...');
    if (data.reactorMaintenances.length) await prisma.reactorMaintenance.createMany({ data: data.reactorMaintenances, skipDuplicates: true });

    // 3. Dependent Tables (Level 2)
    console.log('Inserting Formulas...');
    if (data.formulas.length) await prisma.formula.createMany({ data: data.formulas, skipDuplicates: true });

    console.log('Inserting Offers...');
    // Offers link to Briefing (optional) and Client (string name). Should be safe.
    if (data.offers.length) await prisma.offer.createMany({ data: data.offers, skipDuplicates: true });

    // 4. Dependent Tables (Level 3)
    console.log('Inserting StabilityTests...');
    // Fetch valid Formula IDs to prevent FK errors from local orphans
    const validFormulaIds = new Set((await prisma.formula.findMany({ select: { id: true } })).map(f => f.id));

    const validStabilityTests = data.stabilityTests.filter(t => validFormulaIds.has(t.formulaId));
    console.log(`Filtered ${data.stabilityTests.length - validStabilityTests.length} orphan StabilityTests.`);

    if (validStabilityTests.length) await prisma.stabilityTest.createMany({ data: validStabilityTests, skipDuplicates: true });

    console.log('Inserting Samples...');
    const validSamples = data.samples.filter(s => validFormulaIds.has(s.formulaId));
    console.log(`Filtered ${data.samples.length - validSamples.length} orphan Samples.`);

    if (validSamples.length) await prisma.sample.createMany({ data: validSamples, skipDuplicates: true });

    console.log('✅ Upload successful.');
    await prisma.$disconnect();
}

upload().catch(e => {
    console.error('❌ Upload Failed:', e);
    process.exit(1);
});
