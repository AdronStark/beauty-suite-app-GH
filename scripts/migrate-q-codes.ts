import { prisma } from '../lib/db/prisma';

async function migrateQCodes() {
    console.log('Starting Q-Code Migration (Retry)...');

    try {
        const offers = await prisma.offer.findMany({
            where: {
                code: {
                    not: {
                        startsWith: 'Q'
                    }
                }
            }
        });

        console.log(`Found ${offers.length} offers pending migration.`);

        for (const offer of offers) {
            if (!offer.code) {
                console.warn(`Skipping offer ${offer.id} (No code)`);
                continue;
            }

            const newCode = `Q${offer.code}`;

            // Check if target already exists (unlikely unless strict duplicate data)
            const collision = await prisma.offer.findUnique({
                where: {
                    code_revision: {
                        code: newCode,
                        revision: offer.revision
                    }
                }
            });

            if (collision) {
                console.warn(`Collision detected: ${newCode} (rev ${offer.revision}) already exists. Skipping this record to avoid crash.`);
                continue;
            }

            console.log(`Migrating: ${offer.code} -> ${newCode}`);

            await prisma.offer.update({
                where: { id: offer.id },
                data: { code: newCode }
            });
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrateQCodes();
