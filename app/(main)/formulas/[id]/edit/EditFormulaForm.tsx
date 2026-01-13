'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateFormula, getClients } from '../../actions';
import { toast } from 'sonner';
import { Save, ArrowLeft, Trash, Factory, Briefcase, Check } from 'lucide-react';
import Link from 'next/link';

export default function EditFormulaForm({ formula }: { formula: any }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Parse initial ingredients
    const initialIngredients = (() => {
        try {
            return JSON.parse(formula.ingredients || '[]');
        } catch {
            return [];
        }
    })();

    const [formData, setFormData] = useState({
        name: formula.name,
        category: formula.category || '',
        description: formula.description || '',
        status: formula.status,
        ownership: formula.ownership || 'PROPIA',
    });

    const [availableClients, setAvailableClients] = useState<any[]>([]);
    const [selectedClients, setSelectedClients] = useState<string[]>(
        formula.clients ? formula.clients.map((c: any) => c.id) : []
    );

    useEffect(() => {
        const loadClients = async () => {
            const res = await getClients();
            if (res.success && res.clients) {
                setAvailableClients(res.clients);
            }
        };
        loadClients();
    }, []);

    const [ingredients, setIngredients] = useState<any[]>(initialIngredients);

    const categories = ['Facial', 'Corporal', 'Capilar', 'Solar', 'Higienizante', 'General'];

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
        setIsLoading(true);

        const payload = {
            ...formData,
            ownership: formData.ownership,
            clientIds: selectedClients,
            ingredients: JSON.stringify(ingredients)
        };

        const res = await updateFormula(formula.id, payload);

        if (res.success) {
            toast.success('Fórmula actualizada correctamente');
            router.refresh();
        } else {
            toast.error('Error al actualizar');
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 2rem' }}>
            {/* Fixed Sub-Header */}
            <div style={{
                position: 'fixed', top: 'var(--header-height)', left: 0, right: 0, zIndex: 40,
                background: '#fafaf9',
                borderBottom: '1px solid var(--color-border)',
                height: '80px', // Explicit height for layout calculations
                display: 'flex', alignItems: 'center'
            }}>
                <div style={{
                    width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '0 2rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <Link href={`/formulas/${formula.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                            <ArrowLeft size={16} /> Volver a ficha
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1 }}>
                                {formula.code}
                            </h1>
                            <span style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 500 }}>
                                Rev. {formula.revision}
                            </span>
                        </div>
                    </div>
                    <button
                        type="submit"
                        form="edit-formula-form"
                        disabled={isLoading}
                        style={{
                            background: 'var(--color-primary)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px',
                            border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                            boxShadow: '0 2px 4px rgba(62, 106, 216, 0.2)'
                        }}
                    >
                        <Save size={18} /> {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>

            {/* Form Container with top padding to account for fixed header (80px + spacing) */}
            <form id="edit-formula-form" onSubmit={handleSubmit} style={{ paddingBottom: '4rem', paddingTop: '100px' }}>
                <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Meta Data */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Nombre</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Estado</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                            >
                                <option value="Active">Activa</option>
                                <option value="Inactive">Inactiva</option>
                                <option value="Draft">Borrador</option>
                            </select>
                        </div>
                    </div>

                    {/* Ownership Selection */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Propiedad de la Fórmula</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div
                                onClick={() => {
                                    setFormData({ ...formData, ownership: 'PROPIA' });
                                    setSelectedClients([]); // Reset clients when switching to Propia initially? Or keep? Let's keep for multi-assign.
                                }}
                                style={{
                                    flex: 1, padding: '1rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                                    border: formData.ownership === 'PROPIA' ? '2px solid #0f766e' : '1px solid #e2e8f0',
                                    background: formData.ownership === 'PROPIA' ? '#f0fdfa' : 'white',
                                    display: 'flex', alignItems: 'center', gap: '0.75rem'
                                }}
                            >
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: formData.ownership === 'PROPIA' ? '#ccfbf1' : '#f1f5f9',
                                    color: formData.ownership === 'PROPIA' ? '#0f766e' : '#64748b'
                                }}>
                                    <Factory size={18} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>Fórmula Propia</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Desarrollada internamente</div>
                                </div>
                                {formData.ownership === 'PROPIA' && <Check size={18} color="#0f766e" style={{ marginLeft: 'auto' }} />}
                            </div>

                            <div
                                onClick={() => {
                                    setFormData({ ...formData, ownership: 'CLIENTE' });
                                    setSelectedClients([]); // Should select only one. Reset for safety.
                                }}
                                style={{
                                    flex: 1, padding: '1rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                                    border: formData.ownership === 'CLIENTE' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                    background: formData.ownership === 'CLIENTE' ? '#eff6ff' : 'white',
                                    display: 'flex', alignItems: 'center', gap: '0.75rem'
                                }}
                            >
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: formData.ownership === 'CLIENTE' ? '#dbeafe' : '#f1f5f9',
                                    color: formData.ownership === 'CLIENTE' ? '#2563eb' : '#64748b'
                                }}>
                                    <Briefcase size={18} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>Propiedad de Cliente</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Pertenece a un tercero</div>
                                </div>
                                {formData.ownership === 'CLIENTE' && <Check size={18} color="#2563eb" style={{ marginLeft: 'auto' }} />}
                            </div>
                        </div>
                    </div>

                    {/* Client Selection */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>
                            {formData.ownership === 'PROPIA'
                                ? 'Asociar a Clientes (Opcional)'
                                : 'Cliente Propietario (Requerido)'}
                        </label>

                        {formData.ownership === 'CLIENTE' ? (
                            /* Single Select for Client Ownership */
                            <select
                                value={selectedClients[0] || ''}
                                onChange={(e) => setSelectedClients(e.target.value ? [e.target.value] : [])}
                                style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white' }}
                                required
                            >
                                <option value="">Seleccionar Cliente...</option>
                                {availableClients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        ) : (
                            /* Multi Select for Owned Formulas */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <select
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value && !selectedClients.includes(e.target.value)) {
                                            setSelectedClients([...selectedClients, e.target.value]);
                                        }
                                    }}
                                    style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white' }}
                                >
                                    <option value="">+ Añadir cliente asociado...</option>
                                    {availableClients
                                        .filter(c => !selectedClients.includes(c.id))
                                        .map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                </select>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: '32px' }}>
                                    {selectedClients.map(clientId => {
                                        const client = availableClients.find(c => c.id === clientId);
                                        if (!client) return null;
                                        return (
                                            <div
                                                key={client.id}
                                                style={{
                                                    padding: '4px 8px 4px 12px', borderRadius: '16px', fontSize: '0.85rem',
                                                    background: '#f0fdfa', color: '#0f766e', border: '1px solid #99f6e4',
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                                                }}
                                            >
                                                {client.name}
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedClients(selectedClients.filter(id => id !== client.id))}
                                                    style={{
                                                        background: 'transparent', border: 'none', color: '#0f766e', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', padding: '2px', opacity: 0.7
                                                    }}
                                                >
                                                    <div style={{ fontSize: '14px', lineHeight: 1 }}>×</div>
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {selectedClients.length === 0 && (
                                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', padding: '0.25rem' }}>
                                            Ningún cliente asociado.
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
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
                            style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', minHeight: '80px' }}
                        />
                    </div>

                    {/* Ingredients Table */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Composición</label>
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
                                            <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No hay ingredientes. Añade uno.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </form>
        </div>
    );
}
