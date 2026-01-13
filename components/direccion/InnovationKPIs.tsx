'use client';

import {
    FlaskConical,
    Beaker,
    Clock,
    Target,
    Zap,
    TrendingUp,
    FileText,
    Rocket
} from 'lucide-react';

export default function InnovationKPIs() {
    const kpis = [
        { label: 'Proyectos Activos', value: '28', change: '+3', isPositive: true, icon: <Beaker size={20} /> },
        { label: 'Time-to-Market', value: '4.5m', change: '-0.2m', isPositive: true, icon: <Clock size={20} /> },
        { label: 'Lanzamientos (YTD)', value: '12', change: '+2', isPositive: true, icon: <Rocket size={20} /> },
        { label: 'Nuevas Fórmulas', value: '142', change: '+15', isPositive: true, icon: <FlaskConical size={20} /> },
    ];

    const pipeline = [
        { stage: 'Briefing / Ideación', count: 12, color: 'var(--color-text-muted)' },
        { stage: 'Formulación / Lab', count: 8, color: 'var(--color-primary-light)' },
        { stage: 'Testing / Estabilidad', count: 5, color: 'var(--color-complementary)' },
        { stage: 'Registro / Escalar', count: 3, color: 'var(--color-primary)' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                {kpis.map((kpi, i) => (
                    <div key={i} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{
                                background: 'var(--color-secondary)',
                                color: 'var(--color-primary)',
                                padding: '10px',
                                borderRadius: 'var(--border-radius-drop)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '42px', height: '42px'
                            }}>
                                {kpi.icon}
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'var(--color-primary)',
                                background: 'var(--color-secondary)',
                                padding: '2px 8px',
                                borderRadius: '12px'
                            }}>
                                {kpi.change}
                            </div>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{kpi.label}</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-heading)', marginTop: '4px' }}>{kpi.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* R&D Pipeline */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Target size={18} /> Oleoducto de Innovación (Pipeline)
                    </h3>
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0' }}>
                        {pipeline.map((item, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                height: '50px',
                                background: `${item.color}15`,
                                borderRadius: '8px',
                                marginBottom: '8px',
                                padding: '0 16px',
                                borderLeft: `4px solid ${item.color}`
                            }}>
                                <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>{item.stage}</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: item.color }}>{item.count} <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>proy.</span></div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <button style={{
                            background: 'transparent',
                            border: '1px solid #e2e8f0',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            color: '#64748b',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}>
                            Ver todos los proyectos en Briefings app
                        </button>
                    </div>
                </div>

                {/* Categories / Impact */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={18} /> Mix de Innovación por Categoría
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {[
                            { label: 'Cuidado Facial', value: 45, color: 'var(--color-primary)' },
                            { label: 'Capilar', value: 25, color: 'var(--color-complementary)' },
                            { label: 'Corporal', value: 20, color: 'var(--color-text-heading)' },
                            { label: 'Solares', value: 10, color: 'var(--color-text-muted)' },
                        ].map((cat, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                                    <span>{cat.label}</span>
                                    <span>{cat.value}%</span>
                                </div>
                                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${cat.value}%`, height: '100%', background: cat.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '12px', background: '#fef3c7', border: '1px solid #fde68a' }}>
                        <Zap size={24} style={{ color: '#d97706' }} />
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400e' }}>Oportunidad Detectada</div>
                            <p style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '2px' }}>Alta demanda en protectores solares SPF50+. 3 nuevos desarrollos priorizados.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
