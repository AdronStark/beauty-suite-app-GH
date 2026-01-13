'use client';
import { useState, useMemo, useEffect } from 'react';
import { startOfMonth, endOfMonth, subMonths, format, isSameMonth, eachMonthOfInterval, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, History } from 'lucide-react';

export default function StatsView({ blocks = [], holidays = [], reactors = [] }: any) {
    const [activeTab, setActiveTab] = useState<'forecast' | 'history'>('forecast');

    return (
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            {/* Sub Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                <button
                    onClick={() => setActiveTab('forecast')}
                    style={{
                        padding: '0.75rem 1.5rem', background: 'none', border: 'none',
                        borderBottom: activeTab === 'forecast' ? '2px solid #4f46e5' : '2px solid transparent',
                        color: activeTab === 'forecast' ? '#4f46e5' : '#64748b', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <TrendingUp size={18} /> Previsiones
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    style={{
                        padding: '0.75rem 1.5rem', background: 'none', border: 'none',
                        borderBottom: activeTab === 'history' ? '2px solid #4f46e5' : '2px solid transparent',
                        color: activeTab === 'history' ? '#4f46e5' : '#64748b', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <History size={18} /> Histórico
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {activeTab === 'forecast' ?
                    <ForecastPanel blocks={blocks} reactors={reactors} /> :
                    <HistoryPanel blocks={blocks} reactors={reactors} />
                }
            </div>
        </div>
    );
}

function ForecastPanel({ blocks = [], reactors = [] }: any) {
    const [forecastRange, setForecastRange] = useState(6);

    // Backlog Calculation: Pending + Planned (Future)
    const backlogTotal = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return blocks.reduce((sum: number, b: any) => {
            if (b.status === 'PENDING') {
                return sum + (b.units || 0);
            }
            if (b.status === 'PLANNED' && b.plannedDate) {
                if (new Date(b.plannedDate) >= today) {
                    return sum + (b.units || 0);
                }
            }
            return sum;
        }, 0);
    }, [blocks]);

    // Forecast Data (Dynamic Range)
    const forecastData = useMemo(() => {
        if (!reactors || reactors.length === 0) return [];

        const today = new Date();
        const start = startOfMonth(today);
        const end = endOfMonth(subMonths(start, -(forecastRange - 1))); // Dynamic Range

        const months = eachMonthOfInterval({ start, end });

        // Filter out Agitator or 0 capacity if desired
        const validReactors = reactors.filter((r: any) => r.capacity > 0);

        return months.map(month => {
            const monthBlocks = blocks.filter((b: any) =>
                b.status === 'PLANNED' &&
                b.plannedDate &&
                isSameMonth(new Date(b.plannedDate), month)
            );

            // Calculate data for EACH reactor for this month
            const reactorData = validReactors.map((rDef: any) => {
                const totalKg = monthBlocks
                    .filter((b: any) => b.plannedReactor === rDef.name)
                    .reduce((sum: number, b: any) => sum + (b.units || 0), 0);

                // Estimate Monthly Capacity: Daily Target * 22 working days approx
                let monthlyCap = 0;
                if (rDef.dailyTarget > 0) {
                    monthlyCap = rDef.dailyTarget * 22;
                } else {
                    monthlyCap = rDef.capacity * 3 * 22; // Fallback
                }

                const pct = monthlyCap > 0 ? Math.round((totalKg / monthlyCap) * 100) : 0;

                let color = '#3b82f6';
                if (rDef.capacity >= 2000) color = '#ec4899';
                else if (rDef.capacity >= 1000) color = '#f59e0b';
                else if (rDef.capacity >= 600) color = '#8b5cf6';

                return { label: rDef.name, kg: totalKg, capacity: monthlyCap, pct, color };
            });

            // Always use all data
            const finalReactors = reactorData;

            const totalMonthlyKg = finalReactors.reduce((sum: number, r: any) => sum + r.kg, 0);

            return {
                monthLabel: format(month, "MMM ''yy", { locale: es }),
                totalKg: totalMonthlyKg,
                reactors: finalReactors
            };
        });
    }, [blocks, reactors, forecastRange]);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h3 style={{ margin: 0 }}>Ocupación Futura</h3>
                        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', padding: '2px' }}>
                            {[1, 3, 6, 12].map(r => (
                                <button
                                    key={r}
                                    onClick={() => setForecastRange(r)}
                                    style={{
                                        padding: '4px 12px', border: 'none', background: forecastRange === r ? 'white' : 'transparent',
                                        borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                                        color: forecastRange === r ? '#4f46e5' : '#64748b', cursor: 'pointer',
                                        boxShadow: forecastRange === r ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                    }}
                                >
                                    {r}M
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Selector removed as per request */}
                </div>

                {reactors.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Cargando configuración...</div>
                ) : (
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        {/* CHART SECTION */}
                        <div style={{ flex: 3, display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px' }}>
                            {forecastData.map((m, i) => (
                                <div key={i} style={{ flex: 1, minWidth: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    {/* Group Container - FIXED HEIGHT FOR ALIGNMENT */}
                                    <div style={{
                                        height: '220px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '4px'
                                    }}>
                                        {m.reactors.map((r: any) => (
                                            <div key={r.label} style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end',
                                                width: '18px' // Static width for grouped columns
                                            }}>
                                                {/* Bar Container (Capacity 100%) */}
                                                <div style={{
                                                    width: '100%', height: '100%', background: '#f1f5f9', borderRadius: '4px 4px 0 0', position: 'relative', overflow: 'hidden'
                                                }} title={`${r.label}: ${r.kg.toLocaleString()} / ${r.capacity.toLocaleString()} kg (${r.pct}%)`}>

                                                    {/* Fill (Occupancy) */}
                                                    <div style={{
                                                        width: '100%',
                                                        height: `${Math.min(r.pct, 100)}%`,
                                                        background: r.pct > 100 ? '#ef4444' : r.color,
                                                        position: 'absolute', bottom: 0,
                                                        transition: 'height 0.3s'
                                                    }} />

                                                    {/* Warning Line for Overcapacity */}
                                                    {r.pct > 100 && <div style={{
                                                        position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#ef4444'
                                                    }} />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Labels */}
                                    <div style={{ textAlign: 'center', marginTop: '8px', minHeight: '40px' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', textTransform: 'capitalize' }}>{m.monthLabel}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                            Previsto: {m.totalKg.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* STATS PANEL (ONLY FOR 1 MONTH VIEW) */}
                        {forecastRange === 1 && forecastData.length > 0 && (
                            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '1px solid #e2e8f0', paddingLeft: '2rem' }}>
                                <h4 style={{ margin: 0, color: '#475569' }}>Detalle {forecastData[0].monthLabel}</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {forecastData[0].reactors.map((r: any) => (
                                        <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: r.color }}></div>
                                                <span style={{ fontWeight: 600, color: '#334155' }}>{r.label}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: r.pct > 100 ? '#ef4444' : '#334155' }}>
                                                    {r.pct}%
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                    {r.kg.toLocaleString()} / {r.capacity.toLocaleString()} kg
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: 'auto', background: '#eff6ff', padding: '1rem', borderRadius: '6px' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600, textTransform: 'uppercase' }}>Total Mensual</span>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                                        {forecastData[0].totalKg.toLocaleString()} kg
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div style={{ gridColumn: '1 / -1', background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3>Cartera Pendiente Total</h3>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b' }}>{backlogTotal.toLocaleString()} kg</p>
                <span style={{ color: '#64748b' }}>Total Kg pendientes de producir (Planificado + No Planificado)</span>
            </div>
        </div>
    )
}

function HistoryPanel({ blocks = [], reactors = [] }: any) {
    // --- DATA PROCESSING ---

    // 1. Production History (Last 6 Months)
    const historyData = useMemo(() => {
        if (!reactors || reactors.length === 0) return [];

        const today = new Date();
        const start = subMonths(startOfMonth(today), 5);
        const end = endOfMonth(today);

        const months = eachMonthOfInterval({ start, end });
        const validReactors = reactors.filter((r: any) => r.capacity > 0);

        return months.map(month => {
            const monthBlocks = blocks.filter((b: any) =>
                b.status === 'PLANNED' &&
                b.plannedDate &&
                isSameMonth(new Date(b.plannedDate), month)
            );

            // Calculate grouped data
            const reactorData = validReactors.map((rDef: any) => {
                const totalKg = monthBlocks
                    .filter((b: any) => b.plannedReactor === rDef.name)
                    .reduce((sum: number, b: any) => {
                        const val = (b.realKg !== null && b.realKg !== undefined) ? b.realKg : (b.units || 0);
                        return sum + val;
                    }, 0);

                // Estimate Monthly Capacity: Daily Target * 22 working days approx
                let monthlyCap = 0;
                if (rDef.dailyTarget > 0) {
                    monthlyCap = rDef.dailyTarget * 22;
                } else {
                    monthlyCap = rDef.capacity * 3 * 22; // Fallback
                }
                const pct = monthlyCap > 0 ? Math.round((totalKg / monthlyCap) * 100) : 0;

                let color = '#3b82f6';
                if (rDef.capacity >= 2000) color = '#ec4899';
                else if (rDef.capacity >= 1000) color = '#f59e0b';
                else if (rDef.capacity >= 600) color = '#8b5cf6';

                return { label: rDef.name, kg: totalKg, capacity: monthlyCap, pct, color };
            });

            const totalMonthlyKg = reactorData.reduce((sum: number, r: any) => sum + r.kg, 0);

            return {
                label: format(month, "MMM ''yy", { locale: es }),
                kg: totalMonthlyKg,
                reactors: reactorData,
                isFuture: isAfter(month, today)
            };
        });
    }, [blocks, reactors]);

    // 2. On-Time Delivery (OTD) - All Time History
    const otdStats = useMemo(() => {
        const plannedWithDeadline = blocks.filter((b: any) =>
            b.status === 'PLANNED' && b.plannedDate && b.deadline
        );

        if (plannedWithDeadline.length === 0) return { pct: 0, onTime: 0, total: 0 };

        const onTime = plannedWithDeadline.filter((b: any) => {
            const planned = new Date(b.plannedDate);
            const dead = new Date(b.deadline);
            return planned <= dead;
        });

        return {
            pct: Math.round((onTime.length / plannedWithDeadline.length) * 100),
            onTime: onTime.length,
            total: plannedWithDeadline.length
        };
    }, [blocks]);

    // 3. Top Clients (Real Volume)
    const topClients = useMemo(() => {
        const clientMap = new Map<string, number>();
        blocks.forEach((b: any) => {
            if (b.status === 'PLANNED' && b.plannedDate) {
                const client = b.clientName || 'Sin Cliente';
                clientMap.set(client, (clientMap.get(client) || 0) + b.units);
            }
        });

        const sorted = Array.from(clientMap.entries())
            .map(([name, val]) => ({ name, val }))
            .sort((a, b) => b.val - a.val)
            .slice(0, 5);

        const maxVal = sorted.length > 0 ? sorted[0].val : 1;
        return sorted.map(c => ({ ...c, max: maxVal }));
    }, [blocks]);

    // 4. OTD By Client (Bottom 5 for visibility)
    const clientOtd = useMemo(() => {
        const map = new Map();
        blocks.forEach((b: any) => {
            if (b.status === 'PLANNED' && b.plannedDate && b.deadline) {
                const client = b.clientName || 'Sin Cliente';
                if (!map.has(client)) map.set(client, { total: 0, onTime: 0 });
                const entry = map.get(client);
                entry.total++;
                if (new Date(b.plannedDate) <= new Date(b.deadline)) entry.onTime++;
            }
        });

        return Array.from(map.entries())
            .map(([name, d]: any) => ({ name, pct: Math.round((d.onTime / d.total) * 100), total: d.total }))
            .sort((a, b) => a.pct - b.pct) // Ascending (worst OTD first)
            .slice(0, 5); // Show bottom 5
    }, [blocks]);

    // 7. Efficiency (Real vs Planned for blocks that have Real Data)
    const efficiencyStats = useMemo(() => {
        const withRealData = blocks.filter((b: any) => b.realKg !== null && b.realKg !== undefined);
        if (withRealData.length === 0) return { deviation: 0, count: 0, diffKg: 0 };

        let totalPlanned = 0;
        let totalReal = 0;

        withRealData.forEach((b: any) => {
            totalPlanned += (b.units || 0);
            totalReal += (b.realKg || 0);
        });

        const diff = totalReal - totalPlanned;
        const pct = totalPlanned > 0 ? (diff / totalPlanned) * 100 : 0;

        return {
            deviation: pct,
            diffKg: diff,
            count: withRealData.length
        };
    }, [blocks]);

    // 6. General Totals (Updated to use Real Data)
    const totalFabricated = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return blocks.reduce((sum: number, b: any) => {
            if (b.status === 'PLANNED' && b.plannedDate && new Date(b.plannedDate) < today) {
                const val = (b.realKg !== null && b.realKg !== undefined) ? b.realKg : (b.units || 0);
                return sum + val;
            }
            return sum;
        }, 0);
    }, [blocks]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                <KpiCard label="Total Kg (6 Meses)" value={`${totalFabricated.toLocaleString()} kg`} color="#10b981" />
                <KpiCard label="OTD (Global)" value={`${otdStats.pct}%`} sub={`${otdStats.onTime}/${otdStats.total} a tiempo`} color={otdStats.pct > 90 ? '#10b981' : otdStats.pct > 70 ? '#f59e0b' : '#ef4444'} />
                <KpiCard
                    label="Desviación Kg"
                    value={`${efficiencyStats.deviation > 0 ? '+' : ''}${efficiencyStats.deviation.toFixed(1)}%`}
                    sub={`${efficiencyStats.diffKg > 0 ? '+' : ''}${efficiencyStats.diffKg.toLocaleString()} kg (${efficiencyStats.count} lotes)`}
                    color={Math.abs(efficiencyStats.deviation) < 5 ? '#10b981' : Math.abs(efficiencyStats.deviation) < 10 ? '#f59e0b' : '#ef4444'}
                />
                <KpiCard label="Peor Cliente (OTD)" value={clientOtd.length > 0 ? `${clientOtd[0].pct}%` : '-'} sub={clientOtd.length > 0 ? clientOtd[0].name : ''} color="#ef4444" />
                <KpiCard label="Pedidos Planificados" value={blocks.filter((b: any) => b.status === 'PLANNED').length} color="#6366f1" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Producción Mensual (Kg)</h3>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem', marginTop: '-1rem' }}>
                        * Se utilizan datos reales si están disponibles. Si no, se cuenta el teórico.
                    </p>
                    {reactors.length === 0 ? (
                        <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Cargando configuración...</div>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px' }}>
                            {historyData.map((m: any, i: number) => (
                                <div key={i} style={{ flex: 1, minWidth: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    {/* Group Container - FIXED HEIGHT FOR ALIGNMENT */}
                                    <div style={{
                                        height: '220px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '4px'
                                    }}>
                                        {m.reactors.map((r: any) => (
                                            <div key={r.label} style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end',
                                                width: '18px' // Static width for grouped columns
                                            }}>
                                                {/* Bar Container (Capacity 100%) */}
                                                <div style={{
                                                    width: '100%', height: '100%', background: '#f1f5f9', borderRadius: '4px 4px 0 0', position: 'relative', overflow: 'hidden'
                                                }} title={`${r.label}: ${r.kg.toLocaleString()} / ${r.capacity.toLocaleString()} kg (${r.pct}%)`}>

                                                    {/* Fill (Occupancy) */}
                                                    <div style={{
                                                        width: '100%',
                                                        height: `${Math.min(r.pct, 100)}%`,
                                                        background: r.pct > 100 ? '#ef4444' : r.color,
                                                        position: 'absolute', bottom: 0,
                                                        transition: 'height 0.3s'
                                                    }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Labels */}
                                    <div style={{ textAlign: 'center', marginTop: '8px', minHeight: '40px' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', textTransform: 'capitalize' }}>{m.label}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                            {m.kg.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Top 5 Clientes (Volumen)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {topClients.map((c: any) => (
                            <div key={c.name}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 500, color: '#334155' }}>{c.name}</span>
                                    <span style={{ color: '#64748b' }}>{(c.val / 1000).toFixed(1)}k</span>
                                </div>
                                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', marginTop: '4px' }}>
                                    <div style={{ width: `${(c.val / c.max) * 100}%`, background: '#8b5cf6', height: '100%', borderRadius: '3px' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                {/* OTD Breakdown */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ marginBottom: '1rem' }}>OTD por Cliente (5 Peores)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {clientOtd.map((c: any) => (
                            <div key={c.name}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                                    <span style={{ color: c.pct < 90 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{c.pct}%</span>
                                </div>
                                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                                    <div style={{ width: `${c.pct}%`, background: c.pct < 90 ? '#ef4444' : '#10b981', height: '100%' }}></div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{c.total} pedidos totales</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function KpiCard({ label, value, sub, color }: any) {
    return (
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{label}</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: color || '#1e293b', marginTop: '0.5rem', lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>{sub}</div>}
        </div>
    )
}
