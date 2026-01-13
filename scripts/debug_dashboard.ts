
import { prisma } from '../lib/db/prisma';
import { startOfWeek, endOfWeek, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';

async function main() {
    console.log('--- DEBUG DASHBOARD DATA ---');
    const now = new Date(); // Use system time
    console.log(`Current Time (System): ${now.toISOString()}`);
    console.log(`Current Time (Local String): ${now.toString()}`);

    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    console.log(`Week Interval: ${weekStart.toISOString()} - ${weekEnd.toISOString()}`);

    // Fetch all blocks
    const blocks = await prisma.productionBlock.findMany();
    console.log(`Total blocks found: ${blocks.length}`);

    // Check sample block dates
    if (blocks.length > 0) {
        console.log('Sample Block Dates:');
        blocks.slice(0, 5).forEach(b => {
            console.log(`ID: ${b.id}, Planned: ${b.plannedDate?.toISOString()}, Status: ${b.status}, Units: ${b.units}`);
        });
    }

    // Simulate Weekly Trend
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    days.forEach(day => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const dayBlocks = blocks.filter(b =>
            b.plannedDate &&
            b.plannedDate >= dayStart &&
            b.plannedDate <= dayEnd
        );

        console.log(`Day: ${day.toISOString()} (${dayStart.toISOString()} - ${dayEnd.toISOString()}) -> Count: ${dayBlocks.length}`);
        if (dayBlocks.length > 0) {
            dayBlocks.forEach(b => console.log(`   - MATCH: ${b.id} (${b.plannedDate?.toISOString()})`));
        }
    });

}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
