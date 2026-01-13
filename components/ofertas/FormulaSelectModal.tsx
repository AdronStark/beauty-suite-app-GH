'use client';

import { useState, useEffect } from 'react';
import { Search, X, FlaskConical, Filter } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface Formula {
    id: string;
    code: string;
    name: string;
    version: number;
    status: string;
    costPerKg: number;
    ingredients: string; // JSON string
    ownership: string;
    clients: { name: string }[];
}

interface FormulaSelectModalProps {
    onClose: () => void;
    onSelect: (formula: Formula) => void;
}

export default function FormulaSelectModal({ onClose, onSelect }: FormulaSelectModalProps) {
    const [formulas, setFormulas] = useState<Formula[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filteredFormulas, setFilteredFormulas] = useState<Formula[]>([]);

    useEffect(() => {
        const fetchFormulas = async () => {
            try {
                const res = await fetch('/api/formulas');
                if (res.ok) {
                    const data = await res.json();
                    setFormulas(data);
                    setFilteredFormulas(data);
                }
            } catch (error) {
                console.error("Failed to fetch formulas", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFormulas();
    }, []);

    useEffect(() => {
        if (!search) {
            setFilteredFormulas(formulas);
        } else {
            const lower = search.toLowerCase();
            setFilteredFormulas(formulas.filter(f => {
                const nameMatch = (f.name || '').toLowerCase().includes(lower);
                const codeMatch = (f.code || '').toLowerCase().includes(lower);
                const clientMatch = (f.clients || []).some(c => (c.name || '').toLowerCase().includes(lower));
                return nameMatch || codeMatch || clientMatch;
            }));
        }
    }, [search, formulas]);

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '900px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                {/* Header */}
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', background: '#dbeafe', borderRadius: '8px', color: '#2563eb' }}>
                            <FlaskConical size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: '#1e293b' }}>Seleccionar Fórmula</h2>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Importa la composición e ingredientes desde la base de datos</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, código o cliente..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.6rem 1rem 0.6rem 2.5rem',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.95rem',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Cargando fórmulas...</div>
                    ) : filteredFormulas.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                            <p>No se encontraron fórmulas.</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                <tr style={{ textAlign: 'left', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>Fórmula</th>
                                    <th style={{ padding: '0.75rem', fontWeight: 600 }}>Cliente</th>
                                    <th style={{ padding: '0.75rem', fontWeight: 600 }}>Propiedad</th>
                                    <th style={{ padding: '0.75rem', fontWeight: 600 }}>Estado</th>
                                    <th style={{ padding: '0.75rem', fontWeight: 600, textAlign: 'right' }}>Coste (€/kg)</th>
                                    <th style={{ padding: '0.75rem', width: '100px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFormulas.map((f, i) => (
                                    <tr
                                        key={f.id}
                                        style={{
                                            borderBottom: '1px solid #f1f5f9',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                    >
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>{f.name}</div>
                                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>{f.code}</span>
                                                <span>•</span>
                                                <span>Rev. {f.version !== undefined && f.version !== null ? f.version : 0}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: '#475569' }}>
                                            {f.clients && f.clients.length > 0
                                                ? f.clients.map(c => c.name).join(', ')
                                                : <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>-</span>
                                            }
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            {f.ownership === 'CLIENTE' ? (
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: '4px' }}>CLIENTE</span>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f766e', background: '#f0fdf4', padding: '2px 8px', borderRadius: '4px' }}>PROPIA</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{
                                                fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 600,
                                                background: f.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                                                color: f.status === 'Active' ? '#166534' : '#64748b'
                                            }}>
                                                {f.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#334155' }}>
                                            {formatCurrency(f.costPerKg)}
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                            <button
                                                onClick={() => onSelect(f)}
                                                style={{
                                                    background: '#2563eb', color: 'white', border: 'none',
                                                    padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem',
                                                    fontWeight: 500, cursor: 'pointer'
                                                }}
                                            >
                                                Seleccionar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
