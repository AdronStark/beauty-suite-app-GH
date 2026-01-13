
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking for remaining invalid formulas...');

    const allFormulas = await prisma.formula.findMany({
        select: {
            id: true,
            code: true,
            name: true
        }
    });

    console.log(`Total formulas in DB: ${allFormulas.length}`);

    const invalid = allFormulas.filter(f => {
        if (!f.code) return true; // Null or empty string
        if (!f.code.startsWith('F')) return true;
        return false;
    });

    console.log(`Found ${invalid.length} INVALID formulas.`);

    if (invalid.length > 0) {
        console.log('--- Invalid Examples ---');
        invalid.slice(0, 10).forEach(f => {
            console.log(`ID: ${f.id} | Code: "${f.code}" | Name: ${f.name}`);
        });
    } else {
        console.log('No invalid formulas found based on JS check.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
