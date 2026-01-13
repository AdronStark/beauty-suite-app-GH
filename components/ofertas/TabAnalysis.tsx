import { Control, useWatch } from 'react-hook-form';
import styles from './tabs.module.css';

interface TabAnalysisProps {
    control: Control<any>;
}

export default function TabAnalysis({ control }: TabAnalysisProps) {
    const values = useWatch({ control });

    // --- RECALCULATE EVERYTHING ---
    // Ideally this logic should be centralized, but repeating safe-read logic here is fine for display

    // 1. Formula
    const formulaItems = values.formula || [];
    const totalCostKg = formulaItems.reduce((sum: number, item: any) => {
        const pct = parseFloat(item.percentage) || 0;
        const cost = parseFloat(item.costPerKg) || 0;
        return sum + (cost * (pct / 100));
    }, 0);
    const density = parseFloat(values.density) || 1;
    const unitSize = parseFloat(values.unitSize) || 0;
    // Bulk Cost per Unit = Cost/Kg * (Size/1000) * Density
    const bulkCostUnit = totalCostKg * (unitSize / 1000) * density;

    // 2. Packaging
    const packagingItems = values.packaging || [];
    const packagingCostUnit = packagingItems.reduce((sum: number, item: any) => {
        const cost = parseFloat(item.costPerUnit) || 0;
        const waste = parseFloat(item.wastePercent) || 0;
        return sum + (cost * (1 + (waste / 100)));
    }, 0);

    // 3. Process
    const units = parseFloat(values.units) || 1;
    // Mfg
    const RATE_MANUFACTURING = 45.00;
    const batchTime = parseFloat(values.process?.manufacturingTime) || 0;
    const mfgCostUnit = units > 0 ? (batchTime * RATE_MANUFACTURING) / units : 0;
    // Filling
    const RATE_FILLING = 35.00;
    const RATE_LABOUR = 22.00;
    const fillingSpeed = parseFloat(values.process?.fillingSpeed) || 0;
    const fillingPeople = parseFloat(values.process?.fillingPeople) || 1;
    const fillingTime = fillingSpeed > 0 ? units / fillingSpeed : 0;
    const fillingCostUnit = units > 0 ? (fillingTime * (RATE_FILLING + (fillingPeople * RATE_LABOUR))) / units : 0;

    const processCostUnit = mfgCostUnit + fillingCostUnit;

    // TOTALS
    const directCost = bulkCostUnit + packagingCostUnit + processCostUnit;

    const marginInput = parseFloat(values.marginPercent);
    const margin = !isNaN(marginInput) ? marginInput : 30;
    const discountPercent = parseFloat(values.discountPercent) || 0;

    // Price = Cost / (1 - Margin)
    // If discount exists, Price = Target / (1 - Discount) ?? Often Discount is on PVP
    // Let's assume Price = Cost / (1 - Margin%)

    let salePrice = 0;
    if (margin < 100) {
        salePrice = directCost / (1 - (margin / 100));
    }

    // Profit
    const profit = salePrice - directCost;

    return (
        <div className={styles.tabContent}>
            <div className={styles.sectionTitle}>Escandallo de Costes (Por Unidad)</div>

            <div className={styles.tableContainer} style={{ marginBottom: '2rem' }}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Concepto</th>
                            <th style={{ textAlign: 'right' }}>Coste (€)</th>
                            <th style={{ textAlign: 'right' }}>% sobre Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Granel ({unitSize}ml)</td>
                            <td style={{ textAlign: 'right' }}>{bulkCostUnit.toFixed(4)} €</td>
                            <td style={{ textAlign: 'right' }}>{directCost > 0 ? ((bulkCostUnit / directCost) * 100).toFixed(1) : 0}%</td>
                        </tr>
                        <tr>
                            <td>Packaging</td>
                            <td style={{ textAlign: 'right' }}>{packagingCostUnit.toFixed(4)} €</td>
                            <td style={{ textAlign: 'right' }}>{directCost > 0 ? ((packagingCostUnit / directCost) * 100).toFixed(1) : 0}%</td>
                        </tr>
                        <tr>
                            <td>Proceso (Fabricación + Envasado)</td>
                            <td style={{ textAlign: 'right' }}>{processCostUnit.toFixed(4)} €</td>
                            <td style={{ textAlign: 'right' }}>{directCost > 0 ? ((processCostUnit / directCost) * 100).toFixed(1) : 0}%</td>
                        </tr>
                        <tr style={{ background: '#f1f5f9', fontWeight: 600 }}>
                            <td>COSTE DIRECTO TOTAL</td>
                            <td style={{ textAlign: 'right' }}>{directCost.toFixed(4)} €</td>
                            <td style={{ textAlign: 'right' }}>100%</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className={styles.grid3}>
                <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>Precio Objetivo de Venta</div>
                    <div className={styles.metricValue} style={{ color: '#6366f1' }}>
                        {salePrice.toFixed(4)} €
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                        Margen: {margin}%
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>Beneficio por Unidad</div>
                    <div className={styles.metricValue} style={{ color: '#10b981' }}>
                        {profit.toFixed(4)} €
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>Beneficio Total Lote</div>
                    <div className={styles.metricValue}>
                        {(profit * units).toLocaleString(undefined, { maximumFractionDigits: 0 })} €
                    </div>
                </div>
            </div>
        </div>
    );
}
