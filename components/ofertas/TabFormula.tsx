import { useFieldArray, Control, UseFormRegister, useWatch, UseFormSetValue } from 'react-hook-form';
import { Trash2, Plus } from 'lucide-react';
import styles from './tabs.module.css';
import { useEffect } from 'react';

interface TabFormulaProps {
    control: Control<any>;
    register: UseFormRegister<any>;
    setValue: UseFormSetValue<any>;
}

export default function TabFormula({ control, register, setValue }: TabFormulaProps) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "formula"
    });

    // Watch formula to calculate totals
    const formulaItems = useWatch({
        control,
        name: "formula"
    });

    const totalPercentage = formulaItems?.reduce((sum: number, item: any) => sum + (parseFloat(item.percentage) || 0), 0) || 0;
    const totalCostKg = formulaItems?.reduce((sum: number, item: any) => {
        const pct = parseFloat(item.percentage) || 0;
        const cost = parseFloat(item.costPerKg) || 0;
        return sum + (cost * (pct / 100)); // Weighted Average? No, cost * fraction
    }, 0) || 0;

    // Optional: Synchronize calculated bulk cost to parent state if needed, 
    // or just let the parent Derive it at the top level.
    // For now, we display it here.

    return (
        <div className={styles.tabContent}>
            <div className={styles.sectionTitle}>Fórmula Cualitativa</div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '40%' }}>Ingrediente INCI</th>
                            <th style={{ width: '15%' }}>% Peso</th>
                            <th style={{ width: '15%' }}>Coste €/Kg</th>
                            <th style={{ width: '15%' }}>Coste Final €/Kg</th>
                            <th style={{ width: '5%' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {fields.map((field, index) => {
                            // Calculate row cost for display
                            const pct = parseFloat(formulaItems[index]?.percentage) || 0;
                            const cost = parseFloat(formulaItems[index]?.costPerKg) || 0;
                            const rowCost = (cost * (pct / 100)).toFixed(4);

                            return (
                                <tr key={field.id}>
                                    <td>
                                        <input {...register(`formula.${index}.name`)} placeholder="Nombre ingrediente" />
                                    </td>
                                    <td>
                                        <input type="number" step="0.001" {...register(`formula.${index}.percentage`)} placeholder="0.00" />
                                    </td>
                                    <td>
                                        <input type="number" step="0.001" {...register(`formula.${index}.costPerKg`)} placeholder="0.00" />
                                    </td>
                                    <td>
                                        <span style={{ padding: '0.5rem', display: 'block', color: '#64748b' }}>{rowCost}</span>
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
            </div>

            <button type="button" onClick={() => append({ name: '', percentage: '', costPerKg: '' })} className={styles.addButton}>
                <Plus size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Añadir Ingrediente
            </button>

            <div className={styles.summaryRow}>
                <div style={{ color: totalPercentage !== 100 ? '#ef4444' : '#10b981' }}>
                    Total %: {totalPercentage.toFixed(2)}%
                </div>
                <div>
                    Coste Granel / Kg: {totalCostKg.toFixed(4)} €
                </div>
            </div>
        </div>
    );
}
