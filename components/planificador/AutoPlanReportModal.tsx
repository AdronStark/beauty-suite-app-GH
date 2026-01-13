import { useState } from 'react';
import { X, CheckCircle, Save, AlertTriangle } from 'lucide-react';
import styles from './BlockDetailsModal.module.css';
import { ProductionBlock } from '@/lib/planner-types';

interface AutoPlanReportModalProps {
    results: ProductionBlock[];
    splits: number;
    planned: number;
    existingBlocks: any[];
    reactors: any[]; // Dynamic Reactors
    onClose: () => void;
    onSave: (results: ProductionBlock[]) => void;
}

export default function AutoPlanReportModal({ results, splits, planned, existingBlocks, reactors = [], onClose, onSave }: AutoPlanReportModalProps) {
    const [editedResults, setEditedResults] = useState(results.map(r => ({
        ...r,
        // Ensure date is string yyyy-mm-dd for input
        plannedDateStr: r.plannedDate ? new Date(r.plannedDate).toISOString().split('T')[0] : ''
    })));

    // Collision Check
    const checkCollision = (row: any, index: number) => {
        // Check against EXISTING blocks
        const collisionWithExisting = existingBlocks.some(b => {
            if (b.status !== 'PLANNED' || !b.plannedDate) return false;

            // Exclude self (because API has already saved it to DB, so it is in existingBlocks)
            if (row.id && b.id === row.id) return false;

            // Should be date string or Date object. Handle both.
            let bDateStr = '';
            if (typeof b.plannedDate === 'string') {
                bDateStr = b.plannedDate.split('T')[0];
            } else if (b.plannedDate instanceof Date) {
                bDateStr = b.plannedDate.toISOString().split('T')[0];
            }

            return (
                bDateStr === row.plannedDateStr &&
                b.plannedReactor === row.plannedReactor &&
                b.plannedShift === row.plannedShift
            );
        });

        // Check against OTHER rows in this report
        const collisionWithOtherRows = editedResults.some((other, i) =>
            i !== index &&
            other.plannedDateStr === row.plannedDateStr &&
            other.plannedReactor === row.plannedReactor &&
            other.plannedShift === row.plannedShift
        );

        return collisionWithExisting || collisionWithOtherRows;
    };

    const handleUpdate = (index: number, field: string, value: string) => {
        const newResults = [...editedResults];
        newResults[index] = { ...newResults[index], [field]: value };
        setEditedResults(newResults);
    };

    const handleSave = () => {
        // Convert back to Date objects
        const finalResults = editedResults.map(r => ({
            ...r,
            plannedDate: new Date(r.plannedDateStr)
        }));
        onSave(finalResults);
    };

    const hasCollisions = editedResults.some((r, i) => checkCollision(r, i));

    if (!results) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} style={{ maxWidth: '900px' }}>
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={20} />
                </button>

                <div className={styles.header}>
                    <div className={styles.titleRow}>
                        <h2 className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle size={24} color="#10b981" />
                            Revisión de Auto-Planificación
                        </h2>
                    </div>
                </div>

                <div className={styles.content}>
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem',
                        background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Bloques Asignados</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{planned}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Divisiones Realizadas</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>{splits}</div>
                        </div>
                    </div>

                    <p className={styles.subtitle}>
                        Revisa y ajusta las asignaciones. Las filas en <span style={{ color: '#dc2626', fontWeight: 600 }}>ROJO</span> indican conflictos de capacidad.
                    </p>

                    <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                                    <th style={{ padding: '0.5rem', color: '#64748b' }}>Artículo</th>
                                    <th style={{ padding: '0.5rem', color: '#64748b' }}>Lote</th>
                                    <th style={{ padding: '0.5rem', color: '#64748b' }}>Reactor</th>
                                    <th style={{ padding: '0.5rem', color: '#64748b' }}>Fecha</th>
                                    <th style={{ padding: '0.5rem', color: '#64748b' }}>Turno</th>
                                    <th style={{ padding: '0.5rem', color: '#64748b' }}>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {editedResults.map((r, i) => {
                                    const isCollision = checkCollision(r as ProductionBlock, i); // Cast or fix type
                                    return (
                                        <tr key={i} style={{
                                            borderBottom: '1px solid #f1f5f9',
                                            background: isCollision ? '#fef2f2' : 'white'
                                        }}>
                                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{r.articleCode}</td>
                                            <td style={{ padding: '0.5rem' }}>
                                                {r.batchLabel ? (
                                                    <span style={{
                                                        background: '#e0e7ff', color: '#4338ca',
                                                        padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600
                                                    }}>
                                                        {r.batchLabel}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td style={{ padding: '0.5rem' }}>
                                                <select
                                                    value={r.plannedReactor || ''}
                                                    onChange={e => handleUpdate(i, 'plannedReactor', e.target.value)}
                                                    style={{ padding: '4px', borderRadius: '4px', border: isCollision ? '1px solid #ef4444' : '1px solid #cbd5e1' }}
                                                >
                                                    {reactors.map((def: any) => <option key={def.id} value={def.name}>{def.name}</option>)}
                                                </select>
                                            </td>
                                            <td style={{ padding: '0.5rem' }}>
                                                <input
                                                    type="date"
                                                    value={r.plannedDate ? new Date(r.plannedDate).toISOString().split('T')[0] : ''}
                                                    onChange={e => handleUpdate(i, 'plannedDate', e.target.value)} // Note: route expects Date object handling or string
                                                    style={{ padding: '4px', borderRadius: '4px', border: isCollision ? '1px solid #ef4444' : '1px solid #cbd5e1' }}
                                                />
                                            </td>
                                            <td style={{ padding: '0.5rem' }}>
                                                <select
                                                    value={r.plannedShift || 'Mañana'}
                                                    onChange={e => handleUpdate(i, 'plannedShift', e.target.value)}
                                                    style={{ padding: '4px', borderRadius: '4px', border: isCollision ? '1px solid #ef4444' : '1px solid #cbd5e1' }}
                                                >
                                                    <option value="Mañana">Mañana</option>
                                                    <option value="Tarde">Tarde</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '0.5rem' }}>
                                                {isCollision ? <AlertTriangle size={16} color="#ef4444" /> : <CheckCircle size={16} color="#10b981" />}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.footer} style={{ justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.85rem', color: '#ef4444', visibility: hasCollisions ? 'visible' : 'hidden' }}>
                        Hay conflictos en la planificación.
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '0.5rem 1.5rem', background: 'white', color: '#64748b',
                                border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={hasCollisions}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '0.5rem 1.5rem', background: hasCollisions ? '#94a3b8' : '#4f46e5', color: 'white',
                                border: 'none', borderRadius: '6px', fontWeight: 600, cursor: hasCollisions ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <Save size={18} /> Confirmar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
