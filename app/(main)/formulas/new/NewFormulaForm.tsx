'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createFormula, getClients } from '../actions';
import { toast } from 'sonner';
import { Save, ArrowLeft, Trash, Factory, Briefcase, Check } from 'lucide-react';
import Link from 'next/link';

export default function NewFormulaForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [clients, setClients] = useState<{ id: string, name: string }[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        category: 'Facial',
        description: '',
        status: 'Active',
        ownership: 'PROPIA' as 'PROPIA' | 'CLIENTE',
        clientIds: [] as string[]
    });

    const [ingredients, setIngredients] = useState<any[]>([]);

    useEffect(() => {
        const fetchClients = async () => {
            const res = await getClients();
            if (res.success && res.clients) {
                setClients(res.clients);
            }
        };
        fetchClients();
    }, []);

    const categories = ['Facial', 'Corporal', 'Capilar', 'Solar', 'Higienizante', 'Perfume', 'Ambientación'];

    const handleAddIngredient = () => {
        setIngredients([...ingredients, { name: '', percentage: 0, phase: 'A', suppliers: '' }]);
    };

    const handleRemoveIngredient = (index: number) => {
        const newIngs = [...ingredients];
        newIngs.splice(index, 1);
        setIngredients(newIngs);
    };

    const handleIngredientChange = (index: number, field: string, value: any) => {
        const newIngs = [...ingredients];
        newIngs[index] = { ...newIngs[index], [field]: value };
        setIngredients(newIngs);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        if (formData.ownership === 'CLIENTE' && formData.clientIds.length === 0) {
            toast.error('Debes seleccionar un cliente propietario');
            return;
        }

        setIsLoading(true);

        const payload = {
            ...formData,
            ingredients: JSON.stringify(ingredients)
        };

        const res = await createFormula(payload);

        if (res.success && res.formulaId) {
            toast.success('Fórmula creada correctamente');
            router.push(`/formulas/${res.formulaId}`);
            router.refresh();
        } else {
            toast.error('Error al crear la fórmula');
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/formulas" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', marginBottom: '1rem' }}>
                    <ArrowLeft size={16} /> Cancelar y volver
                </Link>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b' }}>Nueva Fórmula</h1>
            </div>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Ownership Section */}
                <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>Propiedad y Asociación</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, ownership: 'PROPIA', clientIds: [] })}
                                style={{
                                    flex: 1, padding: '1rem', borderRadius: '8px',
                                    border: formData.ownership === 'PROPIA' ? '2px solid var(--color-primary)' : '1px solid #e2e8f0',
                                    background: formData.ownership === 'PROPIA' ? '#eff6ff' : 'white', // light blue bg
                                    color: formData.ownership === 'PROPIA' ? 'var(--color-primary)' : '#64748b',
                                    fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <Factory size={24} />
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '1rem' }}>Fórmula Propia</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 400 }}>Desarrollo interno</div>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, ownership: 'CLIENTE', clientIds: [] })}
                                style={{
                                    flex: 1, padding: '1rem', borderRadius: '8px',
                                    border: formData.ownership === 'CLIENTE' ? '2px solid var(--color-primary)' : '1px solid #e2e8f0',
                                    background: formData.ownership === 'CLIENTE' ? '#eff6ff' : 'white',
                                    color: formData.ownership === 'CLIENTE' ? 'var(--color-primary)' : '#64748b',
                                    fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <Briefcase size={24} />
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '1rem' }}>Fórmula de Cliente</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 400 }}>Pertenece a un tercero</div>
                                </div>
                            </button>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                                {formData.ownership === 'CLIENTE' ? 'Cliente Propietario *' : 'Clientes Asociados (Opcional)'}
                            </label>
                            {formData.ownership === 'CLIENTE' ? (
                                <select
                                    value={formData.clientIds[0] || ''}
                                    required
                                    onChange={e => setFormData({ ...formData, clientIds: [e.target.value] })}
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white'
                                    }}
                                >
                                    <option value="">Seleccionar Cliente...</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            ) : (
                                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.5rem' }}>
                                    {clients.length === 0 ? <div style={{ padding: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>No hay clientes activos</div> :
                                        clients.map(c => {
                                            const isSelected = formData.clientIds.includes(c.id);
                                            return (
                                                <div
                                                    key={c.id}
                                                    onClick={() => {
                                                        const newIds = isSelected
                                                            ? formData.clientIds.filter(id => id !== c.id)
                                                            : [...formData.clientIds, c.id];
                                                        setFormData({ ...formData, clientIds: newIds });
                                                    }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem',
                                                        cursor: 'pointer', borderRadius: '6px',
                                                        background: isSelected ? '#f0fdfa' : 'transparent',
                                                        marginBottom: '2px'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '18px', height: '18px', borderRadius: '4px', border: isSelected ? '1px solid var(--color-primary)' : '1px solid #cbd5e1',
                                                        background: isSelected ? 'var(--color-primary)' : 'white',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        {isSelected && <Check size={14} color="white" />}
                                                    </div>
                                                    <span style={{ fontSize: '0.95rem', color: isSelected ? '#0f766e' : '#334155', fontWeight: isSelected ? 500 : 400 }}>{c.name}</span>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Meta Data */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Nombre de la Fórmula *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Crema Hidratante Anti-edad"
                            style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Estado Inicial</label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                            style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                        >
                            <option value="Active">Activa</option>
                            <option value="Draft">Borrador</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Categoría</label>
                    <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Descripción</label>
                    <textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descripción opcional..."
                        style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', minHeight: '80px' }}
                    />
                </div>

                {/* Ingredients Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Composición Inicial (Opcional)</label>
                        <button type="button" onClick={handleAddIngredient} style={{ fontSize: '0.85rem', color: '#0f766e', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}>+ Añadir Ingrediente</button>
                    </div>

                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem', color: '#64748b' }}>Fase</th>
                                    <th style={{ padding: '0.75rem', color: '#64748b', width: '40%' }}>Ingrediente (INCI/Comercial)</th>
                                    <th style={{ padding: '0.75rem', color: '#64748b' }}>%</th>
                                    <th style={{ padding: '0.75rem', color: '#64748b', width: '25%' }}>Proveedores</th>
                                    <th style={{ padding: '0.75rem', color: '#64748b' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {ingredients.map((ing, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '0.5rem' }}>
                                            <input
                                                type="text"
                                                value={ing.phase}
                                                onChange={e => handleIngredientChange(i, 'phase', e.target.value)}
                                                style={{ width: '40px', padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center' }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <input
                                                type="text"
                                                value={ing.name}
                                                onChange={e => handleIngredientChange(i, 'name', e.target.value)}
                                                style={{ width: '100%', padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={ing.percentage}
                                                onChange={e => handleIngredientChange(i, 'percentage', parseFloat(e.target.value) || 0)}
                                                style={{ width: '60px', padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'right' }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <input
                                                type="text"
                                                value={ing.suppliers || ''}
                                                onChange={e => handleIngredientChange(i, 'suppliers', e.target.value)}
                                                placeholder="Prov A, Prov B..."
                                                style={{ width: '100%', padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveIngredient(i)}
                                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {ingredients.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Sin ingredientes definidos inicialmente.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            background: 'var(--color-primary)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px',
                            border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                            boxShadow: 'var(--shadow-md)'
                        }}
                    >
                        <Save size={18} /> {isLoading ? 'Creando Fórmula...' : 'Crear Fórmula'}
                    </button>
                </div>
            </div>
        </form>
    );
}
