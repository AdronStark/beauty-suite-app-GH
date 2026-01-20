'use client';

import { useState, useMemo } from 'react';
import PipelineRow from './PipelineRow';
import { Filter, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface PipelineTableProps {
    offers: any[];
}

type SortConfig = {
    key: string;
    direction: 'asc' | 'desc';
} | null;

export default function PipelineTable({ offers }: PipelineTableProps) {
    const [filterText, setFilterText] = useState('');
    const [hideInactive, setHideInactive] = useState(true); // Default: show only active
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'updatedAt', direction: 'desc' });

    // -- Helpers --
    const getNestedValue = (obj: any, key: string) => {
        if (key === 'value') {
            try {
                const summary = JSON.parse(obj.resultsSummary || '{}');
                return parseFloat(summary.totalValue || '0');
            } catch { return 0; }
        }
        return obj[key];
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // -- Filtering & Sorting --
    const filteredAndSortedOffers = useMemo(() => {
        let result = [...offers];

        // 1. Filter by Text
        if (filterText.trim()) {
            const lowerFilter = filterText.toLowerCase();
            result = result.filter(o =>
                (o.client || '').toLowerCase().includes(lowerFilter) ||
                (o.product || '').toLowerCase().includes(lowerFilter) ||
                (o.code || '').toLowerCase().includes(lowerFilter)
            );
        }

        // 2. Filter Inactive (Adjudicada / Rechazada)
        if (hideInactive) {
            result = result.filter(o => !['Adjudicada', 'Rechazada', 'Aceptada', 'Perdida'].includes(o.status));
        }

        // 3. Sort
        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = getNestedValue(a, sortConfig.key);
                const bValue = getNestedValue(b, sortConfig.key);

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [offers, filterText, hideInactive, sortConfig]);

    const activeCount = filteredAndSortedOffers.length;

    // Table Header Component
    const Th = ({ label, sortKey, width }: { label: string, sortKey?: string, width?: string }) => (
        <th
            style={{
                padding: '1rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#64748b',
                textTransform: 'uppercase',
                cursor: sortKey ? 'pointer' : 'default',
                width: width,
                userSelect: 'none'
            }}
            onClick={() => sortKey && handleSort(sortKey)}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {label}
                {sortKey && sortConfig?.key === sortKey && (
                    sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                )}
                {sortKey && sortConfig?.key !== sortKey && <ArrowUpDown size={14} style={{ opacity: 0.3 }} />}
            </div>
        </th>
    );

    return (
        <div>
            {/* Toolbar */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, proyecto..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.6rem 1rem 0.6rem 2.2rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#475569', userSelect: 'none' }}>
                        <input
                            type="checkbox"
                            checked={hideInactive}
                            onChange={(e) => setHideInactive(e.target.checked)}
                            style={{ accentColor: 'var(--color-primary)' }}
                        />
                        Ocultar Cerradas (Ganadas/Perdidas)
                    </label>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px' }}>
                        {activeCount} registros
                    </div>
                </div>
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <Th label="Código" sortKey="code" />
                            <Th label="Cliente" sortKey="client" />
                            <Th label="Proyecto" sortKey="product" />
                            <Th label="Valor" sortKey="value" />
                            <Th label="Probabilidad" sortKey="probability" />
                            <Th label="Estado" sortKey="status" />
                            <Th label="Ult. Actividad" sortKey="updatedAt" />
                            <Th label="Antigüedad" sortKey="createdAt" />
                            <Th label="Acciones" />
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedOffers.map(offer => (
                            <PipelineRow key={offer.id} offer={offer} />
                        ))}
                    </tbody>
                </table>
                {filteredAndSortedOffers.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                        {offers.length === 0 ? "No hay ofertas en el sistema." : "No hay ofertas que coincidan con los filtros."}
                    </div>
                )}
            </div>
        </div>
    );
}
