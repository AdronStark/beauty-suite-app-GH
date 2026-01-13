'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Trash2, Edit, X, Filter } from 'lucide-react';
import { toast } from 'sonner';

type SortKey = 'code' | 'name' | 'category' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface Formula {
    id: string;
    code: string;
    name: string;
    category: string;
    revision: number;
    description: string;
    ingredients: string; // JSON string
    status: string;
    createdAt: Date | string;
    ownership?: string;
    clients?: { name: string }[];
    revisionCount?: number;
}

interface FormulaTableProps {
    formulas: Formula[];
}

export default function FormulaTable({ formulas }: FormulaTableProps) {
    const router = useRouter();
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'createdAt', direction: 'desc' });
    const [filterQuery, setFilterQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Derived state for categories
    const categories = Array.from(new Set(formulas.map(f => f.category))).sort();

    const handleSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta fórmula? Esta acción no se puede deshacer.')) return;

        setIsDeleting(id);
        try {
            const res = await fetch(`/api/formulas/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al eliminar');

            toast.success('Fórmula eliminada correctamente');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('No se pudo eliminar la fórmula');
        } finally {
            setIsDeleting(null);
        }
    };

    // Bulk Actions
    const handleSelectAll = (visibleIds: string[]) => {
        if (selectedIds.size === visibleIds.length) {
            setSelectedIds(new Set()); // Deselect all
        } else {
            setSelectedIds(new Set(visibleIds)); // Select all visible
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedIds.size} fórmulas seleccionadas?`)) return;

        setIsBulkDeleting(true);
        try {
            const res = await fetch('/api/formulas/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });

            if (res.ok) {
                setSelectedIds(new Set());
                router.refresh();
                toast.success("Fórmulas eliminadas correctamente.");
            } else {
                toast.error("Error al eliminar fórmulas.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión.");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const filteredFormulas = formulas.filter(f => {
        const query = filterQuery.toLowerCase();
        const matchesSearch =
            (f.name || '').toLowerCase().includes(query) ||
            (f.code || '').toLowerCase().includes(query) ||
            (f.clients || []).some(c => (c.name || '').toLowerCase().includes(query));
        const matchesCategory = selectedCategory === 'ALL' || f.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const sortedFormulas = [...filteredFormulas].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let valA: any = a[key as keyof Formula];
        let valB: any = b[key as keyof Formula];

        if (key === 'createdAt') {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
        } else if (typeof valA === 'string' || typeof valB === 'string') {
            valA = (valA || '').toString().toLowerCase();
            valB = (valB || '').toString().toLowerCase();
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortConfig?.key !== column) return <ArrowUpDown size={14} style={{ opacity: 0.3, marginLeft: '5px' }} />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} style={{ marginLeft: '5px' }} />
            : <ArrowDown size={14} style={{ marginLeft: '5px' }} />;
    };

    // Color helpers
    const getCategoryColor = (cat: string) => {
        const map: Record<string, string> = {
            'Facial': '#3b82f6',
            'Corporal': '#a855f7',
            'Capilar': '#ec4899',
            'Solar': '#f59e0b',
            'Higienizante': '#10b981'
        };
        return map[cat] || '#64748b';
    };

    const visibleIds = sortedFormulas.map(f => f.id);

    return (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, código o cliente..."
                        value={filterQuery}
                        onChange={e => setFilterQuery(e.target.value)}
                        style={{
                            width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.2rem',
                            borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Filter size={16} color="#64748b" />
                    <select
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#475569' }}
                    >
                        <option value="ALL">Todas las Categorías</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Bulk Actions Header */}
            {selectedIds.size > 0 && (
                <div style={{
                    padding: '0.75rem 1rem', background: '#fef2f2', borderBottom: '1px solid #fee2e2',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#991b1b'
                }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {selectedIds.size} seleccionadas
                    </span>
                    <button
                        onClick={handleBulkDelete}
                        disabled={isBulkDeleting}
                        style={{
                            background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem',
                            borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            opacity: isBulkDeleting ? 0.7 : 1
                        }}
                    >
                        <Trash2 size={16} />
                        {isBulkDeleting ? 'Eliminando...' : 'Eliminar Selección'}
                    </button>
                </div>
            )}

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead style={{ background: '#f8fafc', color: '#475569', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>
                        <tr>
                            <th style={{ width: '40px', textAlign: 'center', padding: '0.75rem 1rem' }}>
                                <input
                                    type="checkbox"
                                    checked={visibleIds.length > 0 && selectedIds.size === visibleIds.length}
                                    onChange={() => handleSelectAll(visibleIds)}
                                    style={{ cursor: 'pointer' }}
                                />
                            </th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('code')}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>Código <SortIcon column="code" /></div>
                            </th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>Nombre <SortIcon column="name" /></div>
                            </th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Revisiones</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Ingredientes</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Cliente</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Propiedad</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>Creado <SortIcon column="createdAt" /></div>
                            </th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedFormulas.length === 0 ? (
                            <tr>
                                <td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                    No se encontraron fórmulas
                                </td>
                            </tr>
                        ) : (
                            sortedFormulas.map(formula => {
                                let ingCount = 0;
                                try { ingCount = JSON.parse(formula.ingredients).length; } catch (e) { }

                                return (
                                    <tr key={formula.id} style={{ borderBottom: '1px solid #f1f5f9', background: selectedIds.has(formula.id) ? '#fef2f2' : 'white' }}>
                                        <td style={{ width: '40px', textAlign: 'center', padding: '0.75rem 1rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(formula.id)}
                                                onChange={() => toggleSelection(formula.id)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#334155' }}>
                                            {formula.code}
                                            <span style={{ marginLeft: '4px', fontSize: '0.8em', color: '#94a3b8' }}>REV{formula.revision}</span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ fontWeight: 500, color: '#0f172a' }}>{formula.name}</div>
                                            <div style={{ fontSize: '0.8em', color: '#94a3b8', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {formula.description}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                                            {formula.revisionCount || 1}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#64748b' }}>
                                            {ingCount}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', color: '#475569', fontSize: '0.85rem' }}>
                                            {formula.clients && formula.clients.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    {formula.clients.map((c, idx) => (
                                                        <span key={idx} style={{ lineHeight: 1.2 }}>{c.name}</span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>-</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            {formula.ownership === 'CLIENTE' ? (
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: '4px' }}>CLIENTE</span>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f766e', background: '#f0fdf4', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>PROPIA</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                                            {new Date(formula.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <Link
                                                    href={`/formulas/${formula.id}`}
                                                    style={{
                                                        padding: '6px', borderRadius: '6px', color: '#3b82f6',
                                                        background: '#eff6ff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center'
                                                    }}
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(formula.id)}
                                                    disabled={isDeleting === formula.id}
                                                    style={{
                                                        padding: '6px', borderRadius: '6px', color: '#ef4444',
                                                        background: '#fef2f2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                        opacity: isDeleting === formula.id ? 0.5 : 1
                                                    }}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
