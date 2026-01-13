
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const JSON_PATH = path.join(process.cwd(), 'data/initial_packaging_rules.json');

async function main() {
    if (!fs.existsSync(JSON_PATH)) {
        console.error('JSON file not found:', JSON_PATH);
        process.exit(1);
    }

    const content = fs.readFileSync(JSON_PATH, 'utf-8');
    const data = JSON.parse(content);

    console.log(`Seeding ${data.rules.length} rules into Configuration...`);

    // We store the array of rules directly under 'OFFER_PACKAGING_RULES' key
    await prisma.configuration.upsert({
        where: { key: 'OFFER_PACKAGING_RULES' },
        update: { value: JSON.stringify(data.rules) },
        create: {
            key: 'OFFER_PACKAGING_RULES',
            value: JSON.stringify(data.rules)
        }
    });

    console.log('Successfully seeded packaging rules.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
