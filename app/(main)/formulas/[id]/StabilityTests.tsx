'use client';

import { useState } from 'react';
import { createStabilityTest, deleteStabilityTest } from '../stability-actions';
import { toast } from 'sonner';
import { Trash, Plus } from 'lucide-react';

export default function StabilityTests({ formulaId, tests }: { formulaId: string, tests: any[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // New Test Form State
    const [newTest, setNewTest] = useState({
        type: 'T0',
        temperature: '25C',
        date: new Date().toISOString().split('T')[0],
        ph: '',
        viscosity: '',
        appearance: '',
        aroma: '',
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const res = await createStabilityTest(formulaId, newTest);
        if (res.success) {
            toast.success('Test añadido');
            setIsAdding(false);
            setNewTest({ ...newTest, ph: '', viscosity: '', appearance: '', aroma: '', notes: '' });
        } else {
            toast.error('Error al añadir test');
        }
        setIsLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este registro?')) return;
        const res = await deleteStabilityTest(id, formulaId);
        if (res.success) toast.success('Test eliminado');
        else toast.error('Error al eliminar');
    };

    return (
        <div style={{ marginTop: '2rem', background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>Tests de Estabilidad</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 1rem', background: '#f0fdfa', color: '#0f766e',
                        borderRadius: '6px', border: '1px solid #99f6e4', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
                    }}
                >
                    <Plus size={16} /> Nuevo Control
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Tipo / Tiempo</label>
                            <select
                                value={newTest.type} onChange={e => setNewTest({ ...newTest, type: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            >
                                <option value="T0">T0 (Inicial)</option>
                                <option value="T15D">15 Días</option>
                                <option value="T1M">1 Mes</option>
                                <option value="T2M">2 Meses</option>
                                <option value="T3M">3 Meses</option>
                                <option value="T6M">6 Meses</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Temperatura</label>
                            <select
                                value={newTest.temperature} onChange={e => setNewTest({ ...newTest, temperature: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            >
                                <option value="25C">Ambiente (25°C)</option>
                                <option value="40C">Estufa (40°C)</option>
                                <option value="50C">Estufa (50°C)</option>
                                <option value="4C">Nevera (4°C)</option>
                                <option value="UV">Luz UV</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Fecha</label>
                            <input
                                type="date" value={newTest.date} onChange={e => setNewTest({ ...newTest, date: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>pH</label>
                            <input
                                type="text" value={newTest.ph} onChange={e => setNewTest({ ...newTest, ph: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Viscosidad</label>
                            <input
                                type="text" value={newTest.viscosity} onChange={e => setNewTest({ ...newTest, viscosity: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Aspecto</label>
                            <input
                                type="text" value={newTest.appearance} onChange={e => setNewTest({ ...newTest, appearance: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Olor</label>
                            <input
                                type="text" value={newTest.aroma} onChange={e => setNewTest({ ...newTest, aroma: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
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
                            {isLoading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            )}

            {tests.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem', color: '#64748b' }}>Fecha</th>
                                <th style={{ padding: '0.75rem', color: '#64748b' }}>Tipo</th>
                                <th style={{ padding: '0.75rem', color: '#64748b' }}>Temp</th>
                                <th style={{ padding: '0.75rem', color: '#64748b' }}>pH</th>
                                <th style={{ padding: '0.75rem', color: '#64748b' }}>Viscosidad</th>
                                <th style={{ padding: '0.75rem', color: '#64748b' }}>Aspecto</th>
                                <th style={{ padding: '0.75rem', color: '#64748b' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tests.map((test) => (
                                <tr key={test.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.75rem', color: '#334155' }}>{new Date(test.date).toLocaleDateString()}</td>
                                    <td style={{ padding: '0.75rem', color: '#334155', fontWeight: 600 }}>{test.type}</td>
                                    <td style={{ padding: '0.75rem', color: '#64748b' }}>{test.temperature}</td>
                                    <td style={{ padding: '0.75rem', color: '#334155' }}>{test.ph || '-'}</td>
                                    <td style={{ padding: '0.75rem', color: '#334155' }}>{test.viscosity || '-'}</td>
                                    <td style={{ padding: '0.75rem', color: '#334155' }}>{test.appearance || '-'}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleDelete(test.id)}
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
                    No hay registros de estabilidad.
                </p>
            )}
        </div>
    );
}
