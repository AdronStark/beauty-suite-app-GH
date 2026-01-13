import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Calendar, AlertTriangle, Trash2, CheckCircle2, Save } from 'lucide-react';
import { toast } from 'sonner';
import styles from './BlockDetailsModal.module.css';
import { SHIFTS } from '@/lib/planner-constants';
import { ProductionBlock } from '@/lib/planner-types';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface BlockDetailsModalProps {
    block: ProductionBlock;
    onClose: () => void;
    onUnplan: (id: string, reassign?: boolean) => void;
}

export default function BlockDetailsModal({ block, onClose, onUnplan }: BlockDetailsModalProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDangerous: false
    });

    // Local state for Real Data
    const [realKg, setRealKg] = useState<string>(block.realKg?.toString() || '');
    const [realDuration, setRealDuration] = useState<string>(block.realDuration?.toString() || '');
    const [operatorNotes, setOperatorNotes] = useState<string>(block.operatorNotes || '');
    const [markAsProduced, setMarkAsProduced] = useState(block.status === 'PRODUCED');

    if (!block) return null;

    const handleSaveRealData = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/planificador/blocks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: block.id,
                    realKg: realKg ? parseFloat(realKg) : null,
                    realDuration: realDuration ? parseInt(realDuration) : null,
                    operatorNotes,
                    status: markAsProduced ? 'PRODUCED' : (block.status === 'PRODUCED' ? 'PLANNED' : undefined)
                })
            });

            if (res.ok) {
                toast.success("Datos guardados correctamente");
                router.refresh(); // Refresh data to show updates
                onClose();
            } else {
                toast.error("Error al guardar datos.");
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Error de conexión.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSplit = async () => {
        try {
            const res = await fetch('/api/planificador/split', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: block.id })
            });
            if (res.ok) {
                toast.success("Lote dividido correctamente");
                router.refresh();
                onClose();
            } else {
                toast.error('Error al dividir');
            }
        } catch (e) { console.error(e); toast.error('Error de conexión'); }
    };

    const confirmSplit = () => {
        setConfirmConfig({
            isOpen: true,
            title: 'Dividir Fabricación',
            message: `¿Dividir esta fabricación de ${block.units}kg en tandas más pequeñas?`,
            onConfirm: () => {
                handleSplit();
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            },
            isDangerous: false
        });
    };

    // Efficiency Calculation
    const plannedKg = block.units || 0;
    const currentRealKg = parseFloat(realKg) || 0;
    const efficiency = plannedKg > 0 && currentRealKg > 0
        ? (currentRealKg / plannedKg) * 100
        : 0;

    // Deviation check (e.g. +/- 10%)
    const isDeviation = efficiency > 0 && (efficiency < 90 || efficiency > 110);

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.title}>
                        <h2>{block.articleCode}</h2>
                        <div className={styles.subtitle}>{block.articleDesc}</div>
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.infoRow} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span><strong>Cliente:</strong> {block.clientName}</span>
                        {block.deadline && (() => {
                            const days = Math.ceil((new Date(block.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            const isUrgent = days < 20;
                            return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Fecha necesaria:</span>
                                    <span style={{
                                        fontSize: '0.85rem', fontWeight: 600,
                                        color: isUrgent ? '#dc2626' : '#64748b',
                                        background: isUrgent ? '#fee2e2' : '#f1f5f9',
                                        padding: '2px 6px', borderRadius: '4px'
                                    }}>
                                        {new Date(block.deadline).toLocaleDateString()}
                                    </span>
                                </div>
                            )
                        })()}
                    </div>
                    <div className={styles.infoRow}>
                        <strong>Pedido:</strong> #{block.orderNumber}
                    </div>

                    <div className={styles.divider} />

                    {/* Dynamic Metrics Calculation - Compact Version */}
                    {(() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const siblings = block.relatedBlocks || [];
                        const pastBlocks = siblings.filter((b: any) =>
                            b.status === 'PLANNED' && b.plannedDate && new Date(b.plannedDate) < today
                        );
                        const realizedUnits = pastBlocks.reduce((acc: number, b: any) => acc + b.units, 0);
                        const baseServed = block.unitsServed || 0;
                        const totalServed = baseServed + realizedUnits;
                        const ordered = block.unitsOrdered || 0;
                        const totalPending = Math.max(0, ordered - totalServed);

                        return (
                            <div className={styles.grid} style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div className={styles.metric} style={{ padding: '0.5rem' }}>
                                    <div className={styles.metricLabel} style={{ fontSize: '0.7rem' }}>Pedidas</div>
                                    <div className={styles.metricValue} style={{ fontSize: '1rem' }}>{ordered}</div>
                                </div>
                                <div className={styles.metric} style={{ background: realizedUnits > 0 ? '#f0fdf4' : undefined, padding: '0.5rem' }}>
                                    <div className={styles.metricLabel} style={{ fontSize: '0.7rem' }}>Servidas</div>
                                    <div className={styles.metricValue} style={{ fontSize: '1rem' }}>
                                        {totalServed}
                                        {realizedUnits > 0 && <span style={{ fontSize: '0.65rem', color: '#166534', marginLeft: '4px' }}>(+{realizedUnits})</span>}
                                    </div>
                                </div>
                                <div className={styles.metric} style={{ padding: '0.5rem' }}>
                                    <div className={styles.metricLabel} style={{ fontSize: '0.7rem' }}>Pendientes</div>
                                    <div className={styles.metricValue} style={{ fontSize: '1rem' }}>{totalPending}</div>
                                </div>
                            </div>
                        );
                    })()}

                    <div style={{ background: '#eff6ff', padding: '0.5rem 1rem', borderRadius: '6px', color: '#1e40af', marginTop: '0.5rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Esta Fabricación:</span> <strong>{block.units} kg</strong>
                    </div>

                    {/* --- DATOS REALES (PERFORMANCE) --- */}
                    {(block.status === 'PLANNED' || block.status === 'PRODUCED') && (
                        <>
                            <div className={styles.divider} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h3 style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle2 size={16} color="#059669" />
                                    Datos Reales Producción
                                </h3>
                                {isDeviation && (
                                    <span style={{ fontSize: '0.75rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px', background: '#fffbeb', padding: '2px 6px', borderRadius: '4px' }}>
                                        <AlertTriangle size={12} /> Desviación {efficiency.toFixed(0)}%
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Real Kg</label>
                                    <input
                                        type="number"
                                        value={realKg}
                                        onChange={e => setRealKg(e.target.value)}
                                        className={styles.input}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Duración Real (min)</label>
                                    <input
                                        type="number"
                                        value={realDuration}
                                        onChange={e => setRealDuration(e.target.value)}
                                        className={styles.input}
                                        placeholder="Minutos"
                                    />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Notas Operario</label>
                                    <textarea
                                        value={operatorNotes}
                                        onChange={e => setOperatorNotes(e.target.value)}
                                        className={styles.input}
                                        rows={2}
                                        placeholder="Incidencias, ajustes..."
                                        style={{ width: '100%', resize: 'none' }}
                                    />
                                </div>
                            </div>



                            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    id="markProduced"
                                    checked={markAsProduced}
                                    onChange={e => setMarkAsProduced(e.target.checked)}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <label htmlFor="markProduced" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>
                                    Finalizar Producción (Marcar como PRODUCED)
                                </label>
                            </div>

                            <button
                                onClick={handleSaveRealData}
                                disabled={isSaving}
                                style={{
                                    width: '100%', padding: '0.5rem', background: '#0f172a', color: 'white',
                                    borderRadius: '6px', border: 'none', cursor: 'pointer',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                                    opacity: isSaving ? 0.7 : 1
                                }}
                            >
                                <Save size={16} />
                                {isSaving ? 'Guardando...' : 'Guardar Datos Reales'}
                            </button>
                        </>
                    )}

                    <div className={styles.divider} />

                    <div className={styles.infoRow}>
                        <strong>Estado:</strong> {block.status}
                    </div>
                    {block.batchLabel && (
                        <div className={styles.infoRow}>
                            <strong>Tanda:</strong> {block.batchLabel}
                        </div>
                    )}
                    {block.plannedDate && (
                        <div className={styles.infoRow}>
                            <strong>Planificado:</strong> {new Date(block.plannedDate).toLocaleDateString()} ({block.plannedShift}) en {block.plannedReactor}
                        </div>
                    )}

                    {/* Desglose de Producción (Related Batches) */}
                    {block.relatedBlocks && block.relatedBlocks.length > 0 && (
                        <>
                            <div className={styles.divider} />
                            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: '#1e293b' }}>Desglose de Producción</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                                {block.relatedBlocks.map((rb: any) => {
                                    const isCurrent = rb.id === block.id;
                                    const isPlanned = rb.status === 'PLANNED';
                                    const pDate = rb.plannedDate ? new Date(rb.plannedDate) : null;
                                    const today = new Date(); today.setHours(0, 0, 0, 0);
                                    const isPast = pDate && pDate < today;

                                    let statusText = 'Pendiente';
                                    let statusColor = '#94a3b8';
                                    let icon = '';

                                    if (isPast) {
                                        statusText = `Realizada (${pDate!.toLocaleDateString()})`;
                                        statusColor = '#475569';
                                        icon = '✔️';
                                    } else if (isPlanned) {
                                        statusText = pDate!.toLocaleDateString();
                                        statusColor = '#15803d';
                                        icon = '📅';
                                    }

                                    let bg = 'white'; let border = '#e2e8f0'; let opacity = 1;

                                    if (isCurrent) { bg = '#eff6ff'; border = '#3b82f6'; }
                                    else if (isPast) { bg = '#f1f5f9'; opacity = 0.85; }
                                    else if (isPlanned) { bg = '#f0fdf4'; }

                                    return (
                                        <div key={rb.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '8px 12px', borderRadius: '6px',
                                            border: isCurrent ? `2px solid ${border}` : `1px solid ${border}`,
                                            background: bg, opacity: opacity
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isCurrent ? '#1e40af' : '#334155' }}>
                                                    {rb.batchLabel || 'T1'}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({rb.units} kg)</span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {icon && <span>{icon}</span>}
                                                <span style={{ color: statusColor, fontWeight: (isPlanned || isPast) ? 600 : 400 }}>
                                                    {statusText}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>

                <div className={styles.actions}>
                    {block.units > 2000 && (
                        <button
                            className={`${styles.button}`}
                            style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d' }}
                            onClick={confirmSplit}
                        >
                            ✂️ Dividir Lotes
                        </button>
                    )}
                    <button className={`${styles.button} ${styles.danger}`} onClick={() => onUnplan(block.id, false)}>
                        A Pendientes
                    </button>
                    <button className={`${styles.button} ${styles.primary}`} onClick={() => onUnplan(block.id, true)}>
                        Mover (Reasignar)
                    </button>
                </div>
            </div >

            <ConfirmationModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                isDangerous={confirmConfig.isDangerous}
            />
        </div >
    );
}
