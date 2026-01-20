
import React from 'react';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { calculateOfferCosts } from '@/lib/offerCalculations';
import { BarChart3, TrendingUp, TrendingDown, Euro } from 'lucide-react';

interface SummaryItem {
    id: string;
    productName: string;
    resultsSummary: {
        units: number;
        directCost: number;
        salePrice: number;
        profit: number;
        totalValue: number;
    };
    inputData: any;
}

interface Scenario {
    units: number;
    totalCost: number;
    totalPrice: number;
    unitCost: number;
    unitPrice: number;
    margin: number;
    marginPercent: number;
    description?: string;
    // Original inputs
    qty?: number;
    mode?: 'UNITS' | 'KG';
    extrasOverride?: any;
}

interface EncodedItem {
    id: string;
    productName: string;
    resultsSummary: any; // Could be string or object
    inputData: any;
}

export default function OfferSummaryGlobal({ items }: { items: EncodedItem[] }) {

    // 1. Normalize items (parse JSON if needed)
    const normalizedItems: SummaryItem[] = items.map(i => {
        const summary = typeof i.resultsSummary === 'string' ? JSON.parse(i.resultsSummary) : (i.resultsSummary || {});
        return {
            id: i.id,
            productName: i.productName,
            resultsSummary: {
                units: Number(summary.units || 0),
                directCost: Number(summary.directCost || 0),
                salePrice: Number(summary.salePrice || 0),
                profit: Number(summary.profit || 0),
                totalValue: Number(summary.totalValue || 0)
            },
            inputData: typeof i.inputData === 'string' ? JSON.parse(i.inputData) : (i.inputData || {})
        };
    });

    // 2. Aggregate Totals
    const totals = normalizedItems.reduce((acc, item) => {
        // DYNAMIC CALCULATION: Recalculate using inputData to match the rows (live data)
        const mainConfig = item.inputData.snapshotConfig || {};
        const mainResults = calculateOfferCosts(item.inputData, mainConfig);

        const units = mainResults.derivedUnits;
        const totalCost = mainResults.directCost * units;
        const totalSales = mainResults.salePrice * units;

        return {
            units: acc.units + units,
            cost: acc.cost + totalCost,
            sales: acc.sales + totalSales,
        };
    }, { units: 0, cost: 0, sales: 0 });

    const totalMargin = totals.sales - totals.cost;
    const marginPercent = totals.sales > 0 ? (totalMargin / totals.sales) * 100 : 0;

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', background: '#dbeafe', borderRadius: '8px', color: '#1e40af' }}>
                    <BarChart3 size={32} />
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Resumen Global de la Oferta</h2>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>Visión consolidada de todos los productos</p>
                </div>
            </div>



            {/* BREAKDOWN TABLE */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Producto</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#64748b' }}>Unidades</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#64748b' }}>Coste Unit.</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#64748b' }}>PVP Unit.</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#64748b' }}>Total Venta</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#64748b' }}>Margen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Recursive Render Helper? No, just flat map with fragment */}
                        {normalizedItems.map((item, idx) => {
                            // DYNAMIC CALCULATION FOR MAIN PRODUCT (Source of Truth is local inputData)
                            const mainConfig = item.inputData.snapshotConfig || {};
                            const mainResults = calculateOfferCosts(item.inputData, mainConfig);

                            const units = mainResults.derivedUnits;
                            const totalSales = mainResults.salePrice * units;
                            const totalCost = mainResults.directCost * units;
                            const margin = totalSales - totalCost;
                            const marginPct = totalSales > 0 ? (margin / totalSales) * 100 : 0;

                            const rawScenarios = item.inputData.scenarios || [];
                            const config = item.inputData.snapshotConfig || {}; // Use snapshot if available? Or need global config passed? 
                            // Ideally we need the config used for calculation. 
                            // Assuming snapshotConfig is stored in inputData. 

                            const scenarios: Scenario[] = rawScenarios.map((sc: any) => {
                                // Logic copied/adapted from calculateScenarioResults
                                const ml = parseFloat(item.inputData.unitSize) || 0;
                                const density = parseFloat(item.inputData.density) || 0;

                                let derivedKg = 0;
                                let derivedUnits = 0;
                                let qty = 0;
                                let mode: 'UNITS' | 'KG' = 'UNITS';

                                if (typeof sc === 'number') {
                                    qty = sc;
                                    derivedUnits = sc;
                                    derivedKg = (ml > 0 && density > 0) ? (sc * ml * density) / 1000 : 0;
                                } else {
                                    qty = sc.qty;
                                    mode = sc.mode;
                                    if (mode === 'UNITS') {
                                        derivedUnits = qty;
                                        derivedKg = (ml > 0 && density > 0) ? (qty * ml * density) / 1000 : 0;
                                    } else {
                                        derivedKg = qty;
                                        derivedUnits = (ml > 0 && density > 0) ? (qty * 1000) / (ml * density) : 0;
                                    }
                                }

                                const scenarioValues = {
                                    ...item.inputData,
                                    totalBatchKg: derivedKg,
                                    units: derivedUnits, // Override units? calculateOfferCosts recalculates derivedUnits from totalBatch.
                                    // Wait, calculateOfferCosts USES totalBatchKg + unitSize + density to derive units.
                                    // So just setting totalBatchKg is enough.
                                    extras: sc.extrasOverride ? sc.extrasOverride : item.inputData.extras
                                };

                                const res = calculateOfferCosts(scenarioValues, config);

                                // Margin Override logic
                                let salePrice = res.salePrice;
                                let finalMarginPct = item.inputData.marginPercent; // default to main

                                if (sc.margin !== undefined && sc.margin !== null && sc.margin !== '') {
                                    const scMargin = parseFloat(sc.margin);
                                    if (!isNaN(scMargin) && scMargin < 100) {
                                        salePrice = res.directCost / (1 - (scMargin / 100));
                                        finalMarginPct = scMargin;
                                    }
                                }

                                const profit = salePrice - res.directCost;

                                return {
                                    units: derivedUnits,
                                    totalCost: res.directCost * derivedUnits,
                                    totalPrice: salePrice * derivedUnits,
                                    unitCost: res.directCost,
                                    unitPrice: salePrice,
                                    margin: profit * derivedUnits,
                                    marginPercent: finalMarginPct,
                                    description: `${formatNumber(qty, 0)} ${mode === 'KG' ? 'kg' : 'uds'}`,
                                    qty, mode
                                };
                            });

                            return (
                                <React.Fragment key={item.id}>
                                    {/* MAIN PRODUCT ROW */}
                                    <tr style={{ borderBottom: scenarios.length > 0 ? 'none' : '1px solid #f1f5f9', background: 'white' }}>
                                        <td style={{ padding: '1rem', fontWeight: 600, color: '#1e293b' }}>
                                            {idx + 1}. {item.productName}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', color: '#475569', fontWeight: 600 }}>
                                            {formatNumber(units, 0)}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', color: '#64748b' }}>
                                            {formatNumber(item.resultsSummary.directCost, 3)} €
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#059669', background: '#f0fdf4' }}>
                                            {formatNumber(item.resultsSummary.salePrice, 3)} €
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>
                                            {formatCurrency(totalSales, 0)} €
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                <span style={{ fontWeight: 600, color: '#0284c7' }}>{formatCurrency(margin, 0)} €</span>
                                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatNumber(marginPct, 1)}%</span>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* SCENARIOS ROWS */}
                                    {scenarios.map((sc, sIdx) => (
                                        <tr key={`${item.id}-sc-${sIdx}`} style={{ borderBottom: sIdx === scenarios.length - 1 ? '1px solid #e2e8f0' : 'none', background: '#f8fafc' }}>
                                            <td style={{ padding: '0.5rem 1rem 0.5rem 2rem', fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1' }} />
                                                Escenario: {sc.description || `${formatNumber(sc.units, 0)} uds`}
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.85rem', color: '#64748b' }}>
                                                {formatNumber(sc.units, 0)}
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.85rem', color: '#94a3b8' }}>
                                                {formatNumber(sc.unitCost, 3)} €
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.85rem', color: '#059669', fontWeight: 500 }}>
                                                {formatNumber(sc.unitPrice, 3)} €
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.85rem', color: '#475569' }}>
                                                {formatCurrency(sc.totalPrice || (sc.unitPrice * sc.units), 0)} €
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.85rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                    <span style={{ color: '#0284c7' }}>{formatCurrency(sc.margin, 0)} €</span>
                                                    <span style={{ color: '#94a3b8' }}>({formatNumber(sc.marginPercent, 1)}%)</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                    <tfoot style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                        <tr>
                            <td style={{ padding: '1rem', fontWeight: 700 }}>TOTALES</td>
                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>{formatNumber(totals.units, 0)}</td>
                            <td colSpan={2}></td>
                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#059669', fontSize: '1.1rem' }}>
                                {formatCurrency(totals.sales, 0)} €
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <span style={{ fontWeight: 700, color: '#0284c7', fontSize: '1.1rem' }}>{formatCurrency(totalMargin, 0)} €</span>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{formatNumber(marginPercent, 1)}%</span>
                                </div>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
