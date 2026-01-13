'use strict';
'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, ArrowUp, ArrowDown, ArrowUpDown, Package } from 'lucide-react';
import ProjectTimeline from '@/app/portal/dashboard/ProjectTimeline';

interface ProjectsListClientProps {
    briefings: any[];
}

export default function ProjectsListClient({ briefings }: ProjectsListClientProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

    const toggleSort = () => {
        if (sortOrder === null) setSortOrder('asc'); // Oldest first (based on logic of date sort usually, but let's check Orders implementation)
        // Orders: asc = dateA - dateB. If date is deadline ("future"), asc means closest date first? 
        // For Projects, "Date" usually refers to UpdatedAt. 
        // Asc: Older dates first. Desc: Newer (recent) first.
        else if (sortOrder === 'asc') setSortOrder('desc');
        else setSortOrder(null);
    };

    const filteredBriefings = useMemo(() => {
        let result = briefings.filter(b => {
            // Search
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                (b.productName || '').toLowerCase().includes(searchLower) ||
                (b.code || '').toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;

            // Status Filter via logic
            // Completed statuses: 'Completado', 'Adjudicada', 'Rechazada'?
            // Let's assume 'active' is anything NOT 'Completado' or 'Cancelado'.
            const isCompleted = b.status === 'Completado' || b.status === 'Cancelado';

            if (filter === 'active') return !isCompleted;
            if (filter === 'completed') return isCompleted;

            return true;
        });

        // Sorting
        if (sortOrder) {
            result.sort((a, b) => {
                const dateA = new Date(a.updatedAt).getTime();
                const dateB = new Date(b.updatedAt).getTime();

                // Desc: Newest first (standard default). Asc: Oldest first.
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            });
        }

        return result;
    }, [briefings, searchTerm, filter, sortOrder]);

    return (
        <div>
            {/* HEADER & CONTROLS */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-text-heading)', letterSpacing: '-0.025em' }}>
                    Mis Proyectos
                </h1>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Search Bar */}
                    <div style={{ position: 'relative', flexGrow: 1, maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                fontSize: '0.95rem',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {/* Sort Button */}
                        <button
                            onClick={toggleSort}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '0.5rem 1rem',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                background: sortOrder ? 'var(--color-secondary)' : 'white',
                                color: sortOrder ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                fontWeight: 500,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                            title={sortOrder === 'asc' ? 'Fecha (Antiguos primero)' : sortOrder === 'desc' ? 'Fecha (Recientes primero)' : 'Ordenar por fecha'}
                        >
                            {sortOrder === 'asc' ? <ArrowUp size={16} /> : sortOrder === 'desc' ? <ArrowDown size={16} /> : <ArrowUpDown size={16} />}
                            <span className="hidden md:inline">Fecha</span>
                        </button>

                        {/* Filter Tabs */}
                        <div style={{ background: '#f1f5f9', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px' }}>
                            <FilterTab label="En Curso" active={filter === 'active'} onClick={() => setFilter('active')} />
                            <FilterTab label="Completados" active={filter === 'completed'} onClick={() => setFilter('completed')} />
                            <FilterTab label="Todos" active={filter === 'all'} onClick={() => setFilter('all')} />
                        </div>
                    </div>
                </div>
            </div>

            {/* PROJECTS LIST */}
            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {filteredBriefings.length === 0 ? (
                    <div style={{
                        padding: '4rem 2rem',
                        textAlign: 'center',
                        background: 'white',
                        borderRadius: '24px',
                        border: '1px dashed #e2e8f0',
                        color: '#94a3b8'
                    }}>
                        <div style={{ marginBottom: '1rem', display: 'inline-flex', padding: '1rem', background: '#f8fafc', borderRadius: '50%' }}>
                            <Package size={32} color="#cbd5e1" />
                        </div>
                        <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No se encontraron proyectos.</p>
                        <p style={{ fontSize: '0.9rem' }}>Intenta ajustar tus filtros de búsqueda.</p>
                    </div>
                ) : (
                    filteredBriefings.map(b => <ProjectCard key={b.id} briefing={b} />)
                )}
            </div>
        </div>
    );
}

function FilterTab({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: active ? 'white' : 'transparent',
                color: active ? 'var(--color-text-heading)' : 'var(--color-text-muted)',
                fontWeight: active ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
            }}
        >
            {label}
        </button>
    )
}

function ProjectCard({ briefing }: { briefing: any }) {
    return (
        <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.05)',
            transition: 'transform 0.2s, box-shadow 0.2s'
        }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.05)';
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-heading)' }}>{briefing.productName}</h2>
                        {briefing.code && (
                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', fontWeight: 500 }}>
                                {briefing.code}
                            </span>
                        )}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        Actualizado: {new Date(briefing.updatedAt).toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* TIMELINE COMPONENT */}
            <ProjectTimeline briefing={briefing} />
        </div>
    )
}
