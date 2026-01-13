import { useState } from 'react';
import { useFieldArray, Control, UseFormRegister, useWatch, UseFormSetValue } from 'react-hook-form';
import { Trash2, Plus, Sparkles, Upload, Database, X } from 'lucide-react';
import styles from './tabs.module.css';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import FormulaSelectModal from './FormulaSelectModal';

interface TabBulkProps {
    control: Control<any>;
    register: UseFormRegister<any>;
    watch: any;
    config: any;
    calculatedUnits: number;
    errors: any;
    setValue: UseFormSetValue<any>;
}

export default function TabBulk({ control, register, watch, setValue, config, calculatedUnits, errors }: TabBulkProps) {
    const [showFormulaModal, setShowFormulaModal] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: "formula"
    });

    const values = watch();
    const mode = values.bulkCostMode; // 'manual' | 'formula'

    // --- FORMULA / MATERIAL COST ---
    // If Manual: use manual cost. If Formula: calc from items.
    let materialCostKg = 0;
    if (mode === 'manual') {
        materialCostKg = parseFloat(values.manualBulkCost) || 0;
    } else {
        materialCostKg = (values.formula || []).reduce((sum: number, item: any) => {
            const pct = parseFloat(item.percentage) || 0;
            const cost = parseFloat(item.costPerKg) || 0;
            const isClient = item.clientSupplied;
            if (isClient) return sum;
            return sum + (cost * (pct / 100));
        }, 0) || 0;
    }

    const totalPercentage = (values.formula || []).reduce((sum: number, item: any) => sum + (parseFloat(item.percentage) || 0), 0) || 0;

    // --- RATE SCALING (TASA €/h) ---
    // Config: OFFER_RATES_SCALING defined as €/h based on Material Cost
    let hourlyRate = 120.00;
    let rateFound = false;
    if (config.OFFER_RATES_SCALING) {
        try {
            const rates = JSON.parse(config.OFFER_RATES_SCALING);
            const found = rates.find((r: any) => {
                const min = parseFloat(r.min);
                const max = parseFloat(r.max);
                return materialCostKg >= min && materialCostKg <= max;
            });
            if (found) {
                hourlyRate = parseFloat(found.value);
                rateFound = true;
            }
        } catch (e) { }
    }

    const batchSizeKg = parseFloat(values.totalBatchKg) || 0;
    // USE PASSED PROP
    const derivedUnits = calculatedUnits || 0;

    // --- WASTE SCALING (MERMA GRANEL) ---
    // Config: OFFER_WASTE_SCALING defined as % based on Batch KGs
    let bulkWastePercent = 3.0; // Default
    if (config.OFFER_WASTE_SCALING) {
        try {
            const rules = JSON.parse(config.OFFER_WASTE_SCALING);
            const found = rules.find((r: any) => {
                const min = parseFloat(r.min);
                const max = parseFloat(r.max);
                return batchSizeKg >= min && batchSizeKg <= max;
            });
            if (found) bulkWastePercent = parseFloat(found.value);
        } catch (e) { }
    }

    // CALCULATIONS
    const totalMaterialCost = (materialCostKg * batchSizeKg) * (1 + (bulkWastePercent / 100));

    // --- SURPLUS IMPUTATION ---
    const totalImputedSurplus = (values.formula || []).reduce((sum: number, item: any) => {
        if (!item.imputeSurplus) return sum;

        const pct = parseFloat(item.percentage) || 0;
        const cost = parseFloat(item.costPerKg) || 0;
        const minPurchase = parseFloat(item.minPurchase) || 0;

        const requiredKg = (batchSizeKg * pct) / 100;
        const surplusKg = Math.max(0, minPurchase - requiredKg);

        return sum + (surplusKg * cost);
    }, 0);

    const rawTime = parseFloat(values.manufacturingTime);
    const timeMinutes = isNaN(rawTime) ? 120 : rawTime; // Fallback only if NaN (empty), but input is required now.
    const mfgCost = (timeMinutes / 60) * hourlyRate;

    // Total Bulk Cost = Material (w/ waste) + Mfg Cost + Imputed Surplus
    const totalBulkCost = totalMaterialCost + mfgCost + totalImputedSurplus;

    const handleSelectFormula = (formula: any) => {
        // Map database formula ingredients to offer format
        try {
            const ingredients = JSON.parse(formula.ingredients);
            const mapped = ingredients.map((ing: any) => ({
                name: ing.name,
                percentage: parseFloat((ing.percentage || 0).toFixed(3)),
                costPerKg: parseFloat((ing.cost || 0).toFixed(3)), // Assuming cost is in ingredient object
                clientSupplied: false,
                minPurchase: 0,
                imputeSurplus: false
            }));

            // Override the current formula list
            replace(mapped);

            // Set source formula metadata for display
            if (setValue) {
                setValue('sourceFormula', {
                    name: formula.name,
                    code: formula.code,
                    version: formula.revision
                });
            }

            setShowFormulaModal(false);
        } catch (e) {
            console.error("Failed to parse formula items", e);
        }
    };

    return (
        <div className={styles.tabContent}>
            {/* 1. Manufacturing & Rates (Moved to Top) */}
            <div className={styles.sectionTitle} style={{ marginTop: 0 }}>Fabricación y Tasas (Configuración Principal)</div>
            <div className={styles.grid3} style={{ marginBottom: '2rem' }}>
                <div className={styles.infoBox} style={{ marginTop: 0, borderColor: 'var(--color-primary-light)', background: 'var(--color-bg)' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                        Tiempo Fabricación <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <input
                            type="number"
                            {...register('manufacturingTime', { required: true, valueAsNumber: true })}
                            style={{
                                width: '80px',
                                padding: '0.25rem',
                                borderRadius: '4px',
                                border: '1px solid',
                                borderColor: errors.manufacturingTime ? 'var(--color-error)' : 'var(--color-primary-light)',
                                fontWeight: 'bold'
                            }}
                        />
                        <span style={{ fontSize: '0.9rem' }}>minutos</span>
                    </div>
                </div>
                <div className={styles.infoBox} style={{ marginTop: 0, borderColor: 'var(--color-success)', background: 'var(--color-success-bg)' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-success)' }}>Tasa Horaria (Auto)</label>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success)' }}>{formatCurrency(hourlyRate, 2)} €/h</div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem' }}>
                        {rateFound ? `Según Coste MP: ${formatCurrency(materialCostKg)} €` : 'Tasa por defecto (no hallada)'}
                    </p>
                </div>
                <div className={styles.infoBox} style={{ marginTop: 0, borderColor: 'var(--color-warning)', background: 'var(--color-warning-bg)' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-warning)' }}>Merma Granel</label>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-warning)' }}>{formatNumber(bulkWastePercent, 1)}%</div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '0.25rem' }}>Lote: {formatNumber(batchSizeKg, 1)} Kg</p>
                </div>
            </div>

            <div className={styles.separator} />

            {/* 3. Material Cost Section Group */}
            <div className={styles.contentGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <h3 className={styles.sectionTitle} style={{ margin: 0, border: 'none', padding: 0 }}>Coste de Materias Primas</h3>
                        {values.sourceFormula && (
                            <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>{values.sourceFormula.code}</span>
                                <span>·</span>
                                <span>Rev {values.sourceFormula.version}</span>
                                <span>·</span>
                                <span>{values.sourceFormula.name}</span>
                                <button
                                    type="button"
                                    onClick={() => setShowRemoveConfirm(true)}
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', marginLeft: '0.5rem' }}
                                    title="Quitar fórmula"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mode Selector */}
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="radio" value="formula" {...register('bulkCostMode')} id="mode_formula" style={{ cursor: 'pointer' }} />
                            <label htmlFor="mode_formula" style={{ fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>Calculadora de Fórmula</label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="radio" value="manual" {...register('bulkCostMode')} id="mode_manual" style={{ cursor: 'pointer' }} />
                            <label htmlFor="mode_manual" style={{ fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>Coste Manual Directo</label>
                        </div>
                    </div>
                </div>

                {/* Content based on mode */}
                {mode === 'manual' ? (
                    <div className={styles.field} style={{ maxWidth: '300px' }}>
                        <label>Coste Teórico MP (€/kg)</label>
                        <input type="number" step="0.0001" {...register('manualBulkCost')} style={{ background: 'white' }} />
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '1rem' }}>
                            <button
                                type="button"
                                className={styles.tabButton}
                                style={{
                                    fontSize: '0.85rem',
                                    padding: '0.5rem 1rem',
                                    background: 'white',
                                    color: '#1d4ed8',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: '6px'
                                }}
                                onClick={() => setShowFormulaModal(true)}
                            >
                                <Database size={16} /> Seleccionar de BBDD
                            </button>
                            <button type="button" className={styles.tabButton} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                <Sparkles size={16} /> Importar con IA
                            </button>
                            <button type="button" className={styles.tabButton} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                <Upload size={16} /> Subir Excel
                            </button>
                        </div>

                        <div className={styles.tableContainer} style={{ overflowX: 'auto', background: 'white' }}>
                            <table className={styles.table} style={{ minWidth: '100%' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '25%', whiteSpace: 'nowrap' }}>Ingrediente (INCI)</th>
                                        <th style={{ width: '10%', whiteSpace: 'nowrap' }}>% Fórm.</th>
                                        <th style={{ width: '10%', whiteSpace: 'nowrap' }}>Coste MP</th>
                                        <th style={{ width: '8%', textAlign: 'center', whiteSpace: 'nowrap' }}>Cliente?</th>
                                        <th style={{ width: '10%', whiteSpace: 'nowrap' }}>Mín. Compra (Kg)</th>
                                        <th style={{ width: '12%', whiteSpace: 'nowrap' }}>Kg Necesarios</th>
                                        <th style={{ width: '15%', whiteSpace: 'nowrap' }}>Análisis Sobrante</th>
                                        <th style={{ width: '8%', whiteSpace: 'nowrap' }}>Coste Fórm. (€/kg)</th>
                                        <th style={{ width: '2%' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fields.map((field, index) => {
                                        const pct = parseFloat(values.formula?.[index]?.percentage) || 0;
                                        const cost = parseFloat(values.formula?.[index]?.costPerKg) || 0;
                                        const isClient = values.formula?.[index]?.clientSupplied;
                                        const minPurchase = parseFloat(values.formula?.[index]?.minPurchase) || 0;

                                        // Calculations
                                        const requiredKg = (batchSizeKg * pct) / 100;
                                        const surplusKg = Math.max(0, minPurchase - requiredKg);
                                        const surplusCost = surplusKg * cost;

                                        // Row Cost (Standard Formula Cost)
                                        const rowCost = isClient ? 0 : (cost * (pct / 100));

                                        return (
                                            <tr key={field.id} style={{ backgroundColor: surplusKg > 0 ? '#fff7ed' : 'transparent' }}>
                                                <td style={{ whiteSpace: 'nowrap' }}><input {...register(`formula.${index}.name`)} placeholder="Nombre" style={{ minWidth: '150px' }} /></td>
                                                <td style={{ whiteSpace: 'nowrap' }}><input type="number" step="0.001" {...register(`formula.${index}.percentage`)} placeholder="0.00" style={{ width: '80px' }} /></td>
                                                <td style={{ whiteSpace: 'nowrap' }}><input type="number" step="0.001" {...register(`formula.${index}.costPerKg`)} disabled={isClient} placeholder="€/kg" style={{ width: '80px' }} /></td>
                                                <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}><input type="checkbox" {...register(`formula.${index}.clientSupplied`)} /></td>
                                                <td style={{ whiteSpace: 'nowrap' }}><input type="number" step="0.01" {...register(`formula.${index}.minPurchase`)} placeholder="0" style={{ width: '80px' }} /></td>

                                                {/* Info Columns */}
                                                <td style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                                    {formatNumber(requiredKg, 0)} Kg
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    {surplusKg > 0 ? (
                                                        <div style={{ fontSize: '0.8rem' }}>
                                                            <div style={{ color: '#c2410c', fontWeight: 600 }}>Sobra: {formatNumber(surplusKg, 2)} Kg</div>
                                                            <div style={{ color: '#9a3412' }}>Coste: {formatCurrency(surplusCost)} €</div>
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', cursor: 'pointer' }}>
                                                                <input type="checkbox" {...register(`formula.${index}.imputeSurplus`)} />
                                                                <span style={{ fontSize: '0.75rem', textDecoration: 'underline' }}>Imputar coste</span>
                                                            </label>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#10b981', fontSize: '0.8rem' }}>Optimizado</span>
                                                    )}
                                                </td>

                                                <td style={{ fontFamily: 'monospace', color: '#475569', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                                    {formatCurrency(rowCost)} €
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <button type="button" onClick={() => remove(index)} className={styles.deleteBtn}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'right', paddingRight: '1rem', fontWeight: 600, color: '#64748b' }}>
                                            Total Coste Fórmula:
                                        </td>
                                        <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a', fontSize: '0.95rem' }}>
                                            {formatCurrency(materialCostKg)} €/kg
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                            <button type="button" onClick={() => append({ name: '', percentage: '', costPerKg: '', minPurchase: 0 })} className={styles.addButton}>
                                <Plus size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Añadir Ingrediente
                            </button>
                        </div>

                        <div className={styles.summaryRow} style={{ marginBottom: 0, borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
                            <div style={{ color: totalPercentage !== 100 ? 'var(--color-error)' : 'var(--color-success)' }}>
                                Total Fórmula: {formatNumber(totalPercentage, 3)}%
                            </div>
                        </div>
                    </>
                )}
            </div>

            {showFormulaModal && (
                <FormulaSelectModal
                    onClose={() => setShowFormulaModal(false)}
                    onSelect={handleSelectFormula}
                />
            )}

            {showRemoveConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        maxWidth: '28rem',
                        width: '90%',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>¿Quitar fórmula?</h3>
                        <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                            Esta acción eliminará la fórmula seleccionada y limpiará la tabla de ingredientes actual. ¿Estás seguro de que quieres continuar?
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button
                                type="button"
                                onClick={() => setShowRemoveConfirm(false)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    background: 'white',
                                    color: '#374151',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 500
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (setValue) setValue('sourceFormula', null);
                                    replace([]);
                                    setShowRemoveConfirm(false);
                                }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    background: '#ef4444',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 500
                                }}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
