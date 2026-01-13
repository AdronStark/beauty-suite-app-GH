import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗓️ Checking for future dates in offers...');

    const today = new Date();
    const offers = await prisma.offer.findMany({
        where: {
            createdAt: { gt: today }
        }
    });

    console.log(`Found ${offers.length} offers with future dates.`);

    for (const offer of offers) {
        // Generate a random date between Jan 1st 2026 and Today
        const start = new Date(2026, 0, 1).getTime();
        const end = today.getTime();
        const newDate = new Date(start + Math.random() * (end - start));

        // Ensure "Deliver by" and "Close by" dates are also consistent (future relative to created, but maybe still in future relative to now? User just said created date > today is impossible)
        // Actually, let's just shift the valid creation date.

        await prisma.offer.update({
            where: { id: offer.id },
            data: {
                createdAt: newDate,
                updatedAt: newDate
            }
        });
        console.log(`  ✓ Updated ${offer.code} (${offer.client}): ${offer.createdAt.toLocaleDateString()} -> ${newDate.toLocaleDateString()}`);
    }

    console.log('✅ Date correction complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
