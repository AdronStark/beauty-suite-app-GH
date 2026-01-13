
import { prisma } from '@/lib/db/prisma';
import { startOfMonth, endOfMonth, startOfDay } from 'date-fns';

async function main() {
    const now = new Date();
    const todayStart = startOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    console.log(`Checking interval: ${monthStart.toISOString()} - ${monthEnd.toISOString()}`);

    const blocks = await prisma.productionBlock.findMany({
        where: {
            plannedDate: {
                gte: monthStart,
                lte: monthEnd
            }
        }
    });

    console.log(`Total Blocks Planned in Month: ${blocks.length}`);
    const totalPlannedUnits = blocks.reduce((acc, b) => acc + b.units, 0);
    console.log(`Total Planned Units (Theoretical): ${totalPlannedUnits}`);

    // Break it down
    const produced = blocks.filter(b => b.status === 'PRODUCED' || b.status === 'FINALIZED');
    const producedUnits = produced.reduce((acc, b) => acc + b.units, 0);
    const producedReal = produced.reduce((acc, b) => acc + (b.realKg || 0), 0);

    const future = blocks.filter(b => b.plannedDate >= todayStart && b.status !== 'PRODUCED' && b.status !== 'FINALIZED');
    const futureUnits = future.reduce((acc, b) => acc + b.units, 0);

    // THE GAP: Pending blocks in the past
    const overdue = blocks.filter(b => b.plannedDate < todayStart && b.status !== 'PRODUCED' && b.status !== 'FINALIZED');
    const overdueUnits = overdue.reduce((acc, b) => acc + b.units, 0);

    console.log(`\n--- Breakdown ---`);
    console.log(`Produced Count: ${produced.length}`);
    console.log(`Produced Units (Plan): ${producedUnits}`);
    console.log(`Produced Real (Actual): ${producedReal}`);

    console.log(`\nFuture Pending Count (>= Today): ${future.length}`);
    console.log(`Future Pending Units: ${futureUnits}`);

    console.log(`\nOverdue Pending Count (< Today): ${overdue.length}`);
    console.log(`Overdue Pending Units (THE GAP): ${overdueUnits}`);

    const currentForecast = producedReal + futureUnits;
    const proposedForecast = producedReal + futureUnits + overdueUnits;

    console.log(`\nCurrent Logic Forecast: ${currentForecast}`);
    console.log(`Proposed Logic Forecast: ${proposedForecast}`);
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
