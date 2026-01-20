
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Fetching offers via raw SQL...');
        // Use raw query to bypass schema validation and get 'product' column if it exists
        const offers: any[] = await prisma.$queryRaw`SELECT * FROM Offer`;

        console.log(`Found ${offers.length} offers.`);

        console.log('Fetching offer items...');
        const items: any[] = await prisma.$queryRaw`SELECT * FROM OfferItem`;
        console.log(`Found ${items.length} items.`);

        const backupData = {
            offers,
            items
        };

        // Convert BigInt to string handling for JSON serialization if needed
        const serialized = JSON.stringify(backupData, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
            , 2);

        const backupPath = path.join(process.cwd(), 'backup_data.json');
        fs.writeFileSync(backupPath, serialized);
        console.log(`Data backed up to ${backupPath}`);

    } catch (e) {
        console.error('Error exporting data:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
