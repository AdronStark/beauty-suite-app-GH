
'use client';

import { Sparkles, CheckCircle, Lightbulb, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface AIAnalysisResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    data: {
        aiReasoning?: {
            formula_source?: string;
            cost_sources?: string[];
            visual_analysis?: string;
            confidence_score?: number;
        };
        [key: string]: any;
    };
}

export default function AIAnalysisResultModal({ isOpen, onClose, onConfirm, data }: AIAnalysisResultModalProps) {
    if (!isOpen) return null;

    const reasoning = data?.aiReasoning;

    if (!reasoning) {
        // Fallback if no reasoning provided by older API response
        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 3000,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{
                    background: 'white', borderRadius: '12px', padding: '2rem',
                    maxWidth: '500px', width: '90%', textAlign: 'center'
                }}>
                    <CheckCircle size={48} color="#16a34a" style={{ margin: '0 auto 1rem auto' }} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Briefing Generado</h2>
                    <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>La IA ha procesado tu solicitud y ha rellenado el formulario.</p>
                    <button
                        onClick={onConfirm}
                        style={{
                            background: '#2563eb', color: 'white', border: 'none', padding: '0.75rem 1.5rem',
                            borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', width: '100%'
                        }}
                    >
                        Revisar Datos
                    </button>
                </div>
            </div>
        );
    }

    const confidenceColor = (reasoning.confidence_score || 0) > 80 ? '#16a34a' : ((reasoning.confidence_score || 0) > 50 ? '#d97706' : '#dc2626');

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'white', borderRadius: '16px',
                width: '700px', maxWidth: '95vw',
                maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#dbeafe', padding: '0.5rem', borderRadius: '50%', color: '#2563eb' }}>
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Análisis Completado</h2>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            Confianza IA:
                            <span style={{ color: confidenceColor, fontWeight: 700 }}>{reasoning.confidence_score}%</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '2rem' }}>

                    <div style={{ display: 'grid', gap: '1.5rem' }}>

                        {/* Visual Analysis */}
                        {reasoning.visual_analysis && (
                            <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '1rem' }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertTriangle size={16} /> Lo que he visto
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
                                    {reasoning.visual_analysis}
                                </p>
                            </div>
                        )}

                        {/* Cost Sources */}
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <LinkIcon size={18} /> Fuentes de Costes
                            </h3>
                            {reasoning.cost_sources && reasoning.cost_sources.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
                                    {reasoning.cost_sources.map((source, idx) => {
                                        // Split by URL
                                        const parts = source.split(/(https?:\/\/[^\s]+)/g);
                                        return (
                                            <li key={idx} style={{
                                                background: '#fff', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '6px',
                                                fontSize: '0.9rem', color: '#334155', fontWeight: 500, display: 'flex', alignItems: 'flex-start', gap: '8px'
                                            }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1', marginTop: '6px', flexShrink: 0 }}></span>
                                                <span style={{ wordBreak: 'break-all', flex: 1 }}>
                                                    {parts.map((part, i) => {
                                                        const isUrl = part.match(/^https?:\/\//);
                                                        return isUrl ? (
                                                            <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                                                                {part}
                                                            </a>
                                                        ) : (
                                                            <span key={i}>{part}</span>
                                                        );
                                                    })}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p style={{ fontSize: '0.9rem', color: '#94a3b8', fontStyle: 'italic' }}>No se han citado fuentes específicas.</p>
                            )}
                        </div>

                        {/* Formula Reasoning */}
                        {reasoning.formula_source && (
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Lightbulb size={18} /> Lógica de la Fórmula
                                </h3>
                                <div style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '1rem', fontSize: '0.9rem', color: '#475569', fontStyle: 'italic' }}>
                                    "{reasoning.formula_source}"
                                </div>
                            </div>
                        )}

                    </div>

                </div>

                {/* Footer */}
                <div style={{ padding: '1.5rem 2rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button
                        onClick={onClose}
                        style={{ background: 'white', color: '#64748b', border: '1px solid #cbd5e1', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Volver
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{ background: '#0f172a', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.1)' }}
                    >
                        Aceptar y Editar
                    </button>
                </div>
            </div>
        </div>
    );
}
