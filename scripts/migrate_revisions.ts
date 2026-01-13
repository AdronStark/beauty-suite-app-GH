
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start migrating revisions...');

    // Update all offers where revision might be null (though schema says default 0, strict null checks might find issues if raw sql was used or migration failed)
    // Actually, since I can't easily check for 'null' if the type is Int (not Int?), I will just update all that are not set or just set all to 0 if they lack it.
    // But strictly, Prisma client types might say it's required. Let's try to updateMany.

    // Since we added the column recently, existing rows might have it as default 0. 
    // But let's force update just to be sure if there are any quirks.

    // However, I can't filter by `revision: null` if the schema says it's non-nullable Int.
    // I will just run an updateMany for all, but that's risky if some are already 1.
    // Better approach: Find all, check if revision is somehow missing or default.
    // Actually, if the schema is `Int @default(0)`, then `db push` would have backfilled 0.

    // Let's just print them to check.
    const offers = await prisma.offer.findMany();
    console.log(`Found ${offers.length} offers.`);

    for (const o of offers) {
        console.log(`Offer ${o.code}: Revision ${o.revision}`);
        // If revision is undefined/null (runtime check)
        if (o.revision === null || o.revision === undefined) {
            console.log(`Updating ${o.id} to revision 0`);
            await prisma.offer.update({
                where: { id: o.id },
                data: { revision: 0 }
            });
        }
    }

    console.log('Migration finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
