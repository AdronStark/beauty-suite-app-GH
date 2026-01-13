import { prisma } from '@/lib/db/prisma';
import { formatCurrency } from '@/lib/formatters';
import KPICard from '@/components/crm/KPICard';
import PipelineChart from '@/components/crm/PipelineChart';
import DateRangeSelector from '@/components/crm/DateRangeSelector';
import { BarChart3, TrendingUp, Users, AlertCircle, Timer, Percent } from 'lucide-react';
import Link from 'next/link';
import { differenceInDays } from 'date-fns';
import styles from './crm.module.css';

// Force dynamic to ensure data is fresh
export const dynamic = 'force-dynamic';

export default async function CommercialDashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
    const params = await searchParams;
    const range = params.range || 'YTD';

    // 1. Calculate Date Range
    const now = new Date();
    let startDate = new Date(now.getFullYear(), 0, 1); // Default YTD
    let label = '(Año Actual)';

    if (range === '1Y') {
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        label = '(Último Año)';
    } else if (range === '2Y') {
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 2);
        label = '(Últimos 2 Años)';
    } else if (range === 'ALL') {
        startDate = new Date(0); // Epoch
        label = '(Histórico)';
    }

    // 2. Fetch Data
    const offers = await prisma.offer.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            status: true,
            resultsSummary: true,
            client: true,
            createdAt: true,
            updatedAt: true, // Needed for Lost date approximation
            wonAt: true, // Fetch specific won date
            sentAt: true, // Used for velocity calculation
            probability: true // Fetch probability for weighted calculation
        }
    });

    // 3. Calculate KPIs
    const statusCounts: Record<string, number> = {};
    let totalPipelineValue = 0;
    let weightedPipelineValue = 0;
    let wonValue = 0;
    let wonCount = 0;
    let lostCount = 0;
    let newOppCount = 0;

    // Velocity Metrics
    let totalClosingDays = 0;
    let closedDealsCountForVelocity = 0;

    // 3.5 Fetch Sales Goal (Sum of all Client Budgets)
    const currentYear = new Date().getFullYear();
    const budgets = await prisma.salesBudget.findMany({
        where: { year: currentYear }
    });
    const salesGoal = budgets.reduce((acc, b) => acc + b.amount, 0);

    // Progress = Won Value + Weighted Pipeline (Entire active pipeline, or just this year's? Usually Annual Goal implies comparison vs YTD Won + Active Pipeline Weighted)
    // Actually, "Goal" compares usually against "Closed Won" (Actual) + "Pipeline Weighted" (Potential). 
    // To be precise, for an ANNUAL goal, we should count YTD Won + Weighted Pipeline (regardless of date, as pipeline is future potential).

    // Calculate YTD Won for Goal
    const ytdWonValue = offers.reduce((acc, o) => {
        const isWon = o.status === 'Adjudicada' || o.status === 'Aceptada' || o.status === 'Ganada';
        if (isWon) {
            const winDate = o.wonAt ? new Date(o.wonAt) : new Date(o.createdAt);
            if (winDate.getFullYear() === currentYear) {
                return acc + (parseFloat(JSON.parse(o.resultsSummary || '{}').totalValue || '0') || 0);
            }
        }
        return acc;
    }, 0);

    const totalProgressValue = ytdWonValue + weightedPipelineValue;


    offers.forEach(o => {
        // Status Count (Global or Filtered? Usually specific status counts are global for pipeline)
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;

        const createdDate = new Date(o.createdAt);
        const isInRange = createdDate >= startDate;

        // "New Opportunities" KPI - Created in range (regardless of current status)
        if (isInRange) {
            newOppCount++;
        }

        // Value Calculation
        try {
            const summary = JSON.parse(o.resultsSummary || '{}');
            const val = parseFloat(summary.totalValue || '0');

            if (!isNaN(val)) {
                // Pipeline Value (Always Active, regardless of date)
                if (['Borrador', 'Pendiente de validar', 'Validada', 'Enviada'].includes(o.status)) {
                    totalPipelineValue += val;
                    // Weighted Value
                    const prob = o.probability || 0;
                    weightedPipelineValue += val * (prob / 100);
                }
                // Won Value (Filtered by WON Date, fallback to CreatedAt if missing for legacy)
                if ((o.status === 'Aceptada' || o.status === 'Adjudicada')) {
                    // Use wonAt if available, otherwise fall back to createdAt (legacy support)
                    const winDate = o.wonAt ? new Date(o.wonAt) : new Date(o.createdAt);
                    if (winDate >= startDate) {
                        wonValue += val;
                        wonCount++;

                        // Velocity Calculation
                        // We compare wonAt (or createdAt) vs sentAt (or createdAt)
                        // Ideally: WonDate - SentDate. If SentDate missing, WonDate - CreatedDate
                        const end = winDate;
                        const start = o.sentAt ? new Date(o.sentAt) : createdDate;
                        const days = differenceInDays(end, start);
                        // Ensure logical non-negative (if sentAt > wonAt due to error, clamp to 0?)
                        const d = Math.max(0, days);

                        totalClosingDays += d;
                        closedDealsCountForVelocity++;
                    }
                }

                // Lost Count (Filtered by UpdatedAt ~ Lost Date)
                if ((o.status === 'Rechazada' || o.status === 'Perdida')) {
                    const lostDate = new Date(o.updatedAt);
                    if (lostDate >= startDate) {
                        lostCount++;
                    }
                }
            }
        } catch (e) { }
    });

    const avgClosingTime = closedDealsCountForVelocity > 0 ? Math.round(totalClosingDays / closedDealsCountForVelocity) : 0;

    // Win Rate Calculation
    const totalClosed = wonCount + lostCount;
    const globalWinRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;

    // For chart: Won bar needs to be filtered by range. Active bars usually show current state.

    const activeOffersCount = (statusCounts['Borrador'] || 0) + (statusCounts['Pendiente de validar'] || 0) + (statusCounts['Validada'] || 0) + (statusCounts['Enviada'] || 0);

    // 4. Calculate Top Opportunities (Snapshot)
    const activeOffers = offers.filter(o => {
        const isWon = o.status === 'Adjudicada' || o.status === 'Aceptada' || o.status === 'Ganada'; // Normalized?
        const isLost = o.status === 'Rechazada' || o.status === 'Perdida';
        // CRM Active = !Won && !Lost (Includes Drafts)
        return !isWon && !isLost;
    }).map(o => {
        let val = 0;
        try {
            val = parseFloat(JSON.parse(o.resultsSummary || '{}').totalValue || '0') || 0;
        } catch (e) { }
        return { ...o, value: val };
    }).sort((a, b) => b.value - a.value).slice(0, 5);


    return (
        <div style={{ padding: '1.5rem', maxWidth: '1800px', margin: '0 auto' }}>

            {/* Page Header */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>
                        Dashboard Comercial
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        Visión global de oportunidades y rendimiento.
                    </p>
                </div>
                {/* Date Selector REMOVED from here */}
            </div>

            {/* SECTION 1: Current Snapshot (Time Independent) */}
            <div className={styles.snapshotGrid}>

                {/* 1. Active Pipeline */}
                <div>
                    <KPICard
                        title="Pipeline Activo"
                        value={formatCurrency(totalPipelineValue, 0) + ' €'}
                        subtext={`${activeOffersCount} ofertas en curso`}
                        icon={BarChart3}
                        color="#3b82f6"
                        secondaryValue={<span style={{ fontSize: '0.8rem' }}>Ponderado: {formatCurrency(weightedPipelineValue, 0)} €</span>}
                        className={styles.dashboardCard}
                    />
                </div>

                {/* 2. Top Opportunities */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Top Oportunidades</span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '6px' }}>Big 5</span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
                        {activeOffers.map((offer, i) => (
                            <Link key={offer.id} href={`/ofertas/editor/${offer.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', padding: '6px', borderRadius: '6px', transition: 'background 0.2s', background: '#f8fafc' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                    <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{offer.client}</span>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <span style={{
                                            fontSize: '0.65rem', fontWeight: 500, color:
                                                offer.status === 'Borrador' ? '#94a3b8' :
                                                    offer.status === 'Enviada' ? '#3b82f6' :
                                                        '#f59e0b',
                                            background: 'white', padding: '0 3px', borderRadius: '3px', border: '1px solid #e2e8f0'
                                        }}>
                                            {offer.status}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.9rem' }}>{formatCurrency(offer.value, 0)}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* 3. Sales Goal */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <TrendingUp size={16} /> Progreso {new Date().getFullYear()}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: salesGoal > 0 && totalProgressValue >= salesGoal ? '#10b981' : '#334155' }}>
                                {formatCurrency(totalProgressValue, 0)}
                            </span>
                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                / {formatCurrency(salesGoal, 0)}
                            </span>
                        </div>

                        <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${Math.min(100, (totalProgressValue / (salesGoal || 1)) * 100)}%`,
                                height: '100%',
                                background: salesGoal > 0 && totalProgressValue >= salesGoal ? '#10b981' : '#3b82f6',
                                borderRadius: '4px',
                            }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                            <span>{salesGoal > 0 ? Math.round((totalProgressValue / salesGoal) * 100) : 0}% Completado</span>
                        </div>
                    </div>
                </div>

                {/* 4. Funnel Chart */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '1px solid #e2e8f0', minHeight: '160px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Pipeline</h3>
                    <div style={{ height: '150px' }}>
                        <PipelineChart data={[
                            {
                                name: 'Borrador',
                                value: offers.filter(o => o.status === 'Borrador').reduce((acc, o) => acc + (parseFloat(JSON.parse(o.resultsSummary || '{}').totalValue || '0') || 0), 0),
                                count: statusCounts['Borrador'] || 0
                            },
                            {
                                name: 'Validación',
                                value: offers.filter(o => ['Pendiente de validar', 'Validada'].includes(o.status)).reduce((acc, o) => acc + (parseFloat(JSON.parse(o.resultsSummary || '{}').totalValue || '0') || 0), 0),
                                count: (statusCounts['Pendiente de validar'] || 0) + (statusCounts['Validada'] || 0)
                            },
                            {
                                name: 'Enviada',
                                value: offers.filter(o => o.status === 'Enviada').reduce((acc, o) => acc + (parseFloat(JSON.parse(o.resultsSummary || '{}').totalValue || '0') || 0), 0),
                                count: statusCounts['Enviada'] || 0
                            }
                        ]} />
                    </div>
                </div>
            </div>

            {/* SECTION 2 Header: With Date Selector */}
            <div style={{ marginBottom: '1rem', marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#334155' }}>
                    Rendimiento del Periodo
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '4px 8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <DateRangeSelector />
                </div>
            </div>

            {/* SECTION 2: KPIs */}
            <div className={styles.kpiFlex}>

                {/* Use a Wrapper or just KPICards. Since KPICard accepts className now, we can omit wrapper divs if flex applied to them, 
                    but crm.module.css targets direct children (.kpiFlex > div). 
                    The children here are KPICards which render a div. 
                    Wait, KPICard renders a div. If I put KPICard directly in kpiFlex, the div returned by KPICard is the flex item.
                    Correct.
                */}

                <KPICard
                    title={`Ventas Cerradas`}
                    value={formatCurrency(wonValue, 0) + ' €'}
                    subtext={`${wonCount} ganadas`}
                    icon={TrendingUp}
                    color="#10b981"
                    trend="up"
                    trendValue={range === 'YTD' ? "vs año anterior" : label}
                    className={styles.dashboardCard}
                />
                <KPICard
                    title="Nuevas Oportunidades"
                    value={newOppCount}
                    subtext="En periodo"
                    icon={AlertCircle}
                    color="#f59e0b"
                    className={styles.dashboardCard}
                />
                <KPICard
                    title="Win Rate"
                    value={`${globalWinRate}%`}
                    subtext={`De ${totalClosed} cerradas`}
                    icon={Percent}
                    color="#8b5cf6"
                    className={styles.dashboardCard}
                />
                <KPICard
                    title="T. Medio Cierre"
                    value={`${avgClosingTime} días`}
                    subtext="Envío -> Cierre"
                    icon={Timer}
                    color="#6366f1"
                    className={styles.dashboardCard}
                />
                <KPICard
                    title="Clientes Activos"
                    value={(new Set(offers.filter(o => {
                        const createdDate = new Date(o.createdAt);
                        return createdDate >= startDate;
                    }).map(o => o.client))).size}
                    subtext="En periodo"
                    icon={Users}
                    color="#8b5cf6"
                    className={styles.dashboardCard}
                />
            </div>

        </div>
    );
}
