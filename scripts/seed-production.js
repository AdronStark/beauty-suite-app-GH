const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🏭 Seeding production blocks...');

    // Optional: Clean up
    // await prisma.productionBlock.deleteMany({});

    const productions = [
        {
            articleCode: 'A-2001',
            articleDesc: 'Sérum Hialurónico 30ml',
            clientName: 'Sephora Spain',
            units: 5000,
            status: 'PENDING',
            orderNumber: 'PED-001',
            orderDate: new Date('2025-01-10'),
            deadline: new Date('2025-02-15'),
            erpId: 'ERP-1001'
        },
        {
            articleCode: 'B-5005',
            articleDesc: 'Crema Solar SPF 50',
            clientName: 'Mercadona',
            units: 20000,
            status: 'PLANNED',
            orderNumber: 'PED-002',
            orderDate: new Date('2025-01-12'),
            deadline: new Date('2025-03-01'),
            plannedDate: new Date('2025-02-05'),
            plannedReactor: 'R-01',
            plannedShift: 'Mañana',
            erpId: 'ERP-1002'
        },
        {
            articleCode: 'C-3030',
            articleDesc: 'Champú Sin Sulfatos 500ml',
            clientName: 'Lab. Valquer',
            units: 3000,
            status: 'PRODUCED',
            orderNumber: 'PED-003',
            orderDate: new Date('2024-12-20'),
            deadline: new Date('2025-01-20'),
            plannedDate: new Date('2025-01-15'),
            plannedReactor: 'R-03',
            plannedShift: 'Tarde',
            realKg: 3100,
            realDuration: 240, // minutes
            erpId: 'ERP-1003'
        },
        {
            articleCode: 'D-4400',
            articleDesc: 'Gel Limpiador Facial',
            clientName: 'Farmacia Moderna',
            units: 1500,
            status: 'PENDING',
            orderNumber: 'PED-004',
            orderDate: new Date('2025-01-15'),
            deadline: new Date('2025-02-28'),
            erpId: 'ERP-1004'
        },
        {
            articleCode: 'E-1200',
            articleDesc: 'Aceite Rosa Mosqueta Bio',
            clientName: 'SkinSincere',
            units: 500,
            status: 'PLANNED',
            orderNumber: 'PED-005',
            orderDate: new Date('2025-01-18'),
            deadline: new Date('2025-02-10'),
            plannedDate: new Date('2025-02-01'),
            plannedReactor: 'R-02',
            plannedShift: 'Mañana',
            erpId: 'ERP-1005'
        }
    ];

    for (const prod of productions) {
        const existing = await prisma.productionBlock.findFirst({
            where: { erpId: prod.erpId }
        });

        if (!existing) {
            await prisma.productionBlock.create({
                data: prod
            });
            console.log(`Created production: ${prod.articleDesc}`);
        } else {
            console.log(`Skipped production: ${prod.articleDesc} (Exists)`);
        }
    }

    console.log('✅ Production seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
