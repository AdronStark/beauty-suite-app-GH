'use client';

import { useState, useMemo, Fragment, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, ChevronDown, Filter, X } from 'lucide-react';
import OfferActions from '@/app/(main)/ofertas/OfferActions';
import ResponsibleCell, { UserOption } from '@/components/ofertas/ResponsibleCell';
import { getStatusColor } from '@/lib/statusColors';
import styles from '@/app/(main)/ofertas/page.module.css';
import { formatCurrency } from '@/lib/formatters';

type SortKey = 'code' | 'client' | 'product' | 'status' | 'date';
type SortDirection = 'asc' | 'desc';

interface OfferTableProps {
    offers: any[];
}

export default function OfferTable({ offers }: OfferTableProps) {
    // Default Sort: Code (Nº Oferta) Descending (Newest first)
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'code', direction: 'desc' });
    const [users, setUsers] = useState<UserOption[]>([]);

    useEffect(() => {
        fetch('/api/users')
            .then(res => res.json())
            .then(data => setUsers(Array.isArray(data) ? data : []))
            .catch(err => console.error('Failed to fetch users', err));
    }, []);

    // Filters State
    const [filters, setFilters] = useState<{
        code: string;
        client: string[];
        status: string[];
    }>({
        code: '',
        client: [],
        status: []
    });

    const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setActiveFilterDropdown(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const handleSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleGroup = (code: string) => {
        const newSet = new Set(expandedGroups);
        if (newSet.has(code)) {
            newSet.delete(code);
        } else {
            newSet.add(code);
        }
        setExpandedGroups(newSet);
    };

    // Derived Data for Filters (from ALL offers)
    const uniqueClients = useMemo(() => Array.from(new Set(offers.map(o => o.client).filter(Boolean))).sort(), [offers]);
    const uniqueStatuses = useMemo(() => Array.from(new Set(offers.map(o => o.status).filter(Boolean))).sort(), [offers]);

    const toggleFilter = (type: 'client' | 'status', value: string) => {
        setFilters(prev => {
            const current = prev[type];
            const newValues = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [type]: newValues };
        });
    };

    // Filter Logic -> Grouping Logic
    const groupedOffers = useMemo(() => {
        // 1. Filter Raw Offers
        const filteredRaw = offers.filter(o => {
            // Code Search
            if (filters.code && !o.code?.toLowerCase().includes(filters.code.toLowerCase())) {
                return false;
            }
            // Client Filter
            if (filters.client.length > 0 && !filters.client.includes(o.client)) {
                return false;
            }
            // Status Filter
            if (filters.status.length > 0 && !filters.status.includes(o.status)) {
                return false;
            }
            return true;
        });

        // 2. Group Filtered Offers
        const groups: Record<string, any[]> = {};
        const noCodeOffers: any[] = [];

        filteredRaw.forEach(o => {
            if (!o.code) {
                noCodeOffers.push(o);
            } else {
                if (!groups[o.code]) {
                    groups[o.code] = [];
                }
                groups[o.code].push(o);
            }
        });

        const groupList = Object.keys(groups).map(code => {
            const groupItems = groups[code];
            // Sort versions by revision desc (Latest first) inside the group
            groupItems.sort((a, b) => (b.revision || 0) - (a.revision || 0));
            return {
                key: code,
                latest: groupItems[0],
                all: groupItems
            };
        });

        const noCodeList = noCodeOffers.map(o => ({
            key: o.id,
            latest: o,
            all: [o]
        }));

        return [...groupList, ...noCodeList];
    }, [offers, filters]);

    // Sorting the Groups based on the 'latest' item
    const sortedGroups = [...groupedOffers].sort((groupA, groupB) => {
        if (!sortConfig) return 0;

        const { key, direction } = sortConfig;
        const a = groupA.latest;
        const b = groupB.latest;

        let valA: any = a[key];
        let valB: any = b[key];

        // Specific handling
        if (key === 'date') {
            valA = new Date(a.createdAt).getTime();
            valB = new Date(b.createdAt).getTime();
        } else if (key === 'code') {
            // Handle numeric codes correctly if possible, otherwise string
            // Assuming string format like "OFF-001" or just "001"
            valA = a.code || '';
            valB = b.code || '';
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

    const renderRow = (o: any, isChild: boolean = false) => {
        let price = '-';
        let total = '-';
        try {
            const result = JSON.parse(o.resultsSummary || '{}');
            const pVal = result.salePrice !== undefined ? result.salePrice : result.total_cost_unit;
            if (pVal !== undefined && pVal !== null) {
                price = formatCurrency(parseFloat(pVal), 2);
            }

            if (result.totalValue !== undefined) {
                total = formatCurrency(parseFloat(result.totalValue), 0);
            }
        } catch (e) { }

        const rowStyle = isChild ? { backgroundColor: '#f9fafb', fontSize: '0.95em' } : {};
        const cellStyle = isChild ? { paddingLeft: '3rem' } : {};

        return (
            <tr key={o.id} style={rowStyle}>
                <td style={{ fontWeight: isChild ? 'normal' : 'bold', color: 'var(--color-primary-dark)', ...cellStyle }}>
                    {isChild && <span style={{ marginRight: '10px', color: '#94a3b8' }}>↳</span>}
                    {o.code || '-'}
                    {(o.revision !== null && o.revision !== undefined) && <span style={{ fontSize: '0.8em', color: '#64748b', marginLeft: '5px' }}> (Rev {o.revision})</span>}
                </td>
                <td style={{ opacity: isChild ? 0.8 : 1 }}>{o.client}</td>
                <td style={{ opacity: isChild ? 0.8 : 1 }}>
                    <div>
                        {o.product}
                        {!isChild && o.briefing?.code && (
                            <div style={{ fontSize: '0.75em', color: '#94a3b8', marginTop: '2px' }}>
                                Ref: {o.briefing.code}
                            </div>
                        )}
                    </div>
                </td>
                <td>
                    {!isChild ? (
                        <ResponsibleCell
                            id={o.id}
                            field="responsableComercial"
                            initialValue={o.responsableComercial}
                            users={users}
                        // Default apiPath is /api/ofertas
                        />
                    ) : '-'}
                </td>
                <td>
                    {!isChild ? (
                        <ResponsibleCell
                            id={o.id}
                            field="responsableTecnico"
                            initialValue={o.responsableTecnico}
                            users={users}
                        />
                    ) : '-'}
                </td>
                <td>
                    <span
                        className={styles.badge}
                        data-status={o.status}
                        style={{ background: getStatusColor(o.status), color: 'white', whiteSpace: 'nowrap' }}
                    >
                        {o.status}
                    </span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>{price} €</td>
                <td style={{ fontWeight: 'bold', color: '#059669', whiteSpace: 'nowrap' }}>{total !== '-' ? `${total} €` : '-'}</td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Link href={`/ofertas/editor/${o.id}`} className={styles.linkAction}>Editar</Link>
                        <OfferActions id={o.id} />
                    </div>
                </td>
            </tr>
        )
    }

    return (
        <div className={styles.tableCard} ref={filterRef}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {/* CODE - Sortable Label + Search Filter */}
                        <th>
                            <div className={styles.filterHeaderContainer}>
                                <div
                                    onClick={() => handleSort('code')}
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, userSelect: 'none' }}
                                >
                                    Nº Oferta <SortIcon column="code" />
                                </div>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        className={styles.filterHeaderInput}
                                        style={{ paddingRight: '22px' }}
                                        value={filters.code}
                                        onChange={(e) => setFilters(prev => ({ ...prev, code: e.target.value }))}
                                    />
                                    {filters.code && (
                                        <button
                                            className={styles.clearInputButton}
                                            onClick={() => setFilters(prev => ({ ...prev, code: '' }))}
                                            title="Limpiar búsqueda"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </th>



                        {/* CLIENT - Sortable Label + Multi-select Filter */}
                        <th>
                            <div className={styles.filterContainer} style={{ gap: '8px' }}>
                                <div
                                    onClick={() => handleSort('client')}
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', userSelect: 'none' }}
                                >
                                    Cliente <SortIcon column="client" />
                                </div>

                                <button
                                    className={`${styles.filterButton} ${activeFilterDropdown === 'client' || filters.client.length > 0 ? styles.filterButtonActive : ''}`}
                                    onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'client' ? null : 'client')}
                                    title="Filtrar por Cliente"
                                >
                                    <Filter size={14} />
                                    {filters.client.length > 0 && <span style={{ marginLeft: '4px', fontSize: '0.65rem', background: 'var(--color-primary)', color: 'white', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{filters.client.length}</span>}
                                </button>

                                {activeFilterDropdown === 'client' && (
                                    <div className={styles.filterDropdown}>
                                        {filters.client.length > 0 && (
                                            <button
                                                className={styles.filterClearButton}
                                                onClick={() => setFilters(prev => ({ ...prev, client: [] }))}
                                            >
                                                Limpiar Filtro
                                            </button>
                                        )}
                                        {uniqueClients.map(client => (
                                            <label key={client} className={styles.filterItem}>
                                                <input
                                                    type="checkbox"
                                                    checked={filters.client.includes(client)}
                                                    onChange={() => toggleFilter('client', client)}
                                                />
                                                {client}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </th>

                        {/* PRODUCT - Normal */}
                        <th>Producto</th>

                        {/* RESPONSIBLES */}
                        <th>Comercial</th>
                        <th>Técnico</th>

                        {/* STATUS - Sortable Label + Multi-select Filter */}
                        <th>
                            <div className={styles.filterContainer} style={{ gap: '8px' }}>
                                <div
                                    onClick={() => handleSort('status')}
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', userSelect: 'none' }}
                                >
                                    Estado <SortIcon column="status" />
                                </div>

                                <button
                                    className={`${styles.filterButton} ${activeFilterDropdown === 'status' || filters.status.length > 0 ? styles.filterButtonActive : ''}`}
                                    onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'status' ? null : 'status')}
                                    title="Filtrar por Estado"
                                >
                                    <Filter size={14} />
                                    {filters.status.length > 0 && <span style={{ marginLeft: '4px', fontSize: '0.65rem', background: 'var(--color-primary)', color: 'white', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{filters.status.length}</span>}
                                </button>

                                {activeFilterDropdown === 'status' && (
                                    <div className={styles.filterDropdown}>
                                        {filters.status.length > 0 && (
                                            <button
                                                className={styles.filterClearButton}
                                                onClick={() => setFilters(prev => ({ ...prev, status: [] }))}
                                            >
                                                Limpiar Filtro
                                            </button>
                                        )}
                                        {uniqueStatuses.map(status => (
                                            <label key={status} className={styles.filterItem}>
                                                <input
                                                    type="checkbox"
                                                    checked={filters.status.includes(status)}
                                                    onChange={() => toggleFilter('status', status)}
                                                />
                                                <span
                                                    className={styles.badge}
                                                    data-status={status}
                                                    style={{ background: getStatusColor(status), color: 'white', padding: '2px 6px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                                                >
                                                    {status}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </th>

                        {/* PRICES - Normal */}
                        <th>Precio (€/ud)</th>
                        <th>Total (€)</th>

                        {/* DATE - Keep Sorting */}
                        <th onClick={() => handleSort('date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>Fecha Creación <SortIcon column="date" /></div>
                        </th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedGroups.map(group => {
                        const { latest, all, key } = group;
                        const isExpanded = expandedGroups.has(key);
                        const hasHistory = all.length > 1;

                        // Calculate price etc for latest
                        let price = '-';
                        let total = '-';
                        try {
                            const result = JSON.parse(latest.resultsSummary || '{}');
                            const pVal = result.salePrice !== undefined ? result.salePrice : result.total_cost_unit;
                            if (pVal !== undefined && pVal !== null) {
                                price = formatCurrency(parseFloat(pVal), 2);
                            }

                            if (result.totalValue !== undefined) {
                                total = formatCurrency(parseFloat(result.totalValue), 0);
                            }
                        } catch (e) { }

                        return (
                            <Fragment key={key}>
                                <tr style={{ cursor: hasHistory ? 'pointer' : 'default', backgroundColor: isExpanded && hasHistory ? '#f0f9ff' : 'transparent' }} onClick={(e) => {
                                    if (hasHistory) {
                                        // prevent if clicking links/actions
                                        if ((e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
                                        toggleGroup(key);
                                    }
                                }}>
                                    <td style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            {hasHistory && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleGroup(key); }}
                                                    style={{ background: 'none', border: 'none', padding: 0, marginRight: '8px', cursor: 'pointer', display: 'flex', color: 'var(--color-primary-dark)' }}
                                                >
                                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </button>
                                            )}
                                            {!hasHistory && <div style={{ width: '24px' }}></div>}

                                            {latest.code || '-'}
                                            {(latest.revision !== null && latest.revision !== undefined) && <span style={{ fontSize: '0.8em', color: '#64748b', marginLeft: '5px' }}> (Rev {latest.revision})</span>}
                                        </div>
                                    </td>
                                    <td>{latest.client}</td>
                                    <td>
                                        <div>
                                            {latest.product}
                                            {latest.briefing?.code && (
                                                <div style={{ fontSize: '0.75em', marginTop: '2px' }}>
                                                    <Link
                                                        href={`/briefings/wizard?id=${latest.briefing.id}`}
                                                        style={{ color: '#ec4899', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
                                                        className="hover:underline"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <span style={{ opacity: 0.7 }}>Ref:</span> {latest.briefing.code}
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <ResponsibleCell
                                            id={latest.id}
                                            field="responsableComercial"
                                            initialValue={latest.responsableComercial}
                                            users={users}
                                        />
                                    </td>
                                    <td>
                                        <ResponsibleCell
                                            id={latest.id}
                                            field="responsableTecnico"
                                            initialValue={latest.responsableTecnico}
                                            users={users}
                                        />
                                    </td>
                                    <td>
                                        <span
                                            className={styles.badge}
                                            data-status={latest.status}
                                            style={{ background: getStatusColor(latest.status), color: 'white', whiteSpace: 'nowrap' }}
                                        >
                                            {latest.status}
                                        </span>
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap' }}>{price} €</td>
                                    <td style={{ fontWeight: 'bold', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>{total !== '-' ? `${total} €` : '-'}</td>
                                    <td>{new Date(latest.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <Link href={`/ofertas/editor/${latest.id}`} className={styles.linkAction}>Editar</Link>
                                            <OfferActions id={latest.id} />
                                        </div>
                                    </td>
                                </tr>
                                {isExpanded && hasHistory && all.slice(1).map((rev: any) => renderRow(rev, true))}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
            {sortedGroups.length === 0 && <div className={styles.empty}>No se encontraron ofertas.</div>}
        </div >
    );
}
