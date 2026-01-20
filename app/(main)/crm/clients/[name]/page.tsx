import { prisma } from '@/lib/db/prisma';
import { formatCurrency } from '@/lib/formatters';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, BarChart3, Package, Percent } from 'lucide-react';
import KPICard from '@/components/crm/KPICard';
import PipelineRow from '@/components/crm/PipelineRow';

// Force dynamic
export const dynamic = 'force-dynamic';

export default async function ClientPage({ params }: { params: Promise<{ name: string }> }) {
    const { name } = await params;
    const clientName = decodeURIComponent(name);

    // Fetch Client Offers
    const offers = await prisma.offer.findMany({
        where: { client: clientName }, // Exact match for now
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            code: true,
            client: true,
            description: true, // Used to be product
            status: true,
            createdAt: true,
            updatedAt: true,
            resultsSummary: true,
            // @ts-ignore
            probability: true,
            expectedCloseDate: true,
            wonAt: true
        }
    });

    // Calculate Stats
    let totalWon = 0;
    let totalPipeline = 0;
    let wonCount = 0;
    let lostCount = 0;

    offers.forEach(o => {
        const summary = JSON.parse(o.resultsSummary || '{}');
        const val = parseFloat(summary.totalValue || '0');

        if (['Adjudicada', 'Aceptada'].includes(o.status)) {
            totalWon += val;
            wonCount++;
        } else if (['Rechazada', 'Perdida'].includes(o.status)) {
            lostCount++;
        } else if (['Borrador', 'Pendiente de validar', 'Validada', 'Enviada'].includes(o.status)) {
            totalPipeline += val;
        }
    });

    const totalClosed = wonCount + lostCount;
    const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;

    return (
        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/crm/pipeline" style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <ArrowLeft size={20} />
                    Volver
                </Link>
                <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1px' }}>Ficha de Cliente</span>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b' }}>
                        {clientName}
                    </h1>
                </div>
            </div>

            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <KPICard
                    title="Ventas Totales"
                    value={formatCurrency(totalWon, 0) + ' €'}
                    subtext={`${wonCount} ofertas ganadas`}
                    icon={TrendingUp}
                    color="#10b981"
                />
                <KPICard
                    title="Pipeline Activo"
                    value={formatCurrency(totalPipeline, 0) + ' €'}
                    subtext="En curso actualmente"
                    icon={BarChart3}
                    color="#3b82f6"
                />
                <KPICard
                    title="Tasa de Cierre (Win Rate)"
                    value={`${winRate}%`}
                    subtext={`De ${totalClosed} ofertas cerradas`}
                    icon={Percent}
                    color="#8b5cf6"
                />
                <KPICard
                    title="Ofertas Totales"
                    value={offers.length}
                    subtext="Histórico completo"
                    icon={Package}
                    color="#f59e0b"
                />
            </div>

            {/* Table Card */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>Histórico de Ofertas</h3>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Código</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Cliente</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Producto</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Valor</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Probabilidad</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Estado</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Ult. Actividad</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Antigüedad</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {offers.map(offer => {
                            const serializedOffer = {
                                ...offer,
                                product: offer.description, // Map description to product
                                updatedAt: offer.updatedAt.toISOString(),
                                createdAt: offer.createdAt.toISOString(),
                            };
                            return <PipelineRow key={offer.id} offer={serializedOffer} />;
                        })}
                    </tbody>
                </table>
                {offers.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                        No se encontraron ofertas para este cliente.
                    </div>
                )}
            </div>
        </div>
    );
}
