
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // CONFIGURATION
    const username = 'cliente_vip';
    const passwordRaw = '123456';
    const clientName = 'Mercadona'; // MUST match the 'clientName' in your Briefings exactly
    const userRole = 'CLIENT';

    console.log(`Creating user '${username}' for client '${clientName}'...`);

    const hashedPassword = await bcrypt.hash(passwordRaw, 10);

    const user = await prisma.user.upsert({
        where: { username },
        update: {
            role: userRole,
            connectedClientName: clientName,
            password: hashedPassword // Update password just in case
        },
        create: {
            username,
            password: hashedPassword,
            name: `${clientName} Contact`,
            role: userRole,
            connectedClientName: clientName,
            companies: '[]',
            firstName: 'Cliente',
            lastName1: 'VIP',
            position: 'Director de Compras'
        }
    });

    console.log(`✅ Success! User created:`);
    console.log(`   User: ${username}`);
    console.log(`   Pass: ${passwordRaw}`);
    console.log(`   Role: ${userRole}`);
    console.log(`   Linked Client: ${clientName}`);
    console.log(`\n👉 You can now log in at /login and select 'Soy Cliente'.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
