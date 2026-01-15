
import { prisma } from '@/lib/db/prisma';

async function main() {
    const items = await prisma.rawMaterialOrder.findMany({
        take: 5,
        select: {
            orderNumber: true,
            unitsOrdered: true,
            unitsReceived: true,
            unitsPending: true
        }
    });
    console.log('Sample Raw Materials Data:', JSON.stringify(items, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
