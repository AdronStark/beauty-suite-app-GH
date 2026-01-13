
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const COMPANIES = ['coper', 'jumsa', 'ternum', 'cosmeprint'];

async function main() {
    const password = await bcrypt.hash('admin123', 10);

    const users = [
        // Company Specific Users (Managers of their specific company)
        {
            username: 'coper',
            name: 'Usuario Coper',
            role: 'MANAGER',
            companies: JSON.stringify(['coper']),
        },
        {
            username: 'jumsa',
            name: 'Usuario Jumsa',
            role: 'MANAGER',
            companies: JSON.stringify(['jumsa']),
        },
        {
            username: 'ternum',
            name: 'Usuario Ternum',
            role: 'MANAGER',
            companies: JSON.stringify(['ternum']),
        },
        {
            username: 'cosmeprint',
            name: 'Usuario Cosmeprint',
            role: 'MANAGER',
            companies: JSON.stringify(['cosmeprint']),
        },

        // Role Specific Users ( Global Access to All Companies )
        {
            username: 'admin',
            name: 'Global Admin',
            role: 'ADMIN',
            companies: JSON.stringify(COMPANIES),
        },
        {
            username: 'manager',
            name: 'Global Manager',
            role: 'MANAGER',
            companies: JSON.stringify(COMPANIES),
        },
        {
            username: 'operator',
            name: 'Global Operator',
            role: 'OPERATOR',
            companies: JSON.stringify(COMPANIES),
        },
        {
            username: 'viewer',
            name: 'Global Viewer',
            role: 'VIEWER',
            companies: JSON.stringify(COMPANIES),
        },
    ];

    console.log('🌱 Starting User Seed...');

    for (const user of users) {
        const u = await prisma.user.upsert({
            where: { username: user.username },
            update: {
                password, // Ensure password is set/reset
                role: user.role,
                companies: user.companies,
                name: user.name,
            },
            create: {
                username: user.username,
                password,
                role: user.role,
                companies: user.companies,
                name: user.name,
            },
        });
        console.log(`Created/Updated user: ${u.username}`);
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
