const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding offers...');

    // delete existing if any (optional, but good for clean slate if requested, though user said "all borrados")
    // await prisma.offer.deleteMany({});

    const offers = [
        {
            code: 'Q250001',
            client: 'Sephora Spain',
            product: 'Sérum Hidratante Hyaluronic',
            status: 'Aprobada',
            responsableComercial: 'Ana García',
            responsableTecnico: 'Carlos Ruiz',
            fechaEntrega: new Date('2025-02-15'),
            inputData: JSON.stringify({ matches: 'Standard', units: 5000, cost: 2.50 }),
            resultsSummary: JSON.stringify({ totalCost: 12500, margin: 30, price: 3.25 })
        },
        {
            code: 'Q250002',
            client: 'Mercadona (Deliplus)',
            product: 'Crema Solar SPF 50',
            status: 'Enviada',
            responsableComercial: 'Juan Pérez',
            responsableTecnico: 'Elena Gomez',
            fechaEntrega: new Date('2025-03-01'),
            inputData: JSON.stringify({ matches: 'Premium', units: 20000, cost: 1.80 }),
            resultsSummary: JSON.stringify({ totalCost: 36000, margin: 25, price: 2.25 })
        },
        {
            code: 'Q250003',
            client: 'Laboratorios Valquer',
            product: 'Champú Sin Sulfatos',
            status: 'Borrador',
            responsableComercial: 'Ana García',
            responsableTecnico: 'Maria Lopez',
            fechaEntrega: null,
            inputData: JSON.stringify({ matches: 'Eco', units: 1000, cost: 4.00 }),
            resultsSummary: JSON.stringify({ totalCost: 4000, margin: 40, price: 5.60 })
        },
        {
            code: 'Q250004',
            client: 'Farmacia Moderna',
            product: 'Gel Limpiador Facial',
            status: 'Rechazada',
            responsableComercial: 'Pedro Sanchez',
            responsableTecnico: 'Carlos Ruiz',
            fechaEntrega: new Date('2025-01-20'),
            inputData: JSON.stringify({ matches: 'Basic', units: 500, cost: 1.50 }),
            resultsSummary: JSON.stringify({ totalCost: 750, margin: 50, price: 2.25 })
        },
        {
            code: 'Q250005',
            client: 'SkinSincere',
            product: 'Aceite Rosa Mosqueta Bio',
            status: 'Enviada',
            responsableComercial: 'Laura M.',
            responsableTecnico: 'Elena Gomez',
            fechaEntrega: new Date('2025-02-28'),
            inputData: JSON.stringify({ matches: 'Bio', units: 3000, cost: 5.20 }),
            resultsSummary: JSON.stringify({ totalCost: 15600, margin: 35, price: 7.02 })
        }
    ];

    for (const offer of offers) {
        const existing = await prisma.offer.findFirst({
            where: { code: offer.code }
        });

        if (!existing) {
            await prisma.offer.create({
                data: offer,
            });
            console.log(`Created offer: ${offer.code}`);
        } else {
            console.log(`Skipped offer: ${offer.code} (Exists)`);
        }
    }

    console.log('✅ Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
