
import { PrismaClient } from '@prisma/client';
import path from 'path';

// We need to override the datasource url to point to the backup file for checking
// But Prisma Client is generated with env var. 
// We can use a separate prisma schema or just copy the backup to a temp name and point ENV to it?
// Easier: Copy backup to 'prisma/check.db' and instantiate client if we can override?
// Or just use raw sqlite3? No, let's use Prisma but point env?
// Actually, safely:
// 1. Copy backup to prisma/check.db
// 2. Set DATABASE_URL=file:./check.db in process.env before instantiating? 
// PrismaClient usually reads env at instantiation or generation? Generation usually burns it in? 
// No, it reads env at runtime usually.

import fs from 'fs';
import { execSync } from 'child_process';

const backupFile = 'backups/dev_2026-01-15_19-18.db';
const checkFile = 'prisma/check.db';

async function main() {
    try {
        console.log(`Copying ${backupFile} to ${checkFile}...`);
        fs.copyFileSync(backupFile, checkFile);

        // Instantiate PrismaClient with explicit datasourceUrl
        // Note: this requires a recent Prisma version.
        const prisma = new PrismaClient({
            datasources: {
                db: {
                    url: 'file:./check.db',
                },
            },
        });

        try {
            const users = await prisma.user.count();
            const clients = await prisma.client.count();
            const formulas = await prisma.formula.count();
            const briefings = await prisma.briefing.count();
            const offers = await prisma.offer.count();

            console.log('--- BACKUP CONTENTS ---');
            console.log(`Users: ${users}`);
            console.log(`Clients: ${clients}`);
            console.log(`Formulas: ${formulas}`);
            console.log(`Briefings: ${briefings}`);
            console.log(`Offers: ${offers}`);
            console.log('-----------------------');

        } finally {
            await prisma.$disconnect();
            // Clean up
            fs.unlinkSync(checkFile);
        }

    } catch (e) {
        console.error('Error checking backup:', e);
    }
}

main();
