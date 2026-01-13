
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const holidays = await prisma.holiday.findMany({
        orderBy: { date: 'asc' }
    });

    console.log('-- ALL HOLIDAYS --');
    holidays.forEach(h => {
        console.log(`ID: ${h.id} | Date: ${h.date.toISOString()} | Desc: ${h.description}`);
    });

    const target = new Date('2026-01-06').toISOString().split('T')[0];
    const found = holidays.find(h => h.date.toISOString().startsWith(target)); // Simple check

    if (found) {
        console.log(`\n[OK] Holiday found for ${target}:`, found);
    } else {
        console.log(`\n[FAIL] Holiday NOT found for ${target}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
