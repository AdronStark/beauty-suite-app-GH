import { useState } from 'react';
import { formatOptionalDecimals } from '@/lib/formatters';
import styles from './tabs.module.css';
import { Plus, Trash2 } from 'lucide-react';

interface ExtraItem {
    extraId: string;
    name: string;
    cost: number;
    type: 'FIXED' | 'VARIABLE';
    quantity: number;
    isCustom?: boolean;
}

interface ExtrasTableProps {
    availableExtras: any[];
    value: ExtraItem[];
    onChange: (newValue: ExtraItem[]) => void;
    readOnly?: boolean;
}

export default function ExtrasTable({ availableExtras, value, onChange, readOnly = false }: ExtrasTableProps) {
    const currentExtras = value || [];

    const handleToggle = (extra: any, isChecked: boolean) => {
        if (readOnly) return;
        if (isChecked) {
            const newItem: ExtraItem = {
                extraId: extra.id,
                name: extra.name,
                cost: parseFloat(extra.cost),
                type: extra.type,
                quantity: 1
            };
            onChange([...currentExtras, newItem]);
        } else {
            onChange(currentExtras.filter(e => e.extraId !== extra.id));
        }
    };

    const handleQuantityChange = (extraId: string, newQty: number) => {
        if (readOnly) return;
        const updated = currentExtras.map(e =>
            e.extraId === extraId ? { ...e, quantity: newQty } : e
        );
        onChange(updated);
    };

    // --- Custom Extras Logic ---
    const [newCustomName, setNewCustomName] = useState('');
    const [newCustomCost, setNewCustomCost] = useState('');
    const [newCustomType, setNewCustomType] = useState<'FIXED' | 'VARIABLE'>('FIXED');

    const addCustomExtra = () => {
        const cost = parseFloat(newCustomCost);
        if (!newCustomName.trim() || isNaN(cost)) return;

        const newExtra: ExtraItem = {
            extraId: `custom-${Date.now()}`,
            name: newCustomName,
            cost: cost,
            type: newCustomType,
            quantity: 1,
            isCustom: true
        };

        onChange([...currentExtras, newExtra]);
        setNewCustomName('');
        setNewCustomCost('');
        setNewCustomType('FIXED');
    };

    const removeCustomExtra = (extraId: string) => {
        onChange(currentExtras.filter(e => e.extraId !== extraId));
    };

    const customExtrasList = currentExtras.filter(e => e.isCustom || !availableExtras.find(av => av.id === e.extraId));

    const grandTotal = currentExtras.reduce((sum, item) => {
        const qty = item.quantity || 1;
        const cost = item.cost || 0;
        return sum + (cost * qty);
    }, 0);

    return (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th style={{ width: '40%' }}>Concepto</th>
                        <th style={{ width: '15%' }}>Tipo Coste</th>
                        <th style={{ width: '15%' }}>Coste Ref.</th>
                        <th style={{ width: '15%' }}>Cantidad</th>
                        <th style={{ width: '15%' }}>Total (€)</th>
                        {/* Extra column for delete button on custom rows */}
                        <th style={{ width: '50px' }}></th>
                    </tr>
                </thead>
                <tbody>
                    {availableExtras.map((extra: any, index: number) => {
                        const foundIndex = currentExtras.findIndex(e => e.extraId === extra.id);
                        const isSelected = foundIndex !== -1;
                        const currentItem = isSelected ? currentExtras[foundIndex] : null;
                        const qty = isSelected ? (currentItem?.quantity || 1) : 0;
                        const rowTotal = isSelected ? (parseFloat(extra.cost) * qty) : 0;

                        return (
                            <tr key={extra.id || `available-${index}`} style={{ background: isSelected ? '#f0f9ff' : 'transparent' }}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => handleToggle(extra, e.target.checked)}
                                            style={{ width: 'auto', cursor: 'pointer' }}
                                            disabled={readOnly}
                                        />
                                        <span style={{ fontWeight: isSelected ? 600 : 400 }}>{extra.name}</span>
                                    </div>
                                </td>
                                <td>
                                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#64748b' }}>
                                        {extra.type === 'FIXED' ? 'Por Lote' : 'Por Ud'}
                                    </span>
                                </td>
                                <td>{formatOptionalDecimals(parseFloat(extra.cost), 2)} €</td>
                                <td>
                                    {isSelected && (
                                        <input
                                            type="number"
                                            value={qty}
                                            onChange={(e) => handleQuantityChange(extra.id, parseFloat(e.target.value) || 0)}
                                            style={{ width: '80px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                            min={1}
                                            step="1"
                                            disabled={readOnly}
                                        />
                                    )}
                                </td>
                                <td style={{ fontWeight: isSelected ? 600 : 400 }}>
                                    {isSelected ? `${formatOptionalDecimals(rowTotal, 2)} €` : '-'}
                                </td>
                                <td></td>
                            </tr>
                        );
                    })}

                    {/* CUSTOM EXTRAS HEADER/SEPARATOR */}
                    {customExtrasList.length > 0 && (
                        <tr key="extras-separator" style={{ background: '#f8fafc' }}>
                            <td colSpan={6} style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', padding: '0.5rem' }}>
                                EXTRAS ADICIONALES
                            </td>
                        </tr>
                    )}

                    {/* CUSTOM EXTRAS ROWS */}
                    {customExtrasList.map((extra, index) => {
                        const qty = extra.quantity || 1;
                        const rowTotal = extra.cost * qty;

                        return (
                            <tr key={extra.extraId || `custom-${index}`} style={{ background: '#fffbeb' }}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ fontWeight: 600, color: '#d97706' }}>{extra.name}</span>
                                    </div>
                                </td>
                                <td>
                                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', background: '#fef3c7', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#b45309' }}>
                                        {extra.type === 'FIXED' ? 'Por Lote' : 'Por Ud'}
                                    </span>
                                </td>
                                <td>{formatOptionalDecimals(extra.cost, 2)} €</td>
                                <td>
                                    <input
                                        type="number"
                                        value={qty}
                                        onChange={(e) => handleQuantityChange(extra.extraId, parseFloat(e.target.value) || 0)}
                                        style={{ width: '80px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #fed7aa' }}
                                        min={1}
                                        step="1"
                                        disabled={readOnly}
                                    />
                                </td>
                                <td style={{ fontWeight: 600 }}>
                                    {formatOptionalDecimals(rowTotal, 2)} €
                                </td>
                                <td>
                                    {!readOnly && (
                                        <button
                                            onClick={() => removeCustomExtra(extra.extraId)}
                                            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7 }}
                                            title="Eliminar extra"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}

                    {/* ADD NEW CUSTOM EXTRA ROW */}
                    {!readOnly && (
                        <tr key="add-custom-extra" style={{ borderTop: '1px dashed #e2e8f0' }}>
                            <td style={{ paddingTop: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="Nombre nuevo extra..."
                                    value={newCustomName}
                                    onChange={(e) => setNewCustomName(e.target.value)}
                                    style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                />
                            </td>
                            <td style={{ paddingTop: '1rem' }}>
                                <select
                                    value={newCustomType}
                                    onChange={(e) => setNewCustomType(e.target.value as any)}
                                    style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                >
                                    <option value="FIXED">Por Lote</option>
                                    <option value="VARIABLE">Por Ud</option>
                                </select>
                            </td>
                            <td style={{ paddingTop: '1rem' }}>
                                <input
                                    type="number"
                                    placeholder="Coste..."
                                    value={newCustomCost}
                                    onChange={(e) => setNewCustomCost(e.target.value)}
                                    style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                />
                            </td>
                            <td colSpan={2} style={{ paddingTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={addCustomExtra}
                                    disabled={!newCustomName || !newCustomCost}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        background: (!newCustomName || !newCustomCost) ? '#e2e8f0' : 'var(--color-primary)',
                                        color: (!newCustomName || !newCustomCost) ? '#94a3b8' : 'white',
                                        border: 'none', padding: '0.4rem 1rem', borderRadius: '4px',
                                        cursor: (!newCustomName || !newCustomCost) ? 'not-allowed' : 'pointer',
                                        fontWeight: 600, width: '100%', justifyContent: 'center'
                                    }}
                                >
                                    <Plus size={16} /> Añadir
                                </button>
                            </td>
                            <td></td>
                        </tr>
                    )}

                    {currentExtras.length > 0 && (
                        <tr key="extras-total" style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc', fontWeight: 'bold' }}>
                            <td colSpan={4} style={{ textAlign: 'right', paddingRight: '1rem', color: '#64748b', paddingTop: '1rem', paddingBottom: '1rem' }}>
                                TOTAL EXTRAS
                            </td>
                            <td style={{ color: 'var(--color-primary)', fontSize: '1.1rem', paddingTop: '1rem', paddingBottom: '1rem' }}>
                                {formatOptionalDecimals(grandTotal, 2)} €
                            </td>
                            <td></td>
                        </tr>
                    )}
                </tbody>
            </table>
            {availableExtras.length === 0 && <p style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>No hay conceptos extra configurados.</p>}
        </div>
    );
}
