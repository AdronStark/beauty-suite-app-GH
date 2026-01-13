
import { prisma } from '@/lib/db/prisma';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

async function main() {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    console.log(`Checking interval: ${monthStart.toISOString()} - ${monthEnd.toISOString()}`);

    const blocks = await prisma.productionBlock.findMany({
        where: {
            OR: [
                { status: 'PRODUCED' },
                { status: 'FINALIZED' }
            ]
        }
    });

    console.log(`Total PRODUCED/FINALIZED blocks in DB: ${blocks.length}`);

    const monthlyProducedBlocks = blocks.filter(b =>
        b.updatedAt >= monthStart &&
        b.updatedAt <= monthEnd
    );

    console.log(`Blocks counted for this month (updatedAt in range): ${monthlyProducedBlocks.length}`);

    let totalSum = 0;
    let fallbackInfo = [];

    monthlyProducedBlocks.forEach(b => {
        const value = b.realKg || b.units;
        const usedFallback = !b.realKg && b.units > 0;

        totalSum += value;

        console.log(`[${b.id}] ${b.articleDesc}: Status=${b.status}, UpdatedAt=${b.updatedAt.toISOString()}, RealKg=${b.realKg}, Units=${b.units} => Contributed: ${value} ${usedFallback ? '(FALLBACK USED)' : ''}`);

        if (usedFallback) fallbackInfo.push(b);
    });

    console.log(`\nTotal Calculated: ${totalSum}`);
    console.log(`Count using Fallback (RealKg is null/0): ${fallbackInfo.length}`);
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
