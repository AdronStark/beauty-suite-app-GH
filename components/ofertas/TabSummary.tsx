import { useState, useEffect } from 'react';
import { Control, UseFormSetValue } from 'react-hook-form';
import styles from './tabs.module.css';
import { calculateOfferCosts } from '@/lib/offerCalculations';
import { Plus, Trash2, ArrowRight, Table as TableIcon, Settings, X, Save } from 'lucide-react';
import ExtrasTable from './ExtrasTable';

interface TabSummaryProps {
    control: Control<any>;
    register: any;
    watch: any;
    setValue: UseFormSetValue<any>;
    config: any;
    calculatedUnits: number;
    offerCosts: any;
}

interface Scenario {
    qty: number;
    mode: 'UNITS' | 'KG';
    margin: number;
    extrasOverride?: any[];
}

export default function TabSummary({ control, register, watch, setValue, config, calculatedUnits, offerCosts }: TabSummaryProps) {
    const values = watch();
    const units = calculatedUnits || 0;

    // Use passed calculated costs (Source of Truth) for the main offer
    const details = offerCosts.details || {};
    const directCost = offerCosts.directCost || 0;

    // Migrate old number[] scenarios to new object structure if needed
    const rawScenarios = values.scenarios || [];
    const customScenarios: Scenario[] = rawScenarios.map((s: any) => {
        if (typeof s === 'number') return { qty: s, mode: 'UNITS', margin: 30 };
        return s;
    });

    const [newScenarioQty, setNewScenarioQty] = useState<string>('');
    const [newScenarioMode, setNewScenarioMode] = useState<'UNITS' | 'KG'>('UNITS');

    // Modal State
    const [editingScenarioIndex, setEditingScenarioIndex] = useState<number | null>(null);
    const [tempExtras, setTempExtras] = useState<any[]>([]);

    const availableExtras = config.OFFER_EXTRAS ? JSON.parse(config.OFFER_EXTRAS) : [];

    const openExtrasModal = (index: number) => {
        const scenario = customScenarios[index];
        // If scenario has specific overrides, use them. Otherwise, default to the MAIN offer extras selection.
        const currentExtras = scenario.extrasOverride || values.extras || [];
        setTempExtras(currentExtras);
        setEditingScenarioIndex(index);
    };

    const saveExtrasModal = () => {
        if (editingScenarioIndex !== null) {
            const newScenarios = [...customScenarios];
            newScenarios[editingScenarioIndex] = { ...newScenarios[editingScenarioIndex], extrasOverride: tempExtras };
            setValue('scenarios', newScenarios);
            setEditingScenarioIndex(null);
        }
    };

    const addScenario = () => {
        console.log("Adding scenario, raw input:", newScenarioQty);
        const qty = parseFloat(newScenarioQty);
        console.log("Parsed qty:", qty);

        if (qty > 0) {
            // Check required fields for conversion if KG mode
            if (newScenarioMode === 'KG') {
                const ml = parseFloat(values.unitSize) || 0;
                const den = parseFloat(values.density) || 0;
                if (ml <= 0 || den <= 0) {
                    alert("Para usar KG, debes rellenar la Capacidad y Densidad en la cabecera.");
                    return;
                }
            }

            const newScenarios = [...customScenarios, { qty, mode: newScenarioMode, margin: 30 }];
            console.log("New Scenarios list:", newScenarios);

            // Sort by derived units to keep order logic consistent? Or just append?
            // Let's sort by Units for consistency
            newScenarios.sort((a, b) => {
                const ml = parseFloat(values.unitSize) || 0;
                const den = parseFloat(values.density) || 0;

                const getUnits = (s: Scenario) => {
                    if (s.mode === 'UNITS') return s.qty;
                    return (ml > 0 && den > 0) ? (s.qty * 1000) / (ml * den) : Infinity;
                };

                const unitsA = getUnits(a);
                const unitsB = getUnits(b);
                return unitsA - unitsB;
            });

            setValue('scenarios', newScenarios);
            setNewScenarioQty('');
        } else {
            console.warn("Invalid quantity entered");
            alert("Por favor, introduce una cantidad válida mayor que 0.");
        }
    };

    const removeScenario = (index: number) => {
        // We filter by index since qty duplicates might exist
        // But we were filtering by value before. Now we use index in the mapped list locally,
        // but remember customScenarios is separated from the total list.
        const newScenarios = customScenarios.filter((_, i) => i !== index);
        setValue('scenarios', newScenarios);
    };

    const updateScenarioMargin = (index: number, newMargin: number) => {
        const newScenarios = [...customScenarios];
        newScenarios[index] = { ...newScenarios[index], margin: newMargin };
        setValue('scenarios', newScenarios);
    };


    // Calculate Scenario Results
    const scenarios = customScenarios.map((sc, index) => {
        const ml = parseFloat(values.unitSize) || 0;
        const density = parseFloat(values.density) || 0;

        // Determine Batch Size (Kg) and Units based on Mode
        let derivedKg = 0;
        let derivedUnits = 0;

        if (sc.mode === 'UNITS') {
            derivedUnits = sc.qty;
            derivedKg = (ml > 0 && density > 0) ? (sc.qty * ml * density) / 1000 : 0;
        } else {
            // KG Mode
            derivedKg = sc.qty;
            derivedUnits = (ml > 0 && density > 0) ? (sc.qty * 1000) / (ml * density) : 0;
        }


        const scenarioValues = {
            ...values,
            totalBatchKg: derivedKg,
            units: derivedUnits,
            extras: sc.extrasOverride ? sc.extrasOverride : values.extras
        };

        const result = calculateOfferCosts(scenarioValues, config);
        return {
            index, // Original index in custom list
            qty: sc.qty,
            mode: sc.mode,
            margin: sc.margin,
            extrasOverride: sc.extrasOverride,
            units: derivedUnits,
            result,
            isMain: false
        };
    });

    // Main Offer "Scenario" Wrapper
    const marginMainInput = parseFloat(values.marginPercent);
    const mainMargin = !isNaN(marginMainInput) ? marginMainInput : 30;

    const mainScenario = {
        index: -1,
        qty: units, // Main is always units derived
        mode: 'UNITS',
        margin: mainMargin,
        units: units,
        result: offerCosts,
        isMain: true,
        extrasOverride: undefined
    };

    const allScenarios = [mainScenario, ...scenarios].sort((a, b) => a.units - b.units);


    // 1. Bulk Split (Main)
    const bulkMaterialTotal = (details.totalMaterialCost || 0) + (details.totalImputedSurplus || 0);
    const bulkMfgTotal = details.mfgCost || 0;
    const bulkMaterialUnit = units > 0 ? bulkMaterialTotal / units : 0;
    const bulkMfgUnit = units > 0 ? bulkMfgTotal / units : 0;

    // 2. Packaging Split (Main)
    const packMaterialTotal = details.packagingMaterialCost || 0;
    const packFillingTotal = details.packagingFillingCost || 0;
    const packMaterialUnit = units > 0 ? packMaterialTotal / units : 0;
    const packFillingUnit = units > 0 ? packFillingTotal / units : 0;

    const extrasCostUnit = offerCosts.extrasCostUnit || 0;
    const residueCostUnit = offerCosts.residueCostUnit || 0;

    let salePrice = 0;
    if (mainMargin < 100) {
        salePrice = directCost / (1 - (mainMargin / 100));
    }

    // Residue % for label
    let residuePercent = 0;
    if (config.OFFER_RESIDUE_SCALING) {
        try {
            const batchSizeKg = parseFloat(values.totalBatchKg) || 0;
            const rules = JSON.parse(config.OFFER_RESIDUE_SCALING);
            const found = rules.find((r: any) => batchSizeKg >= parseFloat(r.min) && batchSizeKg <= parseFloat(r.max));
            if (found) residuePercent = parseFloat(found.value);
        } catch (e) { }
    }

    const calculateRowMetrics = (costUnit: number) => {
        const costTotal = costUnit * units;
        const priceUnit = mainMargin < 100 ? costUnit / (1 - (mainMargin / 100)) : 0;
        const priceTotal = priceUnit * units;
        const marginTotal = priceTotal - costTotal;
        return { costTotal, priceUnit, priceTotal, marginTotal };
    };

    const rowBulkMat = calculateRowMetrics(bulkMaterialUnit);
    const rowBulkOps = calculateRowMetrics(bulkMfgUnit);
    const rowPackMat = calculateRowMetrics(packMaterialUnit);
    const rowPackOps = calculateRowMetrics(packFillingUnit);
    const rowExtra = calculateRowMetrics(extrasCostUnit);
    const rowResidue = calculateRowMetrics(residueCostUnit);

    // Totals
    const totalRow = {
        costUnit: directCost,
        costTotal: directCost * units,
        priceUnit: salePrice,
        priceTotal: salePrice * units,
        marginTotal: (salePrice * units) - (directCost * units)
    };

    // Helper for Spanish formatting
    const formatNumber = (num: number, decimals: number = 3) => {
        return num.toLocaleString('es-ES', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    };

    return (
        <div className={styles.tabContent}>
            {/* --- MAIN ANALYSIS TABLE --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div className={styles.sectionTitle} style={{ marginBottom: 0 }}>Análisis Económico (Oferta Principal)</div>

                {/* Margin Input */}
                <div className={styles.infoBox} style={{ borderColor: 'var(--color-primary-light)', background: 'var(--color-bg)', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', width: 'auto', marginTop: 0 }}>
                    <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600 }}>Margen Objetivo (%):</label>
                    <input
                        type="number"
                        {...register('marginPercent')}
                        style={{
                            textAlign: 'center',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            color: 'var(--color-primary)',
                            borderColor: 'var(--color-primary-light)',
                            padding: '0.25rem',
                            borderRadius: '4px',
                            width: '80px',
                            border: '1px solid #bfdbfe'
                        }}
                    />
                </div>
            </div>

            <div className={styles.tableContainer} style={{ overflowX: 'auto', marginBottom: '3rem' }}>
                <table className={styles.table} style={{ width: '100%', minWidth: '1000px' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', width: '25%', whiteSpace: 'nowrap' }}>Concepto</th>
                            <th style={{ textAlign: 'right', width: '10%', whiteSpace: 'nowrap' }}>Coste Unit.</th>
                            <th style={{ textAlign: 'right', width: '12%', whiteSpace: 'nowrap' }}>Coste Total</th>
                            <th style={{ textAlign: 'right', width: '8%', color: '#94a3b8', whiteSpace: 'nowrap' }}>%</th>
                            <th style={{ textAlign: 'right', width: '12%', background: '#f0fdf4', color: '#166534', whiteSpace: 'nowrap' }}>P. Venta Unit.</th>
                            <th style={{ textAlign: 'right', width: '12%', background: '#f0fdf4', color: '#166534', whiteSpace: 'nowrap' }}>P. Venta Total</th>
                            <th style={{ textAlign: 'right', width: '12%', color: '#94a3b8', whiteSpace: 'nowrap' }}>Margen (€)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ whiteSpace: 'nowrap' }}>1. Granel: Materiales</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{formatNumber(bulkMaterialUnit, 3)} €</td>
                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{formatNumber(rowBulkMat.costTotal, 2)} €</td>
                            <td style={{ textAlign: 'right', color: '#94a3b8', whiteSpace: 'nowrap' }}>{directCost > 0 ? formatNumber((bulkMaterialUnit / directCost) * 100, 1) : 0}%</td>

                            <td style={{ textAlign: 'right', background: '#f0fdf4', whiteSpace: 'nowrap' }}>{formatNumber(rowBulkMat.priceUnit, 3)} €</td>
                            <td style={{ textAlign: 'right', background: '#f0fdf4', whiteSpace: 'nowrap' }}>{formatNumber(rowBulkMat.priceTotal, 2)} €</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap' }}>{formatNumber(rowBulkMat.marginTotal, 2)} €</td>
                        </tr>
                        <tr>
                            <td style={{ whiteSpace: 'nowrap' }}>2. Granel: Operaciones</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{formatNumber(bulkMfgUnit, 3)} €</td>
                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{formatNumber(rowBulkOps.costTotal, 2)} €</td>
                            <td style={{ textAlign: 'right', color: '#94a3b8', whiteSpace: 'nowrap' }}>{directCost > 0 ? formatNumber((bulkMfgUnit / directCost) * 100, 1) : 0}%</td>

                            <td style={{ textAlign: 'right', background: '#f0fdf4', whiteSpace: 'nowrap' }}>{formatNumber(rowBulkOps.priceUnit, 3)} €</td>
                            <td style={{ textAlign: 'right', background: '#f0fdf4', whiteSpace: 'nowrap' }}>{formatNumber(rowBulkOps.priceTotal, 2)} €</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap' }}>{formatNumber(rowBulkOps.marginTotal, 2)} €</td>
                        </tr>

                        <tr>
                            <td style={{ whiteSpace: 'nowrap' }}>3. Envasado: Materiales</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{formatNumber(packMaterialUnit, 3)} €</td>
                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{formatNumber(rowPackMat.costTotal, 2)} €</td>
                            <td style={{ textAlign: 'right', color: '#94a3b8', whiteSpace: 'nowrap' }}>{directCost > 0 ? formatNumber((packMaterialUnit / directCost) * 100, 1) : 0}%</td>

                            <td style={{ textAlign: 'right', background: '#f0fdf4', whiteSpace: 'nowrap' }}>{formatNumber(rowPackMat.priceUnit, 3)} €</td>
                            <td style={{ textAlign: 'right', background: '#f0fdf4', whiteSpace: 'nowrap' }}>{formatNumber(rowPackMat.priceTotal, 2)} €</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap' }}>{formatNumber(rowPackMat.marginTotal, 2)} €</td>
                        </tr>
                        <tr>
                            <td style={{ whiteSpace: 'nowrap' }}>4. Envasado: Operaciones</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{formatNumber(packFillingUnit, 3)} €</td>
                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{formatNumber(rowPackOps.costTotal, 2)} €</td>
                            <td style={{ textAlign: 'right', color: '#94a3b8', whiteSpace: 'nowrap' }}>{directCost > 0 ? formatNumber((packFillingUnit / directCost) * 100, 1) : 0}%</td>

                            <td style={{ textAlign: 'right', background: '#f0fdf4', whiteSpace: 'nowrap' }}>{formatNumber(rowPackOps.priceUnit, 3)} €</td>
                            <td style={{ textAlign: 'right', background: '#f0fdf4', whiteSpace: 'nowrap' }}>{formatNumber(rowPackOps.priceTotal, 2)} €</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap' }}>{formatNumber(rowPackOps.marginTotal, 2)} €</td>
                        </tr>

                        <tr>
                            <td style={{ whiteSpace: 'nowrap' }}>5. Extras / Otros</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{formatNumber(extrasCostUnit, 3)} €</td>
                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{formatNumber(rowExtra.costTotal, 2)} €</td>
                            <td style={{ textAlign: 'right', color: '#94a3b8', whiteSpace: 'nowrap' }}>{directCost > 0 ? formatNumber((extrasCostUnit / directCost) * 100, 1) : 0}%</td>

                            <td style={{ textAlign: 'right', background: '#f0fdf4', whiteSpace: 'nowrap' }}>{formatNumber(rowExtra.priceUnit, 3)} €</td>
                            <td style={{ textAlign: 'right', background: '#f0fdf4', whiteSpace: 'nowrap' }}>{formatNumber(rowExtra.priceTotal, 2)} €</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap' }}>{formatNumber(rowExtra.marginTotal, 2)} €</td>
                        </tr>
                        <tr style={{ background: '#fffbeb' }}>
                            <td style={{ color: '#92400e', whiteSpace: 'nowrap' }}>6. Gestión de Residuos ({residuePercent}%)</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#92400e', whiteSpace: 'nowrap' }}>{formatNumber(residueCostUnit, 3)} €</td>
                            <td style={{ textAlign: 'right', color: '#92400e', whiteSpace: 'nowrap' }}>{formatNumber(rowResidue.costTotal, 2)} €</td>
                            <td style={{ textAlign: 'right', color: '#d97706', whiteSpace: 'nowrap' }}>{directCost > 0 ? formatNumber((residueCostUnit / directCost) * 100, 1) : 0}%</td>

                            <td style={{ textAlign: 'right', background: '#fff7ed', whiteSpace: 'nowrap' }}>{formatNumber(rowResidue.priceUnit, 3)} €</td>
                            <td style={{ textAlign: 'right', background: '#fff7ed', whiteSpace: 'nowrap' }}>{formatNumber(rowResidue.priceTotal, 2)} €</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#9a3412', whiteSpace: 'nowrap' }}>{formatNumber(rowResidue.marginTotal, 2)} €</td>
                        </tr>

                        {/* TOTAL ROW */}
                        <tr style={{ background: '#f8fafc', fontWeight: 'bold', borderTop: '2px solid #e2e8f0', fontSize: '1.1rem' }}>
                            <td style={{ paddingTop: '1rem', whiteSpace: 'nowrap' }}>TOTALES</td>
                            <td style={{ textAlign: 'right', paddingTop: '1rem', whiteSpace: 'nowrap' }}>{formatNumber(totalRow.costUnit, 3)} €</td>
                            <td style={{ textAlign: 'right', paddingTop: '1rem', whiteSpace: 'nowrap' }}>{formatNumber(totalRow.costTotal, 2)} €</td>
                            <td style={{ textAlign: 'right', paddingTop: '1rem', whiteSpace: 'nowrap' }}>100%</td>

                            <td style={{ textAlign: 'right', paddingTop: '1rem', background: '#dcfce7', color: '#166534', whiteSpace: 'nowrap' }}>{formatNumber(totalRow.priceUnit, 3)} €</td>
                            <td style={{ textAlign: 'right', paddingTop: '1rem', background: '#dcfce7', color: '#166534', whiteSpace: 'nowrap' }}>{formatNumber(totalRow.priceTotal, 0)} €</td>
                            <td style={{ textAlign: 'right', paddingTop: '1rem', color: '#0f172a', fontSize: '1.2rem', whiteSpace: 'nowrap' }}>{formatNumber(totalRow.marginTotal, 0)} €</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* --- SCENARIOS SECTION --- */}
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Escenarios de Cantidad</h3>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px' }}>Simulador</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {/* Mode Toggle */}
                        <div style={{ display: 'flex', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                            <button
                                type="button"
                                onClick={() => setNewScenarioMode('UNITS')}
                                style={{ padding: '0.4rem 0.8rem', border: 'none', background: newScenarioMode === 'UNITS' ? '#e0f2fe' : 'transparent', color: newScenarioMode === 'UNITS' ? '#0284c7' : '#64748b', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                                UDS
                            </button>
                            <button
                                type="button"
                                onClick={() => setNewScenarioMode('KG')}
                                style={{ padding: '0.4rem 0.8rem', border: 'none', background: newScenarioMode === 'KG' ? '#fce7f3' : 'transparent', color: newScenarioMode === 'KG' ? '#db2777' : '#64748b', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', borderLeft: '1px solid #cbd5e1' }}
                            >
                                KG
                            </button>
                        </div>

                        <input
                            type="number"
                            placeholder={newScenarioMode === 'UNITS' ? "Añadir Unidades..." : "Añadir Kilos..."}
                            value={newScenarioQty}
                            onChange={(e) => setNewScenarioQty(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addScenario())}
                            style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', width: '150px' }}
                        />
                        <button
                            type="button"
                            onClick={addScenario}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--color-primary)', color: 'white', border: 'none', padding: '0 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            <Plus size={16} /> Añadir
                        </button>
                    </div>
                </div>

                {allScenarios.length > 0 && (
                    <div className={styles.tableContainer} style={{ overflowX: 'auto' }}>
                        <table className={styles.table} style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Cantidad</th>
                                    <th style={{ textAlign: 'right' }}>Coste Granel/u</th>
                                    <th style={{ textAlign: 'right' }}>Coste Env./u</th>
                                    <th style={{ textAlign: 'right', background: '#eff6ff' }}>Coste Directo/u</th>
                                    <th style={{ textAlign: 'center', width: '100px' }}>Margen (%)</th>
                                    <th style={{ textAlign: 'right', background: '#f0fdf4', color: '#166534' }}>P. Venta Unit.</th>
                                    <th style={{ textAlign: 'right', color: '#166534' }}>Margen/u</th>
                                    <th style={{ width: '80px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {allScenarios.map((sc, index) => {
                                    const isMain = !!sc.isMain;
                                    const r = sc.result;

                                    // Use per-row margin
                                    const rowMargin = sc.margin;

                                    let scSalePrice = 0;
                                    if (rowMargin < 100) {
                                        scSalePrice = r.directCost / (1 - (rowMargin / 100));
                                    }
                                    const profit = scSalePrice - r.directCost;

                                    return (
                                        <tr key={index} style={{ background: isMain ? '#f0fdfa' : 'white', borderLeft: isMain ? '4px solid var(--color-primary)' : 'none' }}>
                                            <td style={{ fontWeight: 600 }}>
                                                {formatNumber(sc.qty, 0)} {sc.mode === 'KG' ? 'kg' : 'uds'}
                                                {sc.mode === 'KG' && <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal' }}>~{formatNumber(sc.units, 0)} uds</div>}
                                                {sc.mode === 'UNITS' && !isMain && <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal' }}>~{formatNumber((sc.qty * (parseFloat(values.unitSize) || 0) * (parseFloat(values.density) || 0)) / 1000, 2)} kg</div>}
                                                {isMain && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 'normal' }}>(Principal)</span>}
                                                {sc.extrasOverride && <div style={{ fontSize: '0.7rem', color: '#d97706', marginTop: '2px', fontWeight: 'normal' }}>* Extras Personalizados</div>}
                                            </td>
                                            <td style={{ textAlign: 'right', color: '#64748b' }}>{formatNumber(r.bulkCostUnit, 3)} €</td>
                                            <td style={{ textAlign: 'right', color: '#64748b' }}>{formatNumber(r.packingCostUnit + r.processCostUnit, 3)} €</td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold', background: isMain ? '#ccfbf1' : '#eff6ff' }}>{formatNumber(r.directCost, 3)} €</td>

                                            {/* Editable Margin */}
                                            <td style={{ textAlign: 'center' }}>
                                                {isMain ? (
                                                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{rowMargin}%</span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        value={sc.margin}
                                                        onChange={(e) => updateScenarioMargin(sc.index, parseFloat(e.target.value) || 0)}
                                                        style={{ width: '60px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px' }}
                                                    />
                                                )}
                                            </td>

                                            <td style={{ textAlign: 'right', fontWeight: 'bold', background: isMain ? '#ccfbf1' : '#f0fdf4', color: '#166534', fontSize: '1.05rem' }}>{formatNumber(scSalePrice, 3)} €</td>
                                            <td style={{ textAlign: 'right', color: '#166534' }}>
                                                {formatNumber(profit, 2)} €
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    {!isMain && (
                                                        <>
                                                            <button onClick={() => openExtrasModal(sc.index)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }} title="Configurar Extras">
                                                                <Settings size={16} />
                                                            </button>
                                                            <button onClick={() => removeScenario(sc.index)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.6 }} title="Eliminar escenario">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {isMain && <ArrowRight size={16} style={{ opacity: 0.2 }} />}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- EXTRAS OVERRIDE MODAL --- */}
            {editingScenarioIndex !== null && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>
                                Configurar Extras: {customScenarios[editingScenarioIndex].qty} {customScenarios[editingScenarioIndex].mode}
                            </h3>
                            <button onClick={() => setEditingScenarioIndex(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Personaliza los extras para este escenario específico. Si dejas esto vacío, se usarán los extras de la oferta principal.
                        </p>

                        <ExtrasTable
                            availableExtras={availableExtras}
                            value={tempExtras}
                            onChange={setTempExtras}
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <button
                                onClick={() => setEditingScenarioIndex(null)}
                                style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveExtrasModal}
                                style={{ padding: '0.5rem 1.5rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Save size={16} /> Guardar Configuración
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
