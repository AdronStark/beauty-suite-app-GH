import { PackagingRepository } from '../lib/packagingRepository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Verifying Packaging Repository People Logic...');

    const config = await prisma.configuration.findUnique({ where: { key: 'OFFER_PACKAGING_RULES' } });
    if (!config) {
        console.error('❌ Config OFFER_PACKAGING_RULES not found in DB!');
        return;
    }

    const rules = JSON.parse(config.value);
    console.log(`✅ Loaded ${rules.length} rules from DB.`);

    // Check one rule
    const sampleRule = rules.find((r: any) => r.people > 0);
    if (sampleRule) {
        console.log('Sample Rule with People:', sampleRule);
    } else {
        console.warn('⚠️ No rules with people > 0 found in DB value!');
    }

    const repo = new PackagingRepository(config.value);

    // Test Case: Tarros, Estándar, 50ml, 500 units, Envasado
    // Rule in Excel: Tarros / Estándar / 0-500ml / Envasado / 0-500 units -> people ?
    const people = repo.getOperationPeople('Tarros', 'Estándar', 50, 500, 'Envasado');
    console.log(`Test Result: Tarros/Estándar/50ml/500u/Envasado -> ${people} people`);

    // Test Case 2: Frascos, Estándar, 100ml, 5000 units, Envasado
    const people2 = repo.getOperationPeople('Frascos', 'Estándar', 100, 5000, 'Envasado');
    console.log(`Test Result 2: Frascos/Estándar/100ml/5000u/Envasado -> ${people2} people`);
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
