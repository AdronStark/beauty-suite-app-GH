'use client';

import { useState, useEffect } from 'react';
import { X, FileText, FileDown, Lock, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface DocumentConfig {
    clientName?: string;
    clientAddress?: string;
    clientVat?: string;
    contactName?: string;

    paymentTerms?: string;
    validityText?: string;
    deliveryTime?: string;
    incoterms?: string;

    introText?: string;

    notesBulk?: string;
    notesPacking?: string;
    notesExtras?: string;

    finalObservations?: string;
}

interface DocumentConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialConfig: DocumentConfig;
    offerStatus: string;
    onGenerate: (config: DocumentConfig, format: 'pdf' | 'docx') => void;
}

export default function DocumentConfigModal({ isOpen, onClose, initialConfig, offerStatus, onGenerate }: DocumentConfigModalProps) {
    const [activeTab, setActiveTab] = useState<'commercial' | 'comments' | 'conditions'>('commercial');

    // Status Logic
    const isFrozen = ['Enviada', 'Adjudicada', 'Rechazada'].includes(offerStatus);
    const canGenerate = ['Validada', 'Enviada', 'Adjudicada', 'Rechazada'].includes(offerStatus);
    const isDraft = ['Borrador', 'Pendiente de validar'].includes(offerStatus);

    // If frozen, inputs are read-only.
    // If draft, inputs are editable but generate is disabled.

    const { register, handleSubmit, reset } = useForm<DocumentConfig>({
        defaultValues: initialConfig
    });

    // Reset form when opening or config changes
    useEffect(() => {
        if (isOpen) {
            reset(initialConfig);
        }
    }, [isOpen, initialConfig, reset]);

    if (!isOpen) return null;

    const tabs = [
        { id: 'commercial', label: 'Datos Comerciales' },
        { id: 'comments', label: 'Comentarios por Sección' },
        { id: 'conditions', label: 'Condiciones Particulares' }
    ];

    const inputStyle = {
        width: '100%',
        padding: '0.5rem',
        border: '1px solid #e2e8f0',
        borderRadius: '4px',
        marginTop: '0.25rem',
        background: isFrozen ? '#f1f5f9' : 'white',
        color: isFrozen ? '#64748b' : 'inherit'
    };

    const labelStyle = {
        fontSize: '0.85rem',
        fontWeight: 600,
        color: '#475569',
        display: 'block',
        marginTop: '0.75rem'
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', overflowY: 'auto', padding: '1rem'
        }}>
            <div style={{
                margin: 'auto',
                background: 'white',
                borderRadius: '8px',
                width: '900px',
                maxWidth: '100%',
                height: '85vh',
                maxHeight: 'calc(100vh - 2rem)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#f8fafc', borderTopLeftRadius: '8px', borderTopRightRadius: '8px'
                }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                            Configuración del Documento
                        </h2>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Estado: <span style={{ fontWeight: 600 }}>{offerStatus}</span>
                            {isFrozen && <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.75rem', padding: '1px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Lock size={12} /> Solo Lectura</span>}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 1.5rem' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                padding: '1rem 0',
                                marginRight: '2rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                                color: activeTab === tab.id ? 'var(--color-primary)' : '#64748b',
                                fontWeight: activeTab === tab.id ? 600 : 500,
                                cursor: 'pointer'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

                    {/* --- TAB 1: COMMERCIAL --- */}
                    {activeTab === 'commercial' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.5rem' }}>
                                    Datos del Cliente (Sobrescribir)
                                </h3>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem', fontStyle: 'italic' }}>
                                    Dejar en blanco para usar los datos predeterminados.
                                </div>

                                <div>
                                    <label style={labelStyle}>Razón Social</label>
                                    <input {...register('clientName')} style={inputStyle} readOnly={isFrozen} placeholder="Nombre Cliente S.L." />
                                </div>
                                <div>
                                    <label style={labelStyle}>Dirección Completa</label>
                                    <textarea {...register('clientAddress')} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} readOnly={isFrozen} placeholder="C/ Ejemplo 123&#10;28000 Madrid" />
                                </div>
                                <div>
                                    <label style={labelStyle}>CIF / NIF</label>
                                    <input {...register('clientVat')} style={inputStyle} readOnly={isFrozen} placeholder="B12345678" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Persona de Contacto</label>
                                    <input {...register('contactName')} style={inputStyle} readOnly={isFrozen} />
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.5rem' }}>
                                    Condiciones Comerciales
                                </h3>

                                {/* Standard Options Definitions */}
                                <datalist id="paymentOptions">
                                    <option value="Contado" />
                                    <option value="Transferencia 30 días f.f." />
                                    <option value="Giro a 30 días f.f." />
                                    <option value="Giro a 60 días f.f." />
                                    <option value="50% Anticipo, 50% antes de carga" />
                                </datalist>
                                <datalist id="validityOptions">
                                    <option value="15 días" />
                                    <option value="30 días" />
                                    <option value="60 días" />
                                    <option value="Hasta final de año" />
                                </datalist>
                                <datalist id="deliveryOptions">
                                    <option value="Inmediata (Stock)" />
                                    <option value="1-2 semanas" />
                                    <option value="3-4 semanas" />
                                    <option value="4-6 semanas" />
                                    <option value="A consultar" />
                                </datalist>
                                <datalist id="incotermOptions">
                                    <option value="EXW (En Fábrica)" />
                                    <option value="DDP (Entregado derechos pagados)" />
                                    <option value="DAP (Entregado en lugar)" />
                                    <option value="CIF (Coste, seguro y flete)" />
                                </datalist>

                                <div>
                                    <label style={labelStyle}>Forma de Pago</label>
                                    <input {...register('paymentTerms')} list="paymentOptions" style={inputStyle} readOnly={isFrozen} placeholder="Seleccione o escriba..." />
                                </div>
                                <div>
                                    <label style={labelStyle}>Validez de la Oferta</label>
                                    <input {...register('validityText')} list="validityOptions" style={inputStyle} readOnly={isFrozen} placeholder="Seleccione o escriba..." />
                                </div>
                                <div>
                                    <label style={labelStyle}>Plazo de Entrega</label>
                                    <input {...register('deliveryTime')} list="deliveryOptions" style={inputStyle} readOnly={isFrozen} placeholder="Seleccione o escriba..." />
                                </div>
                                <div>
                                    <label style={labelStyle}>Incoterms</label>
                                    <input {...register('incoterms')} list="incotermOptions" style={inputStyle} readOnly={isFrozen} placeholder="Seleccione o escriba..." />
                                </div>
                            </div>
                        </div>
                    )}


                    {/* --- TAB 2: COMMENTS --- */}
                    {activeTab === 'comments' && (
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>
                                Introducción y Notas por Sección
                            </h3>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={labelStyle}>Texto Introductorio</label>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Aparecerá al inicio de la oferta, antes de la tabla económica.</div>
                                <textarea {...register('introText')} style={{ ...inputStyle, minHeight: '80px' }} readOnly={isFrozen} placeholder="Estimados señores..." />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={labelStyle}>Notas Granel</label>
                                    <textarea {...register('notesBulk')} style={{ ...inputStyle, minHeight: '100px' }} readOnly={isFrozen} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Notas Envasado y Acondicionado</label>
                                    <textarea {...register('notesPacking')} style={{ ...inputStyle, minHeight: '100px' }} readOnly={isFrozen} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={labelStyle}>Notas Extras / Otros</label>
                                    <textarea {...register('notesExtras')} style={{ ...inputStyle, minHeight: '80px' }} readOnly={isFrozen} />
                                </div>
                            </div>
                        </div>
                    )}


                    {/* --- TAB 3: CONDITIONS --- */}
                    {activeTab === 'conditions' && (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>
                                Condiciones Particulares y Observaciones Finales
                            </h3>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <label style={labelStyle}>Texto Completo</label>
                                <textarea
                                    {...register('finalObservations')}
                                    style={{ ...inputStyle, flex: 1, resize: 'none', padding: '1rem', fontFamily: 'monospace', lineHeight: 1.5 }}
                                    readOnly={isFrozen}
                                    placeholder="- El precio no incluye..."
                                />
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div style={{
                    padding: '1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px'
                }}>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '400px' }}>
                        {!canGenerate && (
                            <div style={{ color: '#d97706', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <Info size={16} />
                                Debes validar la oferta para poder generar el documento final. Puedes guardar esta configuración mientras tanto.
                            </div>
                        )}
                        {canGenerate && isFrozen && (
                            <div style={{ color: '#0f766e', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <Info size={16} />
                                Configuración guardada. Puedes descargar copias del documento.
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px',
                                background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            {isFrozen ? 'Cerrar' : 'Cancelar'}
                        </button>

                        {/* Save Button (Only if editable) */}
                        {!isFrozen && (
                            <button
                                type="button"
                                onClick={handleSubmit((data) => onGenerate(data, 'save_only' as any))}
                                style={{
                                    padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '6px',
                                    background: 'white', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                Guardar Config
                            </button>
                        )}

                        {/* Generate Buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', opacity: canGenerate ? 1 : 0.5, pointerEvents: canGenerate ? 'auto' : 'none' }}>
                            <button
                                type="button"
                                onClick={handleSubmit((data) => onGenerate(data, 'docx'))}
                                style={{
                                    padding: '0.5rem 1rem', border: 'none', borderRadius: '6px',
                                    background: '#0ea5e9', color: 'white', fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    boxShadow: '0 2px 4px rgba(14, 165, 233, 0.2)'
                                }}
                            >
                                <FileText size={18} />
                                WORD
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit((data) => onGenerate(data, 'pdf'))}
                                style={{
                                    padding: '0.5rem 1rem', border: 'none', borderRadius: '6px',
                                    background: '#ef4444', color: 'white', fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                                }}
                            >
                                <FileDown size={18} />
                                PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
