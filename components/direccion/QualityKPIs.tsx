'use client';

import {
    ShieldCheck,
    AlertTriangle,
    ClipboardCheck,
    FileCheck,
    CheckCircle2,
    XCircle,
    Activity,
    Award
} from 'lucide-react';

export default function QualityKPIs() {
    const kpis = [
        { label: 'Incidencias (30d)', value: '4', change: '-2', isPositive: true, icon: <AlertTriangle size={20} /> },
        { label: 'Tasa No Conformidad', value: '1.2%', change: '-0.3%', isPositive: true, icon: <Activity size={20} /> },
        { label: 'Puntuación Auditoría', value: '96/100', change: '+2', isPositive: true, icon: <ClipboardCheck size={20} /> },
        { label: 'Quejas Clientes', value: '1', change: '0', isPositive: true, icon: <XCircle size={20} /> },
    ];

    const certifications = [
        { name: 'ISO 22716 (GMP Cosmética)', status: 'Active', expiry: 'Dec 2026', progress: 100 },
        { name: 'ISO 9001 (Calidad)', status: 'Review', expiry: 'Mar 2026', progress: 85 },
        { name: 'Ecocert / COSMOS', status: 'Active', expiry: 'June 2026', progress: 100 },
        { name: 'ISO 14001 (Medio Ambiente)', status: 'Active', expiry: 'Nov 2026', progress: 100 },
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
                                color: '#10b981',
                                background: '#ecfdf5',
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
                {/* Certification Status */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award size={18} /> Estado de Certificaciones
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {certifications.map((cert, i) => (
                            <div key={i} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#f8fafc' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{cert.name}</span>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        color: cert.status === 'Active' ? '#10b981' : '#f59e0b',
                                        background: cert.status === 'Active' ? '#ecfdf5' : '#fffbeb',
                                        padding: '2px 8px',
                                        borderRadius: '4px'
                                    }}>
                                        {cert.status.toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px' }}>
                                        <div style={{ width: `${cert.progress}%`, height: '100%', background: '#10b981', borderRadius: '4px' }} />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Exp: {cert.expiry}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quality Incidents Trend */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={18} /> Incidencias por Área
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { area: 'Fabricación', count: 2, color: 'var(--color-primary)' },
                            { area: 'Envasado', count: 1, color: 'var(--color-complementary)' },
                            { area: 'Almacén / Logística', count: 1, color: 'var(--color-text-heading)' },
                            { area: 'Laboratorio', count: 0, color: 'var(--color-text-muted)' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '120px', fontSize: '0.85rem', color: '#64748b' }}>{item.area}</div>
                                <div style={{ flex: 1, height: '24px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                                    <div style={{ width: `${item.count * 25}%`, height: '100%', background: item.color, opacity: 0.8 }} />
                                    <span style={{ position: 'absolute', right: '8px', top: '2px', fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>{item.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '32px', padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbfcce', display: 'flex', gap: '12px' }}>
                        <ShieldCheck style={{ color: '#10b981' }} size={24} />
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534' }}>Protocolo GMP al día</div>
                            <p style={{ fontSize: '0.75rem', color: '#166534', marginTop: '4px' }}>No se han detectado desviaciones críticas en los últimos 90 días.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
