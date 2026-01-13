// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';

// Helper to execute shell commands
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

async function main() {
    console.log('🚀 Starting "Magic Migration" from Local SQLite to Vercel Postgres...');

    // 1. Read Local Data (SQLite)
    console.log('📦 Reading local data...');
    const prismaSqlite = new PrismaClient();

    const data = {
        users: await prismaSqlite.user.findMany(),
        companies: await prismaSqlite.company.findMany(),
        clients: await prismaSqlite.client.findMany(),
        reactors: await prismaSqlite.reactor.findMany(),
        configurations: await prismaSqlite.configuration.findMany(),
        holidays: await prismaSqlite.holiday.findMany(),
        briefings: await prismaSqlite.briefing.findMany(),
        formulas: await prismaSqlite.formula.findMany(),
        offers: await prismaSqlite.offer.findMany(),
        productionBlocks: await prismaSqlite.productionBlock.findMany(),
        reactorMaintenances: await prismaSqlite.reactorMaintenance.findMany(),
        salesBudgets: await prismaSqlite.salesBudget.findMany(),
        stabilityTests: await prismaSqlite.stabilityTest.findMany(),
        samples: await prismaSqlite.sample.findMany(),
    };

    await prismaSqlite.$disconnect();
    console.log(`✅ Loaded ${Object.values(data).reduce((acc, arr) => acc + arr.length, 0)} records from local DB.`);

    // 2. Get Cloud Credentials
    console.log('☁️  Fetching Vercel Credentials...');
    if (!fs.existsSync('.env.migration')) {
        try {
            // Pull envs to a temp file
            run('npx vercel env pull .env.migration --yes');
        } catch (e) {
            console.error('❌ Failed to pull Vercel envs. Are you logged in? Run "npx vercel login".');
            // If manual file provided using run_command, we might not need to fail hard here?
            // But we already wrote it, so checking existence first is the fix.
        }
    } else {
        console.log('⚡ Using existing .env.migration file.');
    }

    // Load credentials
    const envConfig = dotenv.parse(fs.readFileSync('.env.migration'));

    // Helper to strip quotes if possibly present (PowerShell artifact)
    const clean = (val) => val ? val.replace(/^['"]|['"]$/g, '') : val;

    const postgresUrl = clean(envConfig.POSTGRES_PRISMA_URL);
    const directUrl = clean(envConfig.POSTGRES_URL_NON_POOLING);

    if (!postgresUrl) {
        console.error('❌ POSTGRES_PRISMA_URL not found in Vercel env.');
        process.exit(1);
    }

    // 3. Swap Schema & Generate Client for Postgres
    console.log('🔄 Switching to Postgres Driver...');
    fs.copyFileSync('prisma/schema.postgres.prisma', 'prisma/schema.prisma');

    // We need to inject the ENV vars for the generation/runtime
    process.env.POSTGRES_PRISMA_URL = postgresUrl;
    process.env.POSTGRES_URL_NON_POOLING = directUrl;

    run('npx prisma generate');

    // 4. Connect to Cloud DB
    // IMPORTANT: We must require PrismaClient freshly AFTER generation
    // Because ESM/CommonJS caching might hold the old one, we rely on the fact 
    // that 'npx tsx' restarts the process? No, this is one script.
    // Actually, in Node, require cache persists. 
    // We might need to spawn a subprocess to write the data to ensure clean Client load.

    // Let's dump data to a JSON file and run a separate "insert" script.
    fs.writeFileSync('migration_dump.json', JSON.stringify(data, null, 2));
    console.log('💾 Data dumped to migration_dump.json');

    console.log('📤 Launching Uploader Sub-process...');
    run('npx tsx scripts/internal_upload_dump.ts');

    // 5. Cleanup
    console.log('🧹 Cleaning up...');
    fs.copyFileSync('prisma/schema.sqlite.backup', 'prisma/schema.prisma'); // Wait, we need a backup
    // Actually, let's assuming schema.prisma IS the sqlite default.
    // I need to ensure I can restore it. 
    // I will use 'git checkout prisma/schema.prisma' at the end to be safe, 
    // or just copy from a known source if I had one. 
    // Better: Creating a backup now.
}

// Wrapper to handle the flow which requires restart/subprocess
if (require.main === module) {
    // 0. Backup Schema
    if (fs.existsSync('prisma/schema.prisma')) {
        fs.copyFileSync('prisma/schema.prisma', 'prisma/schema.sqlite.backup');
    }

    main().catch(e => {
        console.error(e);
        // Restore schema on fail
        if (fs.existsSync('prisma/schema.sqlite.backup')) {
            fs.copyFileSync('prisma/schema.sqlite.backup', 'prisma/schema.prisma');
            run('npx prisma generate');
        }
    }).then(() => {
        // Restore schema on success
        if (fs.existsSync('prisma/schema.sqlite.backup')) {
            fs.copyFileSync('prisma/schema.sqlite.backup', 'prisma/schema.prisma');
            run('npx prisma generate');
            fs.unlinkSync('prisma/schema.sqlite.backup');
            fs.unlinkSync('.env.migration');
            fs.unlinkSync('migration_dump.json');
            console.log('✨ Migration Complete! Your local data is now in the Cloud.');
        }
    });
}
