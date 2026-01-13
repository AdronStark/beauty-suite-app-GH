
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting STRICT cleanup of formulas...');

    // 1. Fetch all formulas
    const allFormulas = await prisma.formula.findMany({
        select: { id: true, code: true }
    });

    console.log(`Total formulas scanned: ${allFormulas.length}`);

    // 2. Filter invalid codes (Must match F followed by numbers, e.g., F260010)
    // We allow "F" followed by some digits. If it contains spaces or "Formula", it's bad.
    const regex = /^F\d+/;

    const invalidIds: string[] = [];

    for (const f of allFormulas) {
        // If code is null, handle it
        if (!f.code) {
            invalidIds.push(f.id);
            continue;
        }

        // Check pattern
        // It must pass the regex AND not contain "Formula" (which starts with F but is bad in this context if regex is just F\d+)
        // Actually ^F\d+ ensures it starts with F and then a digit. "Formula" starts with F then 'o'. So it fails ^F\d+.
        // So checking regex ^F\d+ is sufficient.
        if (!regex.test(f.code)) {
            console.log(`Marking for deletion: ${f.code} (ID: ${f.id})`);
            invalidIds.push(f.id);
        }
    }

    console.log(`Found ${invalidIds.length} invalid formulas to delete.`);

    if (invalidIds.length > 0) {
        const result = await prisma.formula.deleteMany({
            where: {
                id: {
                    in: invalidIds
                }
            }
        });
        console.log(`Deleted ${result.count} formulas.`);
    } else {
        console.log('No invalid formulas found.');
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
