'use client';

import {
    Factory,
    Activity,
    CheckCircle2,
    AlertTriangle,
    BarChart3,
    Weight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getProductionDashboardData } from '@/app/actions/production-dashboard';

export default function ProductionKPIs() {
    const [viewPeriod, setViewPeriod] = useState<'week' | 'month'>('week');
    const [complianceView, setComplianceView] = useState<'daily' | 'weekly' | 'monthly'>('weekly'); // Default to weekly as middle ground

    const [data, setData] = useState<{
        kpis: any[];
        plantStats: any[];
        weeklyTrend: { day: string, total: number, label: string, capacity: number }[];
        complianceData: {

            daily: { label: string, fullLabel: string, value: number, total: number, produced: number, isHoliday?: boolean }[];
            weekly: { label: string, fullLabel: string, value: number, total: number, produced: number }[];
            monthly: { label: string, fullLabel: string, value: number, total: number, produced: number }[];
        };

        periodLabel: string;
        debug?: string[];
    } | null>(null);


    useEffect(() => {
        setData(null); // Reset to show loading
        getProductionDashboardData(viewPeriod).then(setData);
    }, [viewPeriod]);

    // Icons map to match the order of KPIs returned by server
    const icons = [
        <Factory size={20} key="0" />,       // Production Monthly (New)
        <Weight size={20} key="1" />,        // KG Today
        <Activity size={20} key="2" />,      // OEE
        <CheckCircle2 size={20} key="3" />,  // Compliance (Filtered)
        <AlertTriangle size={20} key="4" />  // Rejects
    ];

    if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando datos de producción...</div>;

    // Dynamic Max for Graph (consider both produced and capacity)
    const maxVal = Math.max(
        ...data.weeklyTrend.map(d => Math.max(d.total, d.capacity)),
        100
    );

    // Calculate Totals for Summary
    const totalProduced = data.weeklyTrend.reduce((acc, d) => acc + d.total, 0);
    const totalCapacity = data.weeklyTrend.reduce((acc, d) => acc + d.capacity, 0);
    const utilization = totalCapacity > 0 ? (totalProduced / totalCapacity) * 100 : 0;

    // Exclude Compliance from top list (now at index 3)
    const topKpis = data.kpis.filter((_, i) => i !== 3);
    const topIcons = [icons[0], icons[1], icons[2], icons[4]];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top Cards (Minus Compliance) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                {topKpis.map((kpi, i) => (
                    <div key={i} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                        <div style={{
                            background: 'var(--color-secondary)',
                            color: 'var(--color-primary)',
                            marginBottom: '12px',
                            padding: '10px',
                            borderRadius: 'var(--border-radius-drop)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '42px', height: '42px'
                        }}>
                            {topIcons[i] || <Activity size={20} />}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{kpi.label}</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>

                            <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-heading)' }}>{kpi.value}</span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{kpi.unit}</span>
                        </div>
                        {kpi.footer && (
                            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                {kpi.footer}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Compliance Section */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>

                    {/* Header & Main KPI */}
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-heading)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, marginBottom: '8px' }}>
                            <CheckCircle2 size={18} color="var(--color-primary)" /> Cumplimiento de Planificiación
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-heading)' }}>
                                {data.kpis[2]?.value}
                            </span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>cumplimiento global</span>
                        </div>
                    </div>

                    {/* Legend / Info */}
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '10px', height: '10px', background: 'var(--color-primary)', borderRadius: '2px' }} />
                            <span>Cumplimiento Diario</span>
                        </div>
                    </div>
                </div>



                {/* Compliance Evolution Chart */}
                <div>
                    {/* Toggle Controls */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                            {(['daily', 'weekly', 'monthly'] as const).map(v => (
                                <button
                                    key={v}
                                    onClick={() => setComplianceView(v)}
                                    style={{
                                        padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                                        borderRadius: '6px',
                                        background: complianceView === v ? 'white' : 'transparent',
                                        color: complianceView === v ? '#0f172a' : '#64748b',
                                        boxShadow: complianceView === v ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {v === 'daily' ? 'Diaria' : (v === 'weekly' ? 'Semanal' : 'Mensual')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                        <div style={{ height: '220px', position: 'relative' }}>
                            {/* Grid Lines */}
                            {[0, 25, 50, 75, 100].map(pct => (
                                <div key={pct} style={{ position: 'absolute', bottom: `${pct}%`, left: 0, right: 0, borderTop: pct === 0 ? '1px solid #e2e8f0' : '1px dashed #f1f5f9', pointerEvents: 'none', zIndex: 0 }}>
                                    <span style={{ position: 'absolute', left: '-28px', top: '-8px', fontSize: '0.65rem', color: '#94a3b8' }}>{pct}%</span>
                                </div>
                            ))}
                            {/* Goal Line (95%) */}
                            <div style={{ position: 'absolute', bottom: '95%', left: 0, right: 0, borderTop: '1px dashed #10b981', opacity: 0.5, pointerEvents: 'none', zIndex: 1 }}>
                                <span style={{ position: 'absolute', right: '0', top: '-16px', fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>Meta 95%</span>
                            </div>

                            <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', paddingLeft: '20px', position: 'relative', zIndex: 2 }}>
                                {data.complianceData?.[complianceView]?.map((d, i) => {
                                    const day = d as any; // Cast to access isHoliday which only exists on daily view
                                    // Determine Tooltip
                                    let tooltip = `${day.fullLabel}: ${day.produced}/${day.total} (${day.value}%)`;
                                    if (day.isHoliday) tooltip = `${day.fullLabel}: Festivo (Planta Cerrada)`;
                                    else if (day.total === 0) tooltip = `${day.fullLabel}: Sin producción planificada`;

                                    // Determine Bar Style
                                    let barBackground = day.value >= 95 ? '#10b981' : (day.value >= 85 ? '#f59e0b' : '#ef4444');
                                    let barHeight = `${day.value}%`;
                                    let isStriped = false;

                                    if (day.isHoliday) {
                                        barBackground = `repeating-linear-gradient(
                                        45deg,
                                        #e2e8f0,
                                        #e2e8f0 10px,
                                        #f1f5f9 10px,
                                        #f1f5f9 20px
                                    )`;
                                        barHeight = '100%'; // Full height for holiday visualization
                                        isStriped = true;
                                    }

                                    return (
                                        <div key={i}
                                            title={tooltip}
                                            style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', cursor: 'default' }}>
                                            {/* Bar */}
                                            <div style={{ width: '100%', height: '100%', minHeight: (day.total > 0 || day.isHoliday) ? '4px' : '0', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                                <div style={{
                                                    width: complianceView === 'monthly' ? '40%' : '70%',
                                                    height: barHeight,
                                                    background: barBackground,
                                                    borderRadius: '4px 4px 0 0',
                                                    transition: 'height 0.5s ease',
                                                    border: day.isHoliday ? '1px dashed #cbd5e1' : 'none'
                                                }} />
                                            </div>

                                            {/* Axis Label */}
                                            <span style={{ fontSize: '0.7rem', color: day.isHoliday ? '#94a3b8' : '#64748b', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textAlign: 'center' }}>
                                                {day.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

            </div>


            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
                {/* Plant Efficiency */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Factory size={18} /> Eficiencia por Reactor (Coper)
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {data.plantStats.map((plant, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                    <span style={{ fontWeight: 600, color: '#475569' }}>{plant.plant}</span>
                                    <span style={{ fontWeight: 700, color: plant.efficiency >= 95 ? '#10b981' : '#f59e0b' }}>
                                        {plant.efficiency}%
                                    </span>
                                </div>
                                <div style={{ background: '#f1f5f9', height: '10px', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${Math.min(plant.efficiency, 100)}%`,
                                        background: plant.efficiency >= 95 ? '#10b981' : '#f59e0b',
                                        height: '100%',
                                        borderRadius: '10px'
                                    }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                                    <span>{plant.produced.toLocaleString()} kg Prod. / {plant.plannedLoad?.toLocaleString() || 0} kg Plan.</span>
                                    <span>Meta: {plant.planned.toLocaleString()} kg</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Production Trend Graph */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                <BarChart3 size={18} /> Producción Real vs Capacidad
                            </h3>
                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                                {data.periodLabel}
                            </span>
                            <span style={{
                                fontSize: '0.75rem', fontWeight: 700,
                                background: utilization > 100 ? '#fee2e2' : '#f0fdf4',
                                color: utilization > 100 ? '#dc2626' : '#15803d',
                                padding: '2px 8px', borderRadius: '12px',
                                border: `1px solid ${utilization > 100 ? '#fecaca' : '#bbf7d0'}`
                            }}>
                                {utilization.toFixed(1)}% Ocupación
                            </span>
                        </div>

                        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                            <button
                                onClick={() => setViewPeriod('week')}
                                style={{
                                    padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                                    borderRadius: '6px',
                                    background: viewPeriod === 'week' ? 'white' : 'transparent',
                                    color: viewPeriod === 'week' ? '#0f172a' : '#64748b',
                                    boxShadow: viewPeriod === 'week' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                Semanal
                            </button>
                            <button
                                onClick={() => setViewPeriod('month')}
                                style={{
                                    padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                                    borderRadius: '6px',
                                    background: viewPeriod === 'month' ? 'white' : 'transparent',
                                    color: viewPeriod === 'month' ? '#0f172a' : '#64748b',
                                    boxShadow: viewPeriod === 'month' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                Mensual
                            </button>
                        </div>
                    </div>

                    <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: viewPeriod === 'week' ? '12px' : '4px', paddingBottom: '20px' }}>
                        {data.weeklyTrend.map((dayData, i) => {
                            const realizedPct = (dayData.total / maxVal) * 100;
                            const capacityPct = (dayData.capacity / maxVal) * 100;

                            return (
                                <div key={i} style={{
                                    flex: 1,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'flex-end',
                                    alignItems: 'center',
                                    gap: '8px',
                                    position: 'relative'
                                }}>
                                    {/* Value Label (only if > 0 and week view for space) */}
                                    {dayData.total > 0 && viewPeriod === 'week' && (
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#3b82f6', marginBottom: '-4px', zIndex: 10 }}>
                                            {(dayData.total / 1000).toFixed(1)}k
                                        </span>
                                    )}

                                    {/* Bar Container */}
                                    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                        {/* Capacity Bar (Background) */}
                                        <div style={{
                                            width: viewPeriod === 'week' ? '100%' : '80%',
                                            height: `${capacityPct}%`,
                                            background: '#f1f5f9',
                                            borderRadius: '4px 4px 0 0',
                                            position: 'absolute',
                                            bottom: 0,
                                            borderTop: '2px dashed #94a3b8'
                                        }} title={`Capacidad: ${dayData.capacity} kg`} />

                                        {/* Produced Bar (Foreground) */}
                                        <div style={{
                                            width: viewPeriod === 'week' ? '100%' : '80%',
                                            height: `${realizedPct}%`,
                                            background: 'linear-gradient(to top, var(--color-primary), var(--color-primary-light))',
                                            borderRadius: '4px 4px 0 0',
                                            minHeight: dayData.total > 0 ? '4px' : '0',
                                            zIndex: 5,
                                            opacity: 0.9,
                                            transition: 'height 0.5s ease'
                                        }} title={`Producido: ${dayData.total} kg`} />
                                    </div>

                                    {/* Axis Label */}
                                    <span style={{ fontSize: viewPeriod === 'week' ? '0.7rem' : '0.6rem', color: '#64748b', fontWeight: 600 }}>
                                        {dayData.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Metrics Footer */}
                    <div style={{
                        borderTop: '1px solid #e2e8f0',
                        paddingTop: '16px',
                        marginTop: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        color: '#64748b'
                    }}>
                        <div>
                            Total Producido: <strong style={{ color: '#0f172a' }}>{totalProduced.toLocaleString()} kg</strong>
                        </div>
                        <div>
                            Capacidad Disponible: <strong style={{ color: '#0f172a' }}>{totalCapacity.toLocaleString()} kg</strong>
                        </div>
                    </div>
                </div>
            </div>

        </div >
    );
}
