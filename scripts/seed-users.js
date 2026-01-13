
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const user = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: hashedPassword,
            name: 'Administrador Global',
            role: 'ADMIN',
            companies: JSON.stringify(['coper', 'jumsa', 'ternum', 'cosmeprint']), // Access to all
        },
    });

    console.log('Admin user created:', user);

    // Example Manager for Coper
    const managerPass = await bcrypt.hash('coper2025', 10);
    await prisma.user.upsert({
        where: { username: 'manager_coper' },
        update: {},
        create: {
            username: 'manager_coper',
            password: managerPass,
            name: 'Gerente Coper',
            role: 'MANAGER',
            companies: JSON.stringify(['coper']),
        },
    });

    console.log('Manager Coper created');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
