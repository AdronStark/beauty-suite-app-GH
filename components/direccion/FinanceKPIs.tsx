'use client';

import {
    Euro,
    TrendingUp,
    TrendingDown,
    BarChart3,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
    Target,
    DollarSign
} from 'lucide-react';
import { useState } from 'react';

export default function FinanceKPIs() {
    const [selectedYear, setSelectedYear] = useState<'2025' | '2026'>('2025');
    const [maxMonth, setMaxMonth] = useState<number>(12); // 12 means full year default for 2025

    // Mock Data Store
    const financeData = {
        '2025': {
            months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            rows: [
                { label: 'Ingresos Totales', data: [620, 580, 650, 680, 710, 740, 690, 550, 720, 750, 780, 730], pptoData: [650, 650, 650, 650, 650, 650, 650, 650, 650, 650, 650, 850], type: 'header' },
                { label: 'Coste Ventas', data: [-210, -200, -220, -230, -240, -250, -230, -190, -245, -255, -265, -248], pptoData: [-220, -220, -220, -220, -220, -220, -220, -220, -220, -220, -220, -280], type: 'normal' },
                { label: 'Margen Bruto', data: [], pptoData: [], type: 'subtotal', formula: (i: number, r: any) => r[0].data[i] + r[1].data[i], formulaPpto: (i: number, r: any) => r[0].pptoData[i] + r[1].pptoData[i] },
                { label: 'Personal', data: [-145, -145, -145, -148, -150, -150, -150, -150, -155, -155, -160, -160], pptoData: [-150, -150, -150, -150, -150, -150, -150, -150, -150, -150, -150, -150], type: 'normal' },
                { label: 'Marketing', data: [-60, -55, -65, -70, -68, -72, -50, -40, -75, -80, -90, -85], pptoData: [-60, -60, -60, -70, -70, -70, -60, -50, -70, -80, -90, -90], type: 'normal' },
                { label: 'Otros Gastos', data: [-58, -55, -60, -62, -65, -68, -60, -55, -65, -70, -75, -70], pptoData: [-60, -60, -60, -60, -60, -60, -60, -60, -60, -60, -60, -90], type: 'normal' },
                { label: 'EBITDA', data: [], pptoData: [], type: 'total', formula: (i: number, r: any) => (r[0].data[i] + r[1].data[i]) + r[3].data[i] + r[4].data[i] + r[5].data[i], formulaPpto: (i: number, r: any) => (r[0].pptoData[i] + r[1].pptoData[i]) + r[3].pptoData[i] + r[4].pptoData[i] + r[5].pptoData[i] },
                { label: 'Amortizaciones', data: [-25, -25, -25, -25, -25, -25, -25, -25, -25, -25, -25, -25], pptoData: [-25, -25, -25, -25, -25, -25, -25, -25, -25, -25, -25, -25], type: 'normal' },
                { label: 'EBIT', data: [], pptoData: [], type: 'total', formula: (i: number, r: any) => ((r[0].data[i] + r[1].data[i]) + r[3].data[i] + r[4].data[i] + r[5].data[i]) + r[7].data[i], formulaPpto: (i: number, r: any) => ((r[0].pptoData[i] + r[1].pptoData[i]) + r[3].pptoData[i] + r[4].pptoData[i] + r[5].pptoData[i]) + r[7].pptoData[i] },
            ]
        },
        '2026': {
            months: ['Ene', 'Feb', 'Mar'], // Only 3 months YTD
            rows: [
                { label: 'Ingresos Totales', data: [750, 780, 810], pptoData: [720, 730, 740], type: 'header' },
                { label: 'Coste Ventas', data: [-255, -265, -275], pptoData: [-240, -245, -250], type: 'normal' },
                { label: 'Margen Bruto', data: [], pptoData: [], type: 'subtotal', formula: (i: number, r: any) => r[0].data[i] + r[1].data[i], formulaPpto: (i: number, r: any) => r[0].pptoData[i] + r[1].pptoData[i] },
                { label: 'Personal', data: [-165, -165, -170], pptoData: [-160, -160, -160], type: 'normal' },
                { label: 'Marketing', data: [-70, -75, -80], pptoData: [-70, -70, -70], type: 'normal' },
                { label: 'Otros Gastos', data: [-70, -72, -75], pptoData: [-65, -65, -70], type: 'normal' },
                { label: 'EBITDA', data: [], pptoData: [], type: 'total', formula: (i: number, r: any) => (r[0].data[i] + r[1].data[i]) + r[3].data[i] + r[4].data[i] + r[5].data[i], formulaPpto: (i: number, r: any) => (r[0].pptoData[i] + r[1].pptoData[i]) + r[3].pptoData[i] + r[4].pptoData[i] + r[5].pptoData[i] },
                { label: 'Amortizaciones', data: [-28, -28, -28], pptoData: [-28, -28, -28], type: 'normal' },
                { label: 'EBIT', data: [], pptoData: [], type: 'total', formula: (i: number, r: any) => ((r[0].data[i] + r[1].data[i]) + r[3].data[i] + r[4].data[i] + r[5].data[i]) + r[7].data[i], formulaPpto: (i: number, r: any) => ((r[0].pptoData[i] + r[1].pptoData[i]) + r[3].pptoData[i] + r[4].pptoData[i] + r[5].pptoData[i]) + r[7].pptoData[i] },
            ]
        }
    };

    const activeYearData = financeData[selectedYear];
    const availableMonths = activeYearData.months;
    const currentMonthsToShow = Math.min(maxMonth, availableMonths.length);
    const months = availableMonths.slice(0, currentMonthsToShow);

    // Calculate computed rows (Margins, EBITDA, etc.)
    const processedRows = activeYearData.rows.map((row, rowIndex, allRows) => {
        let computedData = row.data;
        let computedPpto = row.pptoData;

        if (row.formula) {
            computedData = months.map((_, colIndex) => row.formula(colIndex, allRows));
        }
        if (row.formulaPpto) {
            // NOTE: We need to calculate full budget array first if we want full year reference, 
            // but here we just need up to current displayed month for YTD?
            // Actually for formula cols we should compute same length as months.
            computedPpto = months.map((_, colIndex) => row.formulaPpto!(colIndex, allRows));
        }

        return {
            ...row,
            data: computedData.slice(0, currentMonthsToShow),
            pptoData: computedPpto.slice(0, currentMonthsToShow)
        };
    });


    // Dynamic KPI Calculation
    const ebitdaRow = processedRows.find(r => r.label === 'EBITDA');
    const marginRow = processedRows.find(r => r.label === 'Margen Bruto');
    const revenueRow = processedRows.find(r => r.label === 'Ingresos Totales');

    // Helper for formatting large numbers
    const formatCurrencyMetric = (val: number) => {
        if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(2)}M €`;
        return `${val.toFixed(0)}k €`;
    };

    const getVarPercent = (actual: number, ppto: number) => {
        if (ppto === 0) return 0;
        return ((actual - ppto) / Math.abs(ppto)) * 100;
    };

    const topCards = [];

    if (ebitdaRow && marginRow && revenueRow) {
        // Common calculations needed for multiple cards
        const revenueYTD = revenueRow.data.reduce((a, b) => a + b, 0);
        const revenuePptoYTD = revenueRow.pptoData.reduce((a, b) => a + b, 0);

        const ebitdaYTD = ebitdaRow.data.reduce((a, b) => a + b, 0);
        const ebitdaPptoYTD = ebitdaRow.pptoData.reduce((a, b) => a + b, 0);
        const ebitdaVar = getVarPercent(ebitdaYTD, ebitdaPptoYTD);

        const lastIdx = months.length - 1;
        const ebitdaLast = ebitdaRow.data[lastIdx];
        const ebitdaPptoLast = ebitdaRow.pptoData[lastIdx];
        const ebitdaLastVar = getVarPercent(ebitdaLast, ebitdaPptoLast);

        const marginYTD = marginRow.data.reduce((a, b) => a + b, 0);
        const marginPercent = revenueYTD !== 0 ? (marginYTD / revenueYTD) * 100 : 0;
        const marginPptoYTD = marginRow.pptoData.reduce((a, b) => a + b, 0);
        const revenuePptoYTDForMargin = revenueRow.pptoData.reduce((a, b) => a + b, 0); // Recalculate if needed, or use revenuePptoYTD
        const marginPptoPercent = revenuePptoYTDForMargin !== 0 ? (marginPptoYTD / revenuePptoYTDForMargin) * 100 : 0;
        const marginDiff = marginPercent - marginPptoPercent;

        // 1. Facturación YTD
        topCards.push({
            label: 'Facturación YTD',
            value: formatCurrencyMetric(revenueYTD),
            change: `${getVarPercent(revenueYTD, revenuePptoYTD).toFixed(1)}% vs ${formatCurrencyMetric(revenuePptoYTD)} (PPTO)`,
            isPositive: getVarPercent(revenueYTD, revenuePptoYTD) >= 0,
            icon: <DollarSign size={20} />
        });

        // 2. EBITDA YTD
        topCards.push({
            label: `EBITDA YTD (${selectedYear})`,
            value: formatCurrencyMetric(ebitdaYTD),
            change: `${ebitdaVar > 0 ? '+' : ''}${ebitdaVar.toFixed(1)}% vs ${formatCurrencyMetric(ebitdaPptoYTD)} (PPTO)`,
            isPositive: ebitdaVar >= 0,
            icon: <Euro size={20} />
        });

        // 3. EBITDA Last Month
        topCards.push({
            label: `EBITDA ${months[lastIdx]}`,
            value: formatCurrencyMetric(ebitdaLast),
            change: `${ebitdaLastVar > 0 ? '+' : ''}${ebitdaLastVar.toFixed(1)}% vs ${formatCurrencyMetric(ebitdaPptoLast)} (PPTO)`,
            isPositive: ebitdaLastVar >= 0,
            icon: <BarChart3 size={20} />
        });

        // 4. Margin % YTD
        topCards.push({
            label: 'Margen Bruto Total',
            value: `${marginPercent.toFixed(1)}%`,
            change: `${marginDiff > 0 ? '+' : ''}${marginDiff.toFixed(1)} pp vs ${marginPptoPercent.toFixed(1)}% (PPTO)`,
            isPositive: marginDiff >= 0,
            icon: <TrendingUp size={20} />
        });
    }

    const marginByFamily = [
        { family: 'Facial Premium', margin: 62 },
        { family: 'Corporal Gran Consumo', margin: 34 },
        { family: 'Capilar Tratamiento', margin: 48 },
        { family: 'Solares', margin: 55 },
        { family: 'Dermocosmética', margin: 58 },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                {topCards.map((kpi, i) => (
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
                                color: kpi.isPositive ? '#10b981' : '#ef4444',
                                background: kpi.isPositive ? '#ecfdf5' : '#fef2f2',
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

            {/* P&L Evolution Table */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <BarChart3 size={18} /> Cuenta de Resultados
                        </h3>
                        <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                            {['2025', '2026'].map(year => (
                                <button
                                    key={year}
                                    onClick={() => { setSelectedYear(year as any); setMaxMonth(12); }}
                                    style={{
                                        padding: '4px 12px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        border: 'none',
                                        background: selectedYear === year ? 'white' : 'transparent',
                                        color: selectedYear === year ? 'var(--color-primary)' : '#64748b',
                                        borderRadius: '4px',
                                        boxShadow: selectedYear === year ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                        <select
                            value={maxMonth}
                            onChange={(e) => setMaxMonth(Number(e.target.value))}
                            style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.8rem',
                                color: '#475569',
                                outline: 'none'
                            }}
                        >
                            <option value={12}>Año Completo</option>
                            {availableMonths.map((m, i) => (
                                <option key={m} value={i + 1}>Hasta {m}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', padding: '4px 12px', background: '#f8fafc', borderRadius: '20px', fontWeight: 600, color: '#64748b', border: '1px solid #e2e8f0' }}>
                            Datos en Miles de €
                        </span>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600, minWidth: '180px' }}>Concepto</th>
                                {months.map(m => (
                                    <th key={m} style={{ textAlign: 'right', padding: '12px', color: '#64748b', fontWeight: 600 }}>{m}</th>
                                ))}
                                <th style={{ textAlign: 'right', padding: '12px', color: '#1e293b', fontWeight: 700, borderLeft: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                    YTD {selectedYear}
                                </th>
                                <th style={{ textAlign: 'right', padding: '12px', color: '#64748b', fontWeight: 600 }}>PPTO YTD</th>
                                <th style={{ textAlign: 'right', padding: '12px', color: '#64748b', fontWeight: 600 }}>Var %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedRows.map((row, i) => {
                                const ytd = row.data.reduce((a, b) => a + b, 0);
                                const adjustedPpto = row.pptoData.reduce((a, b) => a + b, 0);

                                const v = ytd - adjustedPpto;
                                const vp = adjustedPpto !== 0 ? ((v / Math.abs(adjustedPpto)) * 100).toFixed(1) : '0.0';

                                let rowStyle: any = { borderBottom: '1px solid #f1f5f9' };
                                let labelStyle: any = { padding: '12px 16px', fontWeight: 500, color: '#475569' };
                                let cellStyle: any = { textAlign: 'right', padding: '12px', fontFamily: 'monospace', color: '#475569' };

                                if (row.type === 'header' || row.type === 'subtotal') {
                                    labelStyle = { ...labelStyle, fontWeight: 700, color: '#1e293b' };
                                    cellStyle = { ...cellStyle, fontWeight: 600, color: '#1e293b' };
                                    if (row.type === 'subtotal') rowStyle = { ...rowStyle, background: '#f8fafc' };
                                }
                                if (row.type === 'total') {
                                    labelStyle = { ...labelStyle, fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' };
                                    cellStyle = { ...cellStyle, fontWeight: 700, color: '#0f172a' };
                                    rowStyle = { borderBottom: '2px solid #e2e8f0', background: '#f1f5f9' };
                                }

                                return (
                                    <tr key={i} style={rowStyle}>
                                        <td style={labelStyle}>{row.label}</td>
                                        {row.data.map((val, idx) => (
                                            <td key={idx} style={cellStyle}>
                                                {val.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </td>
                                        ))}
                                        <td style={{ ...cellStyle, borderLeft: '1px solid #e2e8f0', fontWeight: 700, background: '#f8fafc' }}>
                                            {ytd.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </td>
                                        <td style={cellStyle}>
                                            {adjustedPpto.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </td>
                                        <td style={{ ...cellStyle }}>
                                            <span style={{
                                                color: Number(vp) >= 0 ? (row.type === 'normal' && row.label !== 'Ingresos Totales' ? '#ef4444' : '#10b981') : (row.type === 'normal' && row.label !== 'Ingresos Totales' ? '#10b981' : '#ef4444'),
                                                background: Number(vp) >= 0 ? (row.type === 'normal' && row.label !== 'Ingresos Totales' ? '#fef2f2' : '#ecfdf5') : (row.type === 'normal' && row.label !== 'Ingresos Totales' ? '#ecfdf5' : '#fef2f2'),
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700
                                            }}>
                                                {Number(vp) > 0 ? '+' : ''}{vp}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                {/* Waterfall / Flow Simulation */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PieChart size={18} /> Desglose de Ventas vs Costes
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {[
                            { label: 'Ventas Totales', value: 100, color: 'var(--color-primary)', isHeader: true },
                            { label: 'Materias Primas', value: -35, color: '#94a3b8' },
                            { label: 'Packaging', value: -12, color: '#94a3b8' },
                            { label: 'MOD (Personal)', value: -10, color: '#94a3b8' },
                            { label: 'Otros Indirectos', value: -8, color: '#94a3b8' },
                            { label: 'Margen Neto', value: 35, color: 'var(--color-success)', isTotal: true },
                        ].map((row, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '150px', fontSize: '0.85rem', fontWeight: row.isHeader || row.isTotal ? 700 : 500, color: row.isTotal ? '#10b981' : '#475569' }}>
                                    {row.label}
                                </div>
                                <div style={{ flex: 1, background: '#f1f5f9', height: '12px', borderRadius: '6px', overflow: 'hidden', display: 'flex', justifyContent: row.value < 0 ? 'flex-end' : 'flex-start' }}>
                                    <div style={{
                                        width: `${Math.abs(row.value)}%`,
                                        background: row.color,
                                        height: '100%',
                                        marginLeft: row.value > 0 && !row.isHeader ? '65%' : '0' // Very rough waterfall simulation
                                    }} />
                                </div>
                                <div style={{ width: '40px', fontSize: '0.8rem', fontWeight: 700, color: row.color, textAlign: 'right' }}>
                                    {row.value > 0 ? '+' : ''}{row.value}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Margins by Family */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Target size={18} /> Rentabilidad por Familia
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {marginByFamily.map((family, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>{family.family}</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{family.margin}%</span>
                                </div>
                                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${family.margin}%`, height: '100%', background: family.margin > 50 ? '#10b981' : '#3b82f6', borderRadius: '4px' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '32px', padding: '16px', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', display: 'flex', gap: '12px' }}>
                        <ArrowUpRight style={{ color: '#0ea5e9' }} size={24} />
                        <div style={{ fontSize: '0.8rem', color: '#0369a1' }}>
                            <b>Optimización de Margen:</b> La familia 'Premium' ha mejorado un 4% tras renegociar con el proveedor de envases de vidrio.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
