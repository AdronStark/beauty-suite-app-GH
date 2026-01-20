'use client';

import { useState, useEffect } from 'react';
import { Search, Package, Plus } from 'lucide-react';

interface ProductLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (template: any) => void;
    onCreateNew: () => void;
}

export default function ProductLibraryModal({ isOpen, onClose, onSelect, onCreateNew }: ProductLibraryModalProps) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/ofertas/templates');
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)'
        }}>
            <div style={{ background: 'white', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Añadir Producto</h2>
                    <button onClick={onClose} style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                </div>

                {/* Search */}
                <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Buscar en biblioteca..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem' }}
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>

                    {/* Option 1: New Empty */}
                    <div
                        onClick={onCreateNew}
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '8px', border: '2px dashed #cbd5e1', cursor: 'pointer', marginBottom: '1rem', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                    >
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                            <Plus size={24} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '1rem' }}>Crear Nuevo Producto desde Cero</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Empezar con una configuración vacía</div>
                        </div>
                    </div>

                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Biblioteca</div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Cargando...</div>
                    ) : (
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {filtered.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => onSelect(t)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', background: 'white' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                >
                                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t.name}</div>
                                        {t.category && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t.category}</div>}
                                    </div>
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                    No se encontraron productos en la biblioteca.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
