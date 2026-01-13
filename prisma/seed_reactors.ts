import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Reactors...');

    const reactors = [
        {
            name: 'R1',
            description: 'Coper 150L - Piloto/Pequeña',
            capacity: 150,
            dailyTarget: 450, // 3 batches
            plant: 'Coper'
        },
        {
            name: 'R2',
            description: 'Coper 650L - Media Capacidad',
            capacity: 650,
            dailyTarget: 1950, // 3 batches
            plant: 'Coper'
        },
        {
            name: 'R3',
            description: 'Coper 1000L - Gran Capacidad',
            capacity: 1000,
            dailyTarget: 3000, // 3 batches
            plant: 'Coper'
        },
        {
            name: 'R4',
            description: 'Coper 2000L - Max Capacidad',
            capacity: 2000,
            dailyTarget: 6000, // 3 batches
            plant: 'Coper'
        },
        {
            name: 'Agitación',
            description: 'Tanque Agitador Auxiliar',
            capacity: 0,
            dailyTarget: 0,
            plant: 'Coper'
        }
    ];

    for (const r of reactors) {
        await prisma.reactor.upsert({
            where: { name: r.name },
            update: r,
            create: r
        });
        console.log(`  ✓ ${r.name} (${r.capacity}L) seeded.`);
    }

    console.log('✅ Reactor Seed Complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
