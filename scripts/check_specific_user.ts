
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const usernames = ['Aldi', 'cliente_vip', 'admin'];
    const users = await prisma.user.findMany({
        where: { username: { in: usernames } }
    });

    if (users.length === 0) {
        console.log("No users found matching: " + usernames.join(", "));
    } else {
        users.forEach(u => {
            console.log(`User: ${u.username} | Role: ${u.role} | Client: ${u.connectedClientName} | ID: ${u.id}`);
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
