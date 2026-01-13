import { prisma } from '@/lib/db/prisma';
import ClientTabs from '@/components/crm/ClientTabs';

// Force dynamic
export const dynamic = 'force-dynamic';

export default async function ClientsDirectoryPage() {

    // Fetch ALL offers to aggregate
    const offers = await prisma.offer.findMany({
        select: {
            client: true,
            status: true,
            resultsSummary: true,
            updatedAt: true,
            wonAt: true
        }
    });

    // Aggregate by Client
    const clientsMap = new Map<string, {
        name: string;
        totalOffers: number;
        totalSpent: number;
        activeDeals: number;
        wonDeals: number;
        lostDeals: number;
        lastActivity: Date;
    }>();

    offers.forEach(o => {
        if (!clientsMap.has(o.client)) {
            clientsMap.set(o.client, {
                name: o.client,
                totalOffers: 0,
                totalSpent: 0,
                activeDeals: 0,
                wonDeals: 0,
                lostDeals: 0,
                lastActivity: new Date(0) // Epoch
            });
        }

        const client = clientsMap.get(o.client)!;
        client.totalOffers++;

        // Update Last Activity
        const updated = new Date(o.updatedAt);
        if (updated > client.lastActivity) {
            client.lastActivity = updated;
        }

        const summary = JSON.parse(o.resultsSummary || '{}');
        const val = parseFloat(summary.totalValue || '0');

        if (['Adjudicada', 'Aceptada'].includes(o.status)) {
            client.wonDeals++;
            client.totalSpent += val;
        } else if (['Rechazada', 'Perdida'].includes(o.status)) {
            client.lostDeals++;
        } else if (['Borrador', 'Pendiente de validar', 'Validada', 'Enviada'].includes(o.status)) {
            client.activeDeals++;
        }
    });

    // Convert to Array & Sort by Last Activity desc
    const clients = Array.from(clientsMap.values()).sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

    return (
        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
            <ClientTabs commercialClients={clients.map(c => ({
                ...c,
                lastActivity: c.lastActivity.toISOString()
            }))} />
        </div>
    );
}
