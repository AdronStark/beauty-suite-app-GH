'use client';
import { useState } from 'react';
import { X, Trash2, Calendar as CalIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './BlockDetailsModal.module.css'; // Reusing styles

export default function MaintenanceModal({ maintenance, reactors = [], onClose, onSave, onDelete }: any) {
    const defaultReactor = reactors.length > 0 ? reactors[0].name : '';
    const [reactor, setReactor] = useState(defaultReactor);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Update reactor when props change if needed (initially)
    // useEffect(() => { if (!reactor && reactors.length > 0) setReactor(reactors[0].name); }, [reactors]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate || !reason) return alert("Completa todos los campos");

        setIsSaving(true);
        await onSave({ reactorId: reactor, startDate, endDate, reason });
        setIsSaving(false);
        // Reset form
        setReason('');
        setStartDate('');
        setEndDate('');
    };

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className={styles.header}>
                    <div className={styles.title}>
                        <h2>Gestión de Mantenimiento</h2>
                        <div className={styles.subtitle}>Bloqueo de reactores</div>
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Form */}
                    <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#334155' }}>Nuevo Mantenimiento</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Reactor</label>
                                <select
                                    className={styles.input}
                                    value={reactor}
                                    onChange={e => setReactor(e.target.value)}
                                >
                                    {reactors.map((r: any) => <option key={r.id} value={r.name}>{r.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Motivo</label>
                                <input
                                    className={styles.input}
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    placeholder="Ej. Limpieza profunda"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Desde</label>
                                <input
                                    type="date"
                                    className={styles.input}
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Hasta</label>
                                <input
                                    type="date"
                                    className={styles.input}
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`${styles.button} ${styles.primary}`}
                            style={{ width: '100%' }}
                        >
                            {isSaving ? 'Guardando...' : 'Añadir Bloqueo'}
                        </button>
                    </form>

                    {/* List */}
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#334155' }}>Bloqueos Activos</h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {maintenance && maintenance.length > 0 ? (
                            maintenance.map((m: any) => (
                                <div key={m.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.75rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                                            {m.reactorId}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                            {format(new Date(m.startDate), 'dd MMM', { locale: es })} - {format(new Date(m.endDate), 'dd MMM', { locale: es })}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#475569', fontStyle: 'italic' }}>
                                            {m.reason}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onDelete(m.id)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                No hay mantenimientos programados.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
