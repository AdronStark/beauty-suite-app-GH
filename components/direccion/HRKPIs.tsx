'use client';

import {
    Users,
    UserPlus,
    UserMinus,
    History,
    AlertCircle,
    TrendingDown,
    Activity,
    MapPin
} from 'lucide-react';

export default function HRKPIs() {
    const kpis = [
        { label: 'Total Plantilla', value: '428', change: '+5', isPositive: true, icon: <Users size={20} /> },
        { label: 'Tasa Absentismo', value: '3.4%', change: '-0.2%', isPositive: true, icon: <Activity size={20} /> },
        { label: 'ETTs Contratadas', value: '24', change: '+3', isPositive: false, icon: <UserPlus size={20} /> },
        { label: 'Rotación Mensual', value: '1.8%', change: '-0.5%', isPositive: true, icon: <History size={20} /> },
    ];

    const plantData = [
        { name: 'Planta Principal', employees: 215, absenteeism: 2.8, etts: 12 },
        { name: 'Planta Logística', employees: 84, absenteeism: 4.2, etts: 8 },
        { name: 'Laboratorios', employees: 42, absenteeism: 1.5, etts: 0 },
        { name: 'Oficinas', employees: 87, absenteeism: 1.2, etts: 4 },
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
                                color: kpi.isPositive ? '#10b981' : '#f59e0b',
                                background: kpi.isPositive ? '#ecfdf5' : '#fffbeb',
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
                {/* Plant Breakdown Table */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={18} /> Datos por Centro de Trabajo
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>PLANTA</th>
                                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>EMP.</th>
                                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>ETTs</th>
                                <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>ABSENTISMO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plantData.map((plant, i) => (
                                <tr key={i} style={{ borderBottom: i === plantData.length - 1 ? 'none' : '1px solid #f8fafc' }}>
                                    <td style={{ padding: '16px 8px', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>{plant.name}</td>
                                    <td style={{ textAlign: 'center', padding: '16px 8px', fontSize: '0.85rem', color: '#64748b' }}>{plant.employees}</td>
                                    <td style={{ textAlign: 'center', padding: '16px 8px', fontSize: '0.85rem', color: '#64748b' }}>{plant.etts}</td>
                                    <td style={{ textAlign: 'right', padding: '16px 8px', fontSize: '0.85rem' }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            background: plant.absenteeism > 4 ? '#fef2f2' : plant.absenteeism > 2 ? '#fffbeb' : '#ecfdf5',
                                            color: plant.absenteeism > 4 ? '#ef4444' : plant.absenteeism > 2 ? '#f59e0b' : '#10b981',
                                            fontWeight: 700
                                        }}>
                                            {plant.absenteeism}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Absenteeism Trend (Simulated) */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingDown size={18} /> Tendencia Absentismo
                    </h3>
                    <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', paddingBottom: '20px' }}>
                        {[4.2, 3.8, 4.5, 4.0, 3.6, 3.4].map((val, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '100%',
                                    height: `${val * 20}%`,
                                    background: val > 4 ? '#fecaca' : '#c7d2fe',
                                    borderRadius: '4px 4px 0 0',
                                    position: 'relative'
                                }}>
                                    <div style={{ position: 'absolute', top: '-20px', left: 0, right: 0, textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>{val}%</div>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>M{i + 1}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontSize: '0.8rem', fontWeight: 600 }}>
                            <AlertCircle size={14} style={{ color: '#f59e0b' }} />
                            Alerta: Planta Logística
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Absentismo superior al 4% este mes. Se recomienda revisión de turnos.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
