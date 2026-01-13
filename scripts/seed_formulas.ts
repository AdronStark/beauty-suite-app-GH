
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding formulas...');

    // 1. Clean existing formulas
    await prisma.formula.deleteMany({});
    console.log('Deleted existing formulas.');

    // Helper to create ingredients
    const simpleIng = JSON.stringify([{ name: 'Aqua', percentage: 90, phase: 'A' }, { name: 'Glycerin', percentage: 10, phase: 'B' }]);
    const complexIng = JSON.stringify([
        { name: 'Aqua', percentage: 75, phase: 'A' },
        { name: 'Glycerin', percentage: 5, phase: 'A' },
        { name: 'Xanthan Gum', percentage: 0.5, phase: 'A' },
        { name: 'Caprylic/Capric Triglyceride', percentage: 10, phase: 'B' },
        { name: 'Cetearyl Alcohol', percentage: 3, phase: 'B' },
        { name: 'Glyceryl Stearate', percentage: 2, phase: 'B' },
        { name: 'Preservative', percentage: 1, phase: 'C' },
        { name: 'Fragrance', percentage: 0.5, phase: 'C' }
    ]);

    // Try to find a briefing to link
    const briefing = await prisma.briefing.findFirst();

    const scenarios = [
        // 1. Basic Active Formula (Facial)
        {
            name: 'Crema Hidratante Básica',
            code: 'F001',
            revision: 0,
            category: 'Facial',
            description: 'Hidratante día estándar.',
            ingredients: simpleIng,
            status: 'Active'
        },
        // 2. Versioning: Rev 0 (Old)
        {
            name: 'Champú Revitalizante',
            code: 'F002',
            revision: 0,
            category: 'Capilar',
            description: 'Versión inicial con sulfatos.',
            ingredients: simpleIng,
            status: 'Archived' // Old version
        },
        // 2. Versioning: Rev 1 (Active)
        {
            name: 'Champú Revitalizante (Sulfate Free)',
            code: 'F002',
            revision: 1,
            category: 'Capilar',
            description: 'Nueva versión sin sulfatos.',
            ingredients: simpleIng,
            status: 'Active'
        },
        // 3. Draft Formula
        {
            name: 'Serum Anti-Edad (WIP)',
            code: 'F003',
            revision: 0,
            category: 'Facial',
            description: 'En desarrollo, pendiente de estabilidad.',
            ingredients: '[]',
            status: 'Draft'
        },
        // 4. Sun Care
        {
            name: 'Protector Solar SPF 50',
            code: 'F004',
            revision: 0,
            category: 'Solar',
            description: 'Alta protección UVA/UVB.',
            ingredients: complexIng,
            status: 'Active'
        },
        // 5. Body Care
        {
            name: 'Loción Corporal Aloe',
            code: 'F005',
            revision: 0,
            category: 'Corporal',
            description: 'Calmante post-solar.',
            ingredients: simpleIng,
            status: 'Active'
        },
        // 6. Higienizante
        {
            name: 'Gel Hidroalcohólico',
            code: 'F006',
            revision: 0,
            category: 'Higienizante',
            description: '70% Alcohol.',
            ingredients: simpleIng,
            status: 'Active'
        },
        // 7. Linked to Briefing (if available)
        {
            name: 'Crema Desarrollo Cliente X',
            code: 'F007',
            revision: 0,
            category: 'Facial',
            description: 'Vinculada al briefing del proyecto.',
            ingredients: complexIng,
            status: 'Active',
            briefingId: briefing ? briefing.id : undefined
        },
        // 8. Complex Ingredients
        {
            name: 'Mascarilla Capilar Reparadora',
            code: 'F008',
            revision: 0,
            category: 'Capilar',
            description: 'Fórmula compleja con queratina.',
            ingredients: complexIng,
            status: 'Active'
        },
        // 9. Draft Revision of Active Formula
        {
            name: 'Protector Solar SPF 50 (Mejora Textura)',
            code: 'F004', // Same as #4
            revision: 1,
            category: 'Solar',
            description: 'Prueba para mejorar la extensibilidad.',
            ingredients: complexIng,
            status: 'Draft'
        },
        // 10. Archived Legacy Formula
        {
            name: 'Aceite de Masaje (Descatalogado)',
            code: 'F009',
            revision: 0,
            category: 'Corporal',
            description: 'Ya no se fabrica.',
            ingredients: simpleIng,
            status: 'Archived'
        }
    ];

    for (const data of scenarios) {
        await prisma.formula.create({
            data
        });
        console.log(`Created ${data.code} R${data.revision}: ${data.name}`);
    }

    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
