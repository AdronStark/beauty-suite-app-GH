
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking OFFER_PACKAGING_RULES...');
    const config = await prisma.configuration.findUnique({
        where: { key: 'OFFER_PACKAGING_RULES' }
    });

    if (!config) {
        console.log('OFFER_PACKAGING_RULES not found in DB.');
    } else {
        console.log(`Value length: ${config.value.length}`);
        const parsed = JSON.parse(config.value);
        console.log(`Parsed Array Length: ${parsed.length}`);
        console.log('First Item:', parsed[0]);
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
