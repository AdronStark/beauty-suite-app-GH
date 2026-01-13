import { useFieldArray, Control, UseFormRegister, useWatch, UseFormSetValue } from 'react-hook-form';
import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import styles from './tabs.module.css';
import { PackagingRepository } from '@/lib/packagingRepository';
import { formatCurrency } from '@/lib/formatters';

interface TabPackagingProps {
    control: Control<any>;
    register: UseFormRegister<any>;
    watch: any;
    setValue: UseFormSetValue<any>;
    config: any;
}

export default function TabPackaging({ control, register, watch, setValue, config }: TabPackagingProps) {
    const [manualModes, setManualModes] = useState<Record<string, boolean>>({});

    const { fields, append, remove } = useFieldArray({
        control,
        name: "packaging"
    });

    const packagingItems = watch("packaging") || [];
    const units = parseFloat(watch("units")) || 0;

    // --- WASTE SCALING (MERMA) ---
    let automaticWaste = 0;
    if (config.OFFER_WASTE_SCALING) {
        try {
            const rules = JSON.parse(config.OFFER_WASTE_SCALING);
            const found = rules.find((r: any) => units >= r.min && units <= r.max);
            if (found) automaticWaste = found.value;
        } catch (e) { }
    }

    // --- COST CALCULATIONS ---
    const totalPackagingMaterialCost = packagingItems.reduce((sum: number, item: any) => {
        const cost = parseFloat(item.costPerUnit) || 0;
        let waste = parseFloat(item.wastePercent);
        if (isNaN(waste)) waste = automaticWaste;

        const isClient = item.clientSupplied;
        const rowCost = isClient ? 0 : (cost * (1 + (waste / 100)));
        return sum + rowCost;
    }, 0);

    // Calculate Filling Cost
    const repo = new PackagingRepository(config.OFFER_PACKAGING_RULES);
    const containerType = watch('containerType');
    const subtype = watch('subtype');
    const capacity = parseFloat(watch('capacity')) || 0;
    const selectedOps = watch('selectedOperations') || [];

    const totalFillingCost = selectedOps.reduce((sum: number, op: string) => {
        if (!containerType) return sum;
        return sum + repo.getOperationCost(containerType, subtype, capacity, units, op);
    }, 0);

    return (
        <div className={styles.tabContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div className={styles.sectionTitle} style={{ margin: 0, border: 'none' }}>Material de Acondicionamiento</div>
                <div style={{ background: '#fffbeb', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #fcd34d', color: '#92400e', fontSize: '0.85rem', fontWeight: 500 }}>
                    Merma Automática por Lote ({units} uds): <strong>{automaticWaste}%</strong>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '40%' }}>Componente</th>
                            <th style={{ width: '20%' }}>Coste Unit. (€)</th>
                            <th style={{ width: '10%' }}>Merma (%)</th>
                            <th style={{ width: '10%' }} title="Suministrado por cliente">Cliente?</th>
                            <th style={{ width: '15%' }}>Coste Real (€)</th>
                            <th style={{ width: '5%' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {fields.map((field, index) => {
                            const cost = parseFloat(packagingItems[index]?.costPerUnit) || 0;
                            let waste = parseFloat(packagingItems[index]?.wastePercent);
                            if (isNaN(waste)) waste = automaticWaste;

                            const isClient = packagingItems[index]?.clientSupplied;
                            const rowCost = isClient ? 0 : (cost * (1 + (waste / 100)));

                            // Preset Logic
                            const currentName = packagingItems[index]?.name || '';
                            const standardOptions = ['Envase', 'Tapón', 'Bomba', 'Estuche', 'Etiqueta', 'Obturador', 'Caja'];
                            const isManual = manualModes[field.id];

                            // Determine selection state:
                            // 1. If name is standard -> it's that option
                            // 2. If manual mode is ON (even if empty) -> 'Otro'
                            // 3. If name is meaningful but NOT standard -> 'Otro'
                            // 4. Default -> ''
                            let selectValue = '';
                            if (standardOptions.includes(currentName)) {
                                selectValue = currentName;
                            } else if (isManual || (currentName && !standardOptions.includes(currentName))) {
                                selectValue = 'Otro';
                            }

                            return (
                                <tr key={field.id}>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <select
                                                className={styles.select}
                                                style={{ flex: selectValue === 'Otro' ? '0 0 130px' : '1' }}
                                                value={selectValue}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'Otro') {
                                                        // Activate Manual Mode
                                                        setManualModes(prev => ({ ...prev, [field.id]: true }));
                                                        setValue(`packaging.${index}.name`, '', { shouldValidate: true, shouldDirty: true });
                                                    } else {
                                                        // Deactivate Manual Mode
                                                        setManualModes(prev => ({ ...prev, [field.id]: false }));
                                                        setValue(`packaging.${index}.name`, val, { shouldValidate: true, shouldDirty: true });
                                                    }
                                                }}
                                            >
                                                <option value="">Seleccionar...</option>
                                                {standardOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                <option value="Otro">Otro (Manual)</option>
                                            </select>

                                            <input
                                                {...register(`packaging.${index}.name`)}
                                                placeholder="Nombre..."
                                                style={{ flex: 1, display: selectValue === 'Otro' ? 'block' : 'none' }}
                                            />
                                        </div>
                                    </td>
                                    <td>
                                        <input type="number" step="0.0001" {...register(`packaging.${index}.costPerUnit`)} placeholder="0.00" />
                                    </td>
                                    <td>
                                        <input type="number" step="0.01" {...register(`packaging.${index}.wastePercent`)} placeholder={automaticWaste.toString()} />
                                    </td>
                                    <td style={{ textAlign: 'center' }}><input type="checkbox" {...register(`packaging.${index}.clientSupplied`)} /></td>
                                    <td>
                                        <span style={{ color: '#475569', display: 'block', paddingLeft: '0.5rem' }}>{formatCurrency(rowCost)}</span>
                                    </td>
                                    <td>
                                        <button type="button" onClick={() => remove(index)} className={styles.deleteBtn}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                <button type="button" onClick={() => append({ name: '', costPerUnit: '', wastePercent: automaticWaste })} className={styles.addButton}>
                    <Plus size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Añadir Componente
                </button>
            </div>

            <div style={{ marginTop: '3rem', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
                <div className={styles.sectionTitle}>Definición de Proceso de Envasado</div>

                <div className={styles.grid3}>
                    <div className={styles.field}>
                        <label>Tipo de Envase</label>
                        <select {...register('containerType')} className={styles.select}>
                            <option value="">Seleccionar...</option>
                            {(() => {
                                const repo = new PackagingRepository(config.OFFER_PACKAGING_RULES);
                                return repo.getContainerTypes().map(t => <option key={t} value={t}>{t}</option>);
                            })()}
                        </select>
                    </div>
                    <div className={styles.field}>
                        <label>Subtipo</label>
                        <select {...register('subtype')} className={styles.select}>
                            <option value="">Seleccionar...</option>
                            {(() => {
                                const repo = new PackagingRepository(config.OFFER_PACKAGING_RULES);
                                const currentType = watch('containerType');
                                if (!currentType) return null;
                                return repo.getSubtypes(currentType).map(t => <option key={t} value={t}>{t}</option>);
                            })()}
                        </select>
                    </div>
                    <div className={styles.field}>
                        <label>Capacidad (ml)</label>
                        <input type="number" {...register('capacity')} placeholder="ml" />
                    </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ fontWeight: 500, color: '#334155', marginRight: '0.5rem' }}>Operaciones a Realizar</label>
                        {(() => {
                            const repo = new PackagingRepository(config.OFFER_PACKAGING_RULES);
                            const cType = watch('containerType');
                            const cSub = watch('subtype');
                            const cap = parseFloat(watch('capacity')) || 0;
                            const selectedOps = watch('selectedOperations') || [];

                            let totalPeople = 0;
                            if (cType && repo.getOperationPeople) {
                                totalPeople = selectedOps.reduce((sum: number, op: string) => {
                                    return sum + repo.getOperationPeople(cType, cSub, cap, units, op);
                                }, 0);
                            }

                            if (totalPeople > 0) {
                                return (
                                    <span style={{
                                        background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem',
                                        padding: '0.1rem 0.5rem', borderRadius: '12px', fontWeight: 600, border: '1px solid #bae6fd'
                                    }}>
                                        Total: {totalPeople} Personas
                                    </span>
                                )
                            }
                            return null;
                        })()}
                    </div>
                    <div className={styles.checkboxGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        {(() => {
                            const repo = new PackagingRepository(config.OFFER_PACKAGING_RULES);
                            const cType = watch('containerType');
                            const cSub = watch('subtype');
                            const cap = parseFloat(watch('capacity')) || 0;

                            if (!cType) return <div style={{ gridColumn: '1/-1', color: '#94a3b8' }}>Selecciona un tipo de envase primero.</div>;

                            const ops = repo.getAvailableOperations(cType, cSub, cap);

                            if (ops.length === 0) return <div style={{ gridColumn: '1/-1', color: '#94a3b8' }}>No hay operaciones disponibles para esta combinación.</div>;

                            const selectedOps = watch('selectedOperations') || [];

                            return ops.map(op => {
                                const isSelected = selectedOps.includes(op);
                                const cost = repo.getOperationCost(cType, cSub, cap, units, op);
                                const people = repo.getOperationPeople ? repo.getOperationPeople(cType, cSub, cap, units, op) : 0;

                                return (
                                    <label key={op} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.25rem', background: isSelected ? '#fff' : 'transparent', borderRadius: '4px' }}>
                                        <input
                                            type="checkbox"
                                            value={op}
                                            {...register('selectedOperations')}
                                            style={{ accentColor: '#4f46e5' }}
                                        />
                                        <span style={{ flex: 1, fontSize: '0.9rem' }}>
                                            {op}
                                            {people > 0 && <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '4px' }}>({people}p)</span>}
                                        </span>
                                        {isSelected && <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#059669' }}>{formatCurrency(cost)}€/u</span>}
                                    </label>
                                );
                            });
                        })()}
                    </div>
                </div>
            </div>


        </div >
    );
}
