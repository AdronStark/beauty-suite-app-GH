'use client';

import {
    TrendingUp,
    Target,
    Clock,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Euro,
    Loader2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/formatters';

export default function CommercialKPIs() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard/commercial')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" /></div>;
    if (!data) return <div>Error cargando datos.</div>;

    const { kpis, forecastChart, scatterData, topClients } = data;

    const cards = [
        { label: 'Ingresos Comprometidos', value: formatCurrency(kpis.wonValue, 0), detail: 'Ofertas Ganadas', icon: <Euro size={20} />, color: 'var(--color-primary)', bg: 'var(--color-secondary)' },
        { label: 'Pipeline Ponderado', value: formatCurrency(kpis.weightedPipeline, 0), detail: 'Forecast', icon: <TrendingUp size={20} />, color: 'var(--color-complementary)', bg: '#f1f5f9' },
        { label: 'Margen Medio Est.', value: `${kpis.avgMargin.toFixed(1)}%`, detail: 'En Ganadas', icon: <Target size={20} />, color: 'var(--color-text-heading)', bg: '#f8fafc' },
        { label: 'Conversión (Valor)', value: `${kpis.conversionRateValue.toFixed(1)}%`, detail: `${kpis.conversionRateCount.toFixed(1)}% en Volumen`, icon: <BarChart3 size={20} />, color: 'var(--color-text-muted)', bg: '#f1f5f9' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top Cards Financial Focus */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                {cards.map((card, i) => (
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
                                {card.icon}
                            </div>
                            <div style={{ background: card.bg, color: card.color, padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                                {card.detail}
                            </div>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{card.label}</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-heading)', marginTop: '4px' }}>{card.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                {/* Revenue Forecast Chart */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-heading)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={18} /> Previsión de Flujo de Caja (Próximos Meses)
                    </h3>
                    <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '12px', paddingBottom: '24px' }}>
                        {forecastChart.map((item: any, i: number) => {
                            const maxVal = Math.max(...forecastChart.map((d: any) => d.won + d.pipeline)) || 1;
                            const hWon = (item.won / maxVal) * 100;
                            const hPipe = (item.pipeline / maxVal) * 100;

                            return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                    <div style={{ width: '60%', display: 'flex', flexDirection: 'column-reverse', height: '100%', justifyContent: 'flex-end' }}>
                                        {/* Won Part */}
                                        <div style={{
                                            height: `${hWon}%`,
                                            background: 'var(--color-primary)',
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'height 0.5s',
                                            opacity: 0.9
                                        }} title={`Cerrado: ${formatCurrency(item.won, 0)}`} />
                                        {/* Pipeline Part */}
                                        <div style={{
                                            height: `${hPipe}%`,
                                            background: 'var(--color-complementary)',
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'height 0.5s',
                                            opacity: 0.6,
                                            marginBottom: '1px'
                                        }} title={`Forecast: ${formatCurrency(item.pipeline, 0)}`} />
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '8px', transform: 'rotate(-45deg)', transformOrigin: 'left top', whiteSpace: 'nowrap' }}>
                                        {item.month}
                                    </span>
                                </div>
                            );
                        })}
                        {forecastChart.length === 0 && <div style={{ margin: 'auto', color: 'var(--color-text-muted)' }}>No hay datos suficientes para forecast</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, background: 'var(--color-primary)' }}></div> Cerrado</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, background: 'var(--color-complementary)' }}></div> Pipeline Ponderado</div>
                    </div>
                </div>

                {/* Top Clients Pareto */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-heading)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Target size={18} /> Top Clientes (Pareto Valor)
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {topClients.map((client: any, i: number) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{client.name}</span>
                                    <span style={{ fontWeight: 700, color: 'var(--color-text-heading)' }}>{formatCurrency(client.value, 0)}</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px' }}>
                                    <div style={{
                                        width: `${(client.value / topClients[0].value) * 100}%`,
                                        height: '100%',
                                        background: i === 0 ? 'var(--color-primary)' : 'var(--color-complementary)',
                                        borderRadius: '3px'
                                    }} />
                                </div>
                            </div>
                        ))}
                        {topClients.length === 0 && <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin datos de clientes</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
