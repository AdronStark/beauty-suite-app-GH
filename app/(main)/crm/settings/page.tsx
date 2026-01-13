'use client';

import { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Save, TrendingUp, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';
import ClientSelect from '@/components/clients/ClientSelect';

interface Company {
    id: string;
    code: string;
    name: string;
    color: string | null;
}

interface Budget {
    id: string;
    client: string;
    amount: number;
}

export default function CRMSettings() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [newClient, setNewClient] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);

    // Fetch companies on mount
    useEffect(() => {
        fetch('/api/companies')
            .then(res => res.json())
            .then(data => {
                setCompanies(data);
                if (data.length > 0) {
                    setActiveCompanyId(data[0].id);
                }
            })
            .catch(console.error);
    }, []);

    // Fetch budgets when company or year changes
    useEffect(() => {
        if (activeCompanyId) {
            fetchBudgets();
        }
    }, [activeCompanyId, year]);

    const fetchBudgets = async () => {
        if (!activeCompanyId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/crm/budgets?year=${year}&companyId=${activeCompanyId}`);
            if (res.ok) {
                const data = await res.json();
                setBudgets(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!newClient || !newAmount || !activeCompanyId) return;
        setAdding(true);
        try {
            const res = await fetch('/api/crm/budgets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingId,
                    year,
                    companyId: activeCompanyId,
                    client: newClient,
                    amount: newAmount
                })
            });

            if (res.ok) {
                toast.success(editingId ? 'Presupuesto actualizado' : 'Presupuesto añadido');
                resetForm();
                fetchBudgets();
            } else {
                toast.error('Error al guardar');
            }
        } catch (e) {
            toast.error('Error al guardar');
        } finally {
            setAdding(false);
        }
    };

    const handleEdit = (b: Budget) => {
        setEditingId(b.id);
        setNewClient(b.client);
        setNewAmount(b.amount.toString());
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta línea de presupuesto?')) return;
        try {
            const res = await fetch(`/api/crm/budgets?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Eliminado');
                fetchBudgets();
            }
        } catch (e) {
            toast.error('Error al eliminar');
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setNewClient('');
        setNewAmount('');
    };

    const totalBudget = budgets.reduce((acc, b) => acc + b.amount, 0);
    const activeCompany = companies.find(c => c.id === activeCompanyId);

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Settings className="text-gray-400" /> Configuración CRM
                </h1>
                <p style={{ color: '#64748b' }}>
                    Definición de objetivos y presupuestos de venta por empresa y cliente.
                </p>
            </div>

            {/* Company Tabs */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '0', borderBottom: '2px solid #e2e8f0' }}>
                {companies.map(company => (
                    <button
                        key={company.id}
                        onClick={() => {
                            setActiveCompanyId(company.id);
                            resetForm();
                        }}
                        style={{
                            padding: '12px 24px',
                            background: activeCompanyId === company.id ? 'white' : 'transparent',
                            border: 'none',
                            borderBottom: activeCompanyId === company.id ? `3px solid ${company.color || '#3b82f6'}` : '3px solid transparent',
                            marginBottom: '-2px',
                            cursor: 'pointer',
                            fontWeight: activeCompanyId === company.id ? 700 : 500,
                            color: activeCompanyId === company.id ? (company.color || '#3b82f6') : '#64748b',
                            fontSize: '0.95rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        {company.name}
                    </button>
                ))}
            </div>

            {/* Content Panel */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '0 0 12px 12px', border: '1px solid #e2e8f0', borderTop: 'none' }}>

                {/* Year Selector + Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: `${activeCompany?.color || '#3b82f6'}20`, padding: '10px', borderRadius: '50%' }}>
                            <TrendingUp size={24} style={{ color: activeCompany?.color || '#3b82f6' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Presupuesto {activeCompany?.name} {year}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(totalBudget)}</div>
                        </div>
                    </div>
                    <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                </div>

                {/* Add/Edit Form */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', marginBottom: '2rem', alignItems: 'end',
                    background: editingId ? '#eff6ff' : '#f1f5f9',
                    padding: '1rem', borderRadius: '8px',
                    border: editingId ? '1px solid #3b82f6' : '1px solid transparent',
                    transition: 'all 0.3s'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Cliente / Concepto</label>
                        <ClientSelect
                            value={newClient}
                            onChange={setNewClient}
                            placeholder="Nombre del Cliente o 'VARIOS'"
                            allowCustom={true}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Importe (€)</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={newAmount}
                            onChange={e => setNewAmount(e.target.value)}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={handleSave}
                            disabled={adding || !newClient || !newAmount}
                            style={{
                                padding: '8px 16px', borderRadius: '6px',
                                background: editingId ? '#3b82f6' : (activeCompany?.color || '#0f172a'), color: 'white',
                                border: 'none', cursor: 'pointer', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '6px',
                                height: '40px'
                            }}
                        >
                            {editingId ? <Save size={18} /> : <Plus size={18} />}
                            {editingId ? 'Actualizar' : 'Añadir'}
                        </button>
                        {editingId && (
                            <button
                                onClick={resetForm}
                                style={{
                                    padding: '8px', borderRadius: '6px',
                                    background: '#fee2e2', color: '#dc2626',
                                    border: 'none', cursor: 'pointer',
                                    height: '40px', display: 'flex', alignItems: 'center'
                                }}
                                title="Cancelar Edición"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Budget Table */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Cliente</th>
                                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Presupuesto</th>
                                <th style={{ width: '100px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {budgets.map(b => (
                                <tr key={b.id} style={{ borderTop: '1px solid #e2e8f0', background: editingId === b.id ? '#f0f9ff' : 'white' }}>
                                    <td style={{ padding: '12px 16px', color: '#334155', fontWeight: 500 }}>{b.client}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#334155' }}>{formatCurrency(b.amount)}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => handleEdit(b)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '4px' }}
                                                title="Editar"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(b.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {budgets.length === 0 && (
                                <tr>
                                    <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                        No hay presupuestos definidos para {activeCompany?.name} en {year}.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
