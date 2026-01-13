export { };
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding users...');

    const password = await bcrypt.hash('123456', 10);

    const users = [
        {
            username: 'admin',
            role: 'ADMIN',
            firstName: 'Administrador',
            lastName1: 'Sistema',
            lastName2: 'Principal',
            companies: ['coper', 'jumsa']
        },
        {
            username: 'juan.perez',
            role: 'MANAGER',
            firstName: 'Juan',
            lastName1: 'Pérez',
            lastName2: 'García',
            companies: ['coper']
        },
        {
            username: 'maria.lopez',
            role: 'MANAGER',
            firstName: 'María',
            lastName1: 'López',
            lastName2: 'Velasco',
            companies: ['jumsa']
        },
        {
            username: 'carlos.ruiz',
            role: 'VIEWER',
            firstName: 'Carlos',
            lastName1: 'Ruiz',
            lastName2: 'Sánchez',
            companies: ['coper', 'jumsa']
        },
        // Technical Responsibles
        {
            username: 'ana.martinez',
            role: 'OPERATOR',
            firstName: 'Ana',
            lastName1: 'Martínez',
            lastName2: 'Díaz',
            companies: ['coper']
        },
        {
            username: 'david.fernandez',
            role: 'OPERATOR',
            firstName: 'David',
            lastName1: 'Fernández',
            lastName2: 'López',
            companies: ['jumsa']
        }
    ];

    for (const u of users) {
        const name = `${u.firstName} ${u.lastName1} ${u.lastName2}`.trim();
        const existing = await prisma.user.findUnique({ where: { username: u.username } });

        const data = {
            username: u.username,
            password,
            name,
            // @ts-ignore
            firstName: u.firstName,
            // @ts-ignore
            lastName1: u.lastName1,
            // @ts-ignore
            lastName2: u.lastName2,
            role: u.role,
            companies: JSON.stringify(u.companies) // ensure JSON string
        };

        if (existing) {
            console.log(`Updating ${u.username}...`);
            await prisma.user.update({
                where: { username: u.username },
                data
            });
        } else {
            console.log(`Creating ${u.username}...`);
            await prisma.user.create({
                data
            });
        }
    }

    console.log('Done!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
