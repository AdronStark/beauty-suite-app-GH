
import { prisma } from '@/lib/db/prisma';

async function main() {
    const offers = await prisma.offer.findMany({
        select: { id: true, code: true }
    });

    const ofCodes = offers.filter(o => o.code && o.code.startsWith('OF'));
    const qCodes = offers.filter(o => o.code && o.code.startsWith('Q'));
    const otherCodes = offers.filter(o => o.code && !o.code.startsWith('OF') && !o.code.startsWith('Q'));

    console.log(`Total Offers: ${offers.length}`);
    console.log(`Starting with OF: ${ofCodes.length}`);
    console.log(`Starting with Q: ${qCodes.length}`);
    console.log(`Others: ${otherCodes.length}`);

    if (ofCodes.length > 0) {
        console.log('Sample OF codes:', ofCodes.slice(0, 5).map(o => o.code));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
