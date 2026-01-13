
import { prisma } from '@/lib/db/prisma';

async function main() {
    console.log("Starting code migration...");

    // 1. Fetch offers starting with OF
    const offers = await prisma.offer.findMany({
        where: {
            code: { startsWith: 'OF' }
        }
    });

    console.log(`Found ${offers.length} offers to migrate.`);

    for (const offer of offers) {
        if (!offer.code) continue;

        // Replace OF with Q
        const newCode = offer.code.replace(/^OF/, 'Q');

        console.log(`Migrating ${offer.code} -> ${newCode}`);

        try {
            await prisma.offer.update({
                where: { id: offer.id },
                data: { code: newCode }
            });
        } catch (e: any) {
            console.error(`Failed to update ${offer.id}: ${e.message}`);
        }
    }

    console.log("Migration complete.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
