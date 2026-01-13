import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COMPANIES = [
    { code: 'COPER', name: 'Coper', color: '#3b82f6' },      // Blue
    { code: 'JUMSA', name: 'Jumsa', color: '#10b981' },      // Green
    { code: 'TERNUM', name: 'Ternum', color: '#f59e0b' },    // Amber
    { code: 'COSME', name: 'Cosmeprint', color: '#8b5cf6' }, // Purple
];

async function main() {
    console.log('🏢 Seeding Companies...\n');

    for (const company of COMPANIES) {
        const c = await prisma.company.upsert({
            where: { code: company.code },
            update: { name: company.name, color: company.color },
            create: company
        });
        console.log(`  ✓ ${c.name} (${c.code})`);
    }

    console.log('\n✅ Companies seeded!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
