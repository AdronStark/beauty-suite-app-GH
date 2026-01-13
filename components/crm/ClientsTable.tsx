'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Users, Search, ArrowRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface ClientData {
    name: string;
    totalOffers: number;
    totalSpent: number;
    activeDeals: number;
    wonDeals: number;
    lostDeals: number;
    lastActivity: string; // Serialized date
}

interface ClientsTableProps {
    clients: ClientData[];
}

type SortConfig = {
    key: keyof ClientData | 'winRate';
    direction: 'asc' | 'desc';
} | null;

export default function ClientsTable({ clients }: ClientsTableProps) {
    const [filterText, setFilterText] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'lastActivity', direction: 'desc' });

    const handleSort = (key: keyof ClientData | 'winRate') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredAndSortedClients = useMemo(() => {
        let result = [...clients];

        // 1. Filter
        if (filterText.trim()) {
            const lowerFilter = filterText.toLowerCase();
            result = result.filter(c => c.name.toLowerCase().includes(lowerFilter));
        }

        // 2. Sort
        if (sortConfig) {
            result.sort((a, b) => {
                let aValue: any = a[sortConfig.key as keyof ClientData];
                let bValue: any = b[sortConfig.key as keyof ClientData];

                // Special handling for calculated Win Rate
                if (sortConfig.key === 'winRate') {
                    const aClosed = a.wonDeals + a.lostDeals;
                    aValue = aClosed > 0 ? (a.wonDeals / aClosed) : 0;

                    const bClosed = b.wonDeals + b.lostDeals;
                    bValue = bClosed > 0 ? (b.wonDeals / bClosed) : 0;
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [clients, filterText, sortConfig]);

    const Th = ({ label, sortKey, width }: { label: string, sortKey?: keyof ClientData | 'winRate', width?: string }) => (
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
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
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
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    Mostrando {filteredAndSortedClients.length} clientes
                </div>
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <Th label="Cliente" sortKey="name" />
                            <Th label="Ventas Acumuladas" sortKey="totalSpent" />
                            <Th label="Ofertas Activas" sortKey="activeDeals" />
                            <Th label="Tasa Cierre" sortKey="winRate" />
                            <Th label="Última Actividad" sortKey="lastActivity" />
                            <Th label="Acciones" />
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedClients.map(client => {
                            const totalClosed = client.wonDeals + client.lostDeals;
                            const winRate = totalClosed > 0 ? Math.round((client.wonDeals / totalClosed) * 100) : 0;

                            return (
                                <tr key={client.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600, color: '#0f172a' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '32px', height: '32px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                                <Users size={16} />
                                            </div>
                                            {client.name}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 600, color: '#10b981' }}>
                                        {formatCurrency(client.totalSpent, 0)} €
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {client.activeDeals > 0 ? (
                                            <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                {client.activeDeals} en curso
                                            </span>
                                        ) : (
                                            <span style={{ color: '#94a3b8' }}>-</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', color: '#64748b' }}>
                                        {winRate}%
                                    </td>
                                    <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                                        {new Date(client.lastActivity).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <Link
                                            href={`/crm/clients/${encodeURIComponent(client.name)}`}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}
                                        >
                                            Ver Ficha <ArrowRight size={16} />
                                        </Link>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {filteredAndSortedClients.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                        No se encontraron clientes.
                    </div>
                )}
            </div>
        </div>
    );
}
