'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Package, Search } from 'lucide-react';
import styles from '@/app/(main)/briefings/page.module.css';
import FormulaSelectModal from '@/components/ofertas/FormulaSelectModal';

interface SampleRegistrationModalProps {
    briefingId: string;
    formulas: any[]; // Deprecated/Legacy, we fetch dynamically now via Modal
    onClose: () => void;
    onSuccess: () => void;
}

export default function SampleRegistrationModal({ briefingId, formulas, onClose, onSuccess }: SampleRegistrationModalProps) {
    const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm();
    const [serverError, setServerError] = useState('');

    // Formula Selection State
    const [showFormulaModal, setShowFormulaModal] = useState(false);
    const [selectedFormula, setSelectedFormula] = useState<any>(null); // For display

    const onSubmit = async (data: any) => {
        try {
            const res = await fetch('/api/samples', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formulaId: data.formulaId,
                    recipient: data.recipient,
                    notes: data.notes
                })
            });

            if (res.ok) {
                onSuccess();
            } else {
                setServerError("Error al registrar la muestra.");
            }
        } catch (e) {
            setServerError("Error de conexión.");
        }
    };

    const handleSelectFormula = (f: any) => {
        setValue('formulaId', f.id);
        setSelectedFormula(f);
        setShowFormulaModal(false);
    };

    const handleClearFormula = () => {
        setValue('formulaId', null);
        setSelectedFormula(null);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: 'white', padding: '2rem', borderRadius: '1rem',
                width: '100%', maxWidth: '500px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Package size={20} color="#2563eb" /> Registrar Envío de Muestra
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} color="#64748b" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className={styles.field} style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Fórmula *</label>

                        {/* Hidden Input for Form State */}
                        <input type="hidden" {...register('formulaId', { required: true })} />

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                    readOnly
                                    placeholder="Seleccionar fórmula..."
                                    value={selectedFormula ? `${selectedFormula.code} - ${selectedFormula.name}` : ''}
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0',
                                        background: '#f8fafc', cursor: 'pointer', textOverflow: 'ellipsis'
                                    }}
                                    onClick={() => setShowFormulaModal(true)}
                                />
                                {selectedFormula && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleClearFormula(); }}
                                        style={{
                                            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFormulaModal(true)}
                                style={{
                                    padding: '0 1rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe',
                                    borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center'
                                }}
                            >
                                <Search size={20} />
                            </button>
                        </div>
                        {errors.formulaId && <span style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>Debes seleccionar una fórmula</span>}
                    </div>

                    <div className={styles.field} style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Destinatario (Cliente) *</label>
                        <input
                            {...register('recipient', { required: true })}
                            placeholder="Nombre del contacto"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                        />
                        {errors.recipient && <span style={{ color: 'red', fontSize: '0.8rem' }}>Requerido</span>}
                    </div>

                    <div className={styles.field} style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Notas / Comentarios</label>
                        <textarea
                            {...register('notes')}
                            placeholder="Comentarios adicionales..."
                            rows={3}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                        />
                    </div>

                    {serverError && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>{serverError}</div>}

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none',
                                background: 'var(--color-primary)', color: 'white', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                opacity: isSubmitting ? 0.7 : 1
                            }}
                        >
                            {isSubmitting ? 'Guardando...' : <><Save size={18} /> Registrar</>}
                        </button>
                    </div>
                </form>

                {/* Formula Selection Modal */}
                {showFormulaModal && (
                    <FormulaSelectModal
                        onClose={() => setShowFormulaModal(false)}
                        onSelect={handleSelectFormula}
                    />
                )}
            </div>
        </div>
    );
}
