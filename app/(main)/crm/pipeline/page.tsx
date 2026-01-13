import { prisma } from '@/lib/db/prisma';
import { formatCurrency } from '@/lib/formatters';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PipelineTable from '@/components/crm/PipelineTable';

// Force dynamic to ensure data is fresh
export const dynamic = 'force-dynamic';

export default async function PipelinePage() {

    // Fetch all active deals (exclude 'Rejected' maybe? or show all with filters)
    // For now, let's show everything sorted by UpdatedAt
    const offers = await prisma.offer.findMany({
        orderBy: { updatedAt: 'desc' },
        select: {
            id: true,
            code: true,
            client: true,
            product: true,
            status: true,
            updatedAt: true,
            createdAt: true, // Need for Aging
            revision: true,
            // @ts-ignore
            probability: true, // CRM Field
            expectedCloseDate: true, // CRM Field
            resultsSummary: true // For value
        }
    });

    return (
        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/crm" style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <ArrowLeft size={20} />
                    Volver
                </Link>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b' }}>
                        Pipeline de Ventas
                    </h1>
                </div>
            </div>

            {/* Client Component for filtering/sorting */}
            <PipelineTable offers={offers.map(offer => ({
                ...offer,
                updatedAt: offer.updatedAt.toISOString(),
                createdAt: offer.createdAt.toISOString(),
            }))} />
        </div>
    );
}
