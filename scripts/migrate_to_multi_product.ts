const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateData() {
    console.log("🚀 Starting data migration for Multi-Product offers...");

    try {
        const offers = await prisma.offer.findMany({
            include: { items: true }
        });

        console.log(`Checking ${offers.length} offers...`);

        for (const offer of offers) {
            // Check if already migrated (has items)
            if (offer.items && offer.items.length > 0) {
                console.log(`Create Item for Offer ${offer.id} SKIPPED (Already has items)`);
                continue;
            }

            // Create first item from existing fields
            console.log(`Migrating Offer ${offer.code} - ${offer.product}...`);
            await prisma.offerItem.create({
                data: {
                    offerId: offer.id,
                    productName: offer.product || 'Sin Nombre',
                    inputData: offer.inputData || '{}',
                    resultsSummary: offer.resultsSummary || '{}',
                    order: 0
                }
            });
        }

        console.log("✅ Migration completed successfully!");

    } catch (e) {
        console.error("❌ Migration failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

migrateData();
