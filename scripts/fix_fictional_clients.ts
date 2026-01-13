
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting WEIGHTED client migration...");

    // 1. Fetch all real clients
    const clients = await prisma.client.findMany({
        where: { isActive: true }
    });

    if (clients.length === 0) {
        console.error("No active clients found in database.");
        return;
    }

    // 2. Identify Top Clients
    const findClient = (keyword: string) => clients.find(c => c.name.toLowerCase().includes(keyword.toLowerCase()) || (c.businessName && c.businessName.toLowerCase().includes(keyword.toLowerCase())));

    const niche = findClient('niche');
    const ferrer = findClient('ferrer');
    const bella = findClient('bella aurora') || findClient('bella');
    const freshly = findClient('freshly');
    const inno = findClient('innoaesthetics') || findClient('inno');

    const topClients = [
        { c: niche, p: 0.20, name: 'Niche' },
        { c: ferrer, p: 0.15, name: 'Ferrer' },
        { c: bella, p: 0.10, name: 'Bella Aurora' },
        { c: freshly, p: 0.10, name: 'Freshly' },
        { c: inno, p: 0.08, name: 'Innoaesthetics' }
    ];

    // Log who was found
    topClients.forEach(tc => {
        if (tc.c) console.log(`✅ Found ${tc.name} -> ${tc.c.name}`);
        else console.warn(`⚠️ Could not find client matching "${tc.name}". Weight will be distributed to others.`);
    });

    const otherClients = clients.filter(c => !topClients.some(tc => tc.c?.id === c.id));
    console.log(`Found ${otherClients.length} 'Other' clients.`);

    // 3. Helper to pick a client
    const pickClient = () => {
        const r = Math.random();
        let cumulative = 0;

        for (const tc of topClients) {
            if (tc.c) {
                cumulative += tc.p;
                if (r < cumulative) return tc.c;
            }
        }

        // If we get here, pick from others
        if (otherClients.length > 0) {
            return otherClients[Math.floor(Math.random() * otherClients.length)];
        }

        // Fallback if no others (e.g. only top clients exist)
        return topClients.find(t => t.c)?.c || clients[0];
    };

    // 4. Update Briefings
    const briefings = await prisma.briefing.findMany();
    console.log(`Updating ${briefings.length} briefings...`);

    for (const b of briefings) {
        const client = pickClient();
        await prisma.briefing.update({
            where: { id: b.id },
            data: { clientName: client.name }
        });
    }
    console.log("Briefings updated.");

    // 5. Update Offers
    const offers = await prisma.offer.findMany();
    console.log(`Updating ${offers.length} offers...`);

    for (const o of offers) {
        const client = pickClient();
        await prisma.offer.update({
            where: { id: o.id },
            data: { client: client.name }
        });
    }
    console.log("Offers updated.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
