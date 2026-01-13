import { useState, useMemo } from 'react';
import { Search, Weight, Calendar, Users, Zap } from 'lucide-react';
import styles from './PendingQueue.module.css';
import { ProductionBlock } from '@/lib/planner-types';

interface PendingQueueProps {
    blocks: ProductionBlock[];
    onSelect: (id: string | null) => void;
    selectedId: string | null;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onAutoPlan?: () => void;
    onSplit?: (id: string, units: number) => void;
}

export default function PendingQueue({ blocks, onSelect, selectedId, searchTerm, onSearchChange, onAutoPlan, onSplit }: PendingQueueProps) {
    const [sortBy, setSortBy] = useState<'kg' | 'date' | 'client'>('date');


    // Sort blocks
    const sortedBlocks = useMemo(() => {
        return [...blocks].sort((a: any, b: any) => {
            if (sortBy === 'kg') {
                return b.units - a.units; // Descending
            } else if (sortBy === 'date') {
                // Ascending (Near deadline first)
                // Handle null deadlines: put them last
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
            } else if (sortBy === 'client') {
                return (a.clientName || '').localeCompare(b.clientName || '');
            }
            return 0;
        });
    }, [blocks, sortBy]);


    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ margin: 0 }}>Pendientes ({blocks.length})</h3>
                        {onAutoPlan && (
                            <button
                                onClick={onAutoPlan}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white',
                                    border: 'none', padding: '3px 8px', borderRadius: '4px',
                                    fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem',
                                    boxShadow: '0 1px 2px rgba(79, 70, 229, 0.2)'
                                }}
                                title="Auto-Planificar bloques visibles"
                            >
                                <Zap size={14} /> Auto
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                            title="Ordenar por Fecha (Urgencia)"
                            onClick={() => setSortBy('date')}
                            style={{
                                background: sortBy === 'date' ? '#e0e7ff' : 'transparent',
                                color: sortBy === 'date' ? '#4f46e5' : '#64748b',
                                border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px', cursor: 'pointer'
                            }}
                        >
                            <Calendar size={14} />
                        </button>
                        <button
                            title="Ordenar por Kgs (Desc)"
                            onClick={() => setSortBy('kg')}
                            style={{
                                background: sortBy === 'kg' ? '#e0e7ff' : 'transparent',
                                color: sortBy === 'kg' ? '#4f46e5' : '#64748b',
                                border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px', cursor: 'pointer'
                            }}
                        >
                            <Weight size={14} />
                        </button>
                        <button
                            title="Ordenar por Cliente"
                            onClick={() => setSortBy('client')}
                            style={{
                                background: sortBy === 'client' ? '#e0e7ff' : 'transparent',
                                color: sortBy === 'client' ? '#4f46e5' : '#64748b',
                                border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px', cursor: 'pointer'
                            }}
                        >
                            <Users size={14} />
                        </button>
                    </div>
                </div>
                <div className={styles.search}>
                    <Search size={16} />
                    <input
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)}
                    />
                </div>
            </div>
            <div className={styles.list}>
                {sortedBlocks.map((b: any) => {
                    const isSelected = selectedId === b.id;
                    const canSplit = b.units > 2000;

                    return (
                        <div
                            key={b.id}
                            className={styles.card}
                            data-selected={isSelected}
                            onClick={() => onSelect(isSelected ? null : b.id)}
                            style={{
                                cursor: 'pointer',
                                border: isSelected ? '2px solid #6366f1' : '1px solid #e2e8f0',
                                position: 'relative'
                            }}
                        >
                            <div className={styles.cardRow}>
                                <span className={styles.code}>{b.articleCode}</span>
                                <span className={styles.units}>{b.units}kg</span>
                            </div>
                            <div className={styles.cardRow} style={{ justifyContent: 'flex-start', gap: '8px', marginBottom: '2px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>#{b.orderNumber}</span>
                                {b.deadline && (
                                    (() => {
                                        const days = Math.ceil((new Date(b.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                        const isUrgent = days < 20;
                                        return (
                                            <span style={{
                                                fontSize: '0.7rem',
                                                color: isUrgent ? '#dc2626' : '#64748b',
                                                background: isUrgent ? '#fee2e2' : '#f1f5f9',
                                                padding: '0 4px', borderRadius: '4px',
                                                fontWeight: isUrgent ? 600 : 400
                                            }}>
                                                {new Date(b.deadline).toLocaleDateString()}
                                            </span>
                                        );
                                    })()
                                )}
                            </div>
                            <div className={styles.desc} title={b.articleDesc}>{b.articleDesc}</div>
                            <div className={styles.client}>{b.clientName}</div>

                            {/* Acciones Contextuales */}
                            {isSelected && canSplit && onSplit && (
                                <div style={{ marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSplit(b.id, b.units);
                                        }}
                                        style={{
                                            width: '100%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                            background: '#fffbeb', color: '#d97706',
                                            border: '1px solid #fcd34d', borderRadius: '4px',
                                            padding: '4px', fontSize: '0.75rem', fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ✂️ Dividir en lotes ({Math.ceil(b.units / 2000)})
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
