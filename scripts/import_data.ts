
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    try {
        const backupPath = path.join(process.cwd(), 'backup_data.json');
        if (!fs.existsSync(backupPath)) {
            throw new Error('Backup file not found');
        }

        const rawData = fs.readFileSync(backupPath, 'utf8');
        const data = JSON.parse(rawData);

        const offers = data.offers || (Array.isArray(data) ? data : []);
        const items = data.items || [];

        console.log(`Restoring ${offers.length} offers...`);

        for (const offer of offers) {
            // Map 'product' to 'description'
            const { product, ...rest } = offer;

            // If 'description' is already in rest (unlikely if strictly raw from old DB), fine.
            // If not, use product.
            const offerData = {
                ...rest,
                description: rest.description || product || 'Sin Descripción',
                // Ensure dates are parsed if they come as strings
                createdAt: new Date(rest.createdAt),
                updatedAt: new Date(rest.updatedAt),
                expectedCloseDate: rest.expectedCloseDate ? new Date(rest.expectedCloseDate) : null,
                fechaEntrega: rest.fechaEntrega ? new Date(rest.fechaEntrega) : null,
                sentAt: rest.sentAt ? new Date(rest.sentAt) : null,
                wonAt: rest.wonAt ? new Date(rest.wonAt) : null,
                lostAt: rest.lostAt ? new Date(rest.lostAt) : null,
            };

            // Upsert to be safe? Or create. Reset implies empty, so create.
            // But we want to preserve IDs.
            await prisma.offer.create({
                data: offerData
            });
        }
        console.log('Offers restored.');

        if (items.length > 0) {
            console.log(`Restoring ${items.length} items...`);
            for (const item of items) {
                const itemData = {
                    ...item,
                    // Ensure foreign keys exist? Yes, we restored offers first.
                };
                await prisma.offerItem.create({ data: itemData });
            }
            console.log('Items restored.');
        }

    } catch (e) {
        console.error('Error importing data:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
