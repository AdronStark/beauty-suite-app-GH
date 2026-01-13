export { };
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Resetting some probabilities to NULL for visualization testing...');

    // Get latest 5 offers
    const offers = await prisma.offer.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' }
    });

    for (const offer of offers) {
        console.log(`Resetting offer ${offer.code || offer.id}...`);
        await prisma.offer.update({
            where: { id: offer.id },
            data: { probability: null }
        });
    }

    console.log('Done! 5 offers have been reset to Missing Probability.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
