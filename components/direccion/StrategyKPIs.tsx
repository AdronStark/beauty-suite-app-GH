'use client';

import {
    Compass,
    Map,
    Flag,
    Milestone,
    CheckCircle,
    Rocket,
    ArrowRight,
    Zap,
    Briefcase,
    Layers,
    Factory
} from 'lucide-react';

export default function StrategyKPIs() {
    const kpis = [
        { label: 'Grado Avance Plan', value: '42%', change: '+5%', isPositive: true, icon: <Compass size={20} /> },
        { label: 'Inversión CAPEX', value: '1,2M €', change: '80% ejec.', isPositive: true, icon: <Briefcase size={20} /> },
        { label: 'Hitos Cumplidos', value: '8/12', change: '+1', isPositive: true, icon: <Flag size={20} /> },
        { label: 'Indice Sostenibilidad', value: '78/100', change: '+12', isPositive: true, icon: <Zap size={20} /> },
    ];

    const roadmap = [
        { title: 'Nueva Planta JUMSA II', date: 'Q3 2026', status: 'In Progress', progress: 35, color: 'var(--color-primary)' },
        { title: 'Digitalización Total (Paperless)', date: 'Q1 2026', status: 'On Track', progress: 65, color: 'var(--color-complementary)' },
        { title: 'Certificación B Corp', date: 'Q4 2026', status: 'Planned', progress: 10, color: 'var(--color-text-muted)' },
        { title: 'Nueva Línea Envasado 1000L', date: 'Q2 2026', status: 'Risk', progress: 20, color: 'var(--color-error)' },
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
                                color: 'var(--color-text)',
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

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                {/* Roadmap Visualization */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Map size={18} /> Hoja de Ruta Estratégica
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '16px', top: '10px', bottom: '10px', width: '2px', background: '#f1f5f9' }} />

                        {roadmap.map((milestone, i) => (
                            <div key={i} style={{ display: 'flex', gap: '24px', position: 'relative', zIndex: 1 }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    border: `3px solid ${milestone.color}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Milestone size={14} style={{ color: milestone.color }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>{milestone.title}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Fecha Objetivo: <b>{milestone.date}</b></div>
                                        </div>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            color: milestone.color,
                                            background: `${milestone.color}15`,
                                            padding: '2px 8px',
                                            borderRadius: '4px'
                                        }}>
                                            {milestone.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ marginTop: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8' }}>
                                            <span>Progreso</span>
                                            <span>{milestone.progress}%</span>
                                        </div>
                                        <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${milestone.progress}%`, height: '100%', background: milestone.color }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CAPEX Allocation */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={18} /> Distribución Inversión CAPEX
                    </h3>
                    <div style={{ height: '180px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                        [ Gráfico de Inversiones ]
                    </div>
                    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { label: 'Maquinaria y Procesos', val: '450k', pct: 38, color: 'var(--color-primary)' },
                            { label: 'Sistemas (IT/Software)', val: '320k', pct: 27, color: 'var(--color-complementary)' },
                            { label: 'Instalaciones (Planta)', val: '280k', pct: 23, color: 'var(--color-text-heading)' },
                            { label: 'Eficiencia Energética', val: '150k', pct: 12, color: 'var(--color-text-muted)' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                                    <span style={{ color: '#475569', fontWeight: 500 }}>{item.label}</span>
                                </div>
                                <span style={{ fontWeight: 700, color: '#1e293b' }}>{item.val} € <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>({item.pct}%)</span></span>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '24px', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Balance de CAPEX utilizado:</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>82%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
