
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.count();
        const clients = await prisma.client.count();
        const formulas = await prisma.formula.count();
        const offers = await prisma.offer.count();

        console.log('--- RESTORE VERIFICATION ---');
        console.log(`Users: ${users}`);
        console.log(`Clients: ${clients}`);
        console.log(`Formulas: ${formulas}`);
        console.log(`Offers: ${offers}`);

        if (offers > 0) {
            const sample = await prisma.offer.findMany({
                take: 1,
                select: { id: true, description: true, code: true }
            });
            console.log('Sample Offer (Description Check):', JSON.stringify(sample[0], null, 2));
        }
        console.log('---------------------------');
    } catch (e) {
        console.error('Error verifying DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
