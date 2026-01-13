'use client';

import { useState } from 'react';
import { createSample, updateSampleStatus, deleteSample } from '../sample-actions';
import { toast } from 'sonner';
import { Trash, Plus, Send } from 'lucide-react';

export default function SampleTracking({ formulaId, samples }: { formulaId: string, samples: any[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // New Sample Form State
    const [newSample, setNewSample] = useState({
        recipient: '',
        dateSent: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const res = await createSample(formulaId, newSample);
        if (res.success) {
            toast.success('Muestra registrada');
            setIsAdding(false);
            setNewSample({ recipient: '', dateSent: new Date().toISOString().split('T')[0] });
        } else {
            toast.error('Error al registrar muestra');
        }
        setIsLoading(false);
    };

    const handleUpdateStatus = async (sampleId: string, status: string, currentFeedback: string) => {
        const res = await updateSampleStatus(sampleId, formulaId, status, currentFeedback);
        if (res.success) toast.success('Estado actualizado');
        else toast.error('Error al actualizar');
    };

    const handleUpdateFeedback = async (sampleId: string, currentStatus: string, feedback: string) => {
        // We'll update on blur or explicit save button to avoid too many requests
        // For simplicity reusing the updateSampleStatus action
        const res = await updateSampleStatus(sampleId, formulaId, currentStatus, feedback);
        if (res.success) toast.success('Feedback guardado');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este registro?')) return;
        const res = await deleteSample(id, formulaId);
        if (res.success) toast.success('Muestra eliminada');
        else toast.error('Error al eliminar');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return '#fef08a'; // yellow-200
            case 'Approved': return '#bbf7d0'; // green-200
            case 'Rejected': return '#fecaca'; // red-200
            case 'Changes Required': return '#fed7aa'; // orange-200
            default: return '#f1f5f9';
        }
    };

    return (
        <div style={{ marginTop: '2rem', background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>Gestión de Muestras</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 1rem', background: '#f0fdfa', color: '#0f766e',
                        borderRadius: '6px', border: '1px solid #99f6e4', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
                    }}
                >
                    <Send size={16} /> Enviar Muestra
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Destinatario / Cliente</label>
                            <input
                                type="text" value={newSample.recipient} onChange={e => setNewSample({ ...newSample, recipient: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                required
                                placeholder="Nombre del cliente o contacto..."
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Fecha de Envío</label>
                            <input
                                type="date" value={newSample.dateSent} onChange={e => setNewSample({ ...newSample, dateSent: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer' }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{ padding: '0.5rem 1rem', background: '#0f766e', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                        >
                            {isLoading ? 'Registrar' : 'Registrar'}
                        </button>
                    </div>
                </form>
            )}

            {samples.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem', color: '#64748b' }}>Fecha</th>
                                <th style={{ padding: '0.75rem', color: '#64748b' }}>Destinatario</th>
                                <th style={{ padding: '0.75rem', color: '#64748b' }}>Estado</th>
                                <th style={{ padding: '0.75rem', color: '#64748b', width: '40%' }}>Feedback</th>
                                <th style={{ padding: '0.75rem', color: '#64748b' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {samples.map((sample) => (
                                <tr key={sample.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.75rem', color: '#334155' }}>{new Date(sample.dateSent).toLocaleDateString()}</td>
                                    <td style={{ padding: '0.75rem', color: '#334155', fontWeight: 500 }}>{sample.recipient}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <select
                                            value={sample.status}
                                            onChange={(e) => handleUpdateStatus(sample.id, e.target.value, sample.feedback || '')}
                                            style={{
                                                padding: '4px 8px', borderRadius: '4px', border: 'none',
                                                background: getStatusColor(sample.status),
                                                color: '#334155', fontWeight: 500, fontSize: '0.85rem'
                                            }}
                                        >
                                            <option value="Pending">Pendiente</option>
                                            <option value="Approved">Aprobada</option>
                                            <option value="Rejected">Rechazada</option>
                                            <option value="Changes Required">Cambios Req.</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <textarea
                                            defaultValue={sample.feedback || ''}
                                            onBlur={(e) => handleUpdateFeedback(sample.id, sample.status, e.target.value)}
                                            placeholder="Feedback del cliente..."
                                            style={{
                                                width: '100%', minHeight: '40px', padding: '0.4rem',
                                                border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.9rem',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleDelete(sample.id)}
                                            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '1rem' }}>
                    No hay muestras enviadas.
                </p>
            )}
        </div>
    );
}
