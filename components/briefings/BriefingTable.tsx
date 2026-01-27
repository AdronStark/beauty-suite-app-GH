'use client';

import { useState, useMemo, Fragment, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowUpDown, ArrowUp, ArrowDown, Trash2, Copy, FileText, ChevronRight, ChevronDown, Filter, X } from 'lucide-react';
import { getStatusColor } from '@/lib/statusColors';
import styles from '@/app/(main)/ofertas/page.module.css';
import { formatCurrency } from '@/lib/formatters';

type SortKey = 'code' | 'clientName' | 'productName' | 'category' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

import ResponsibleCell, { UserOption } from '@/components/ofertas/ResponsibleCell';

interface BriefingTableProps {
    briefings: any[];
}

export default function BriefingTable({ briefings }: BriefingTableProps) {
    const router = useRouter();
    const { data: session } = useSession();
    // @ts-ignore
    const user = session?.user;
    // @ts-ignore
    const appRoles = user?.appRoles || [];
    // @ts-ignore
    const appRole = appRoles.find((r: any) => r.appId === 'briefings')?.role;
    // @ts-ignore
    const isGlobalAdmin = user?.role === 'ADMIN';

    // Permissions
    const canWrite = isGlobalAdmin || appRole === 'EDITOR' || appRole === 'ADMIN';
    const canDelete = isGlobalAdmin || appRole === 'ADMIN';

    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'code', direction: 'desc' });
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isCloning, setIsCloning] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // User Fetching
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

    // Derived Data for Filters
    const uniqueClients = useMemo(() => Array.from(new Set(briefings.map(b => b.clientName).filter(Boolean))).sort(), [briefings]);
    const uniqueStatuses = useMemo(() => Array.from(new Set(briefings.map(b => b.status).filter(Boolean))).sort(), [briefings]);

    const toggleFilter = (type: 'client' | 'status', value: string) => {
        setFilters(prev => {
            const current = prev[type];
            const newValues = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [type]: newValues };
        });
    };

    const handleClone = async (id: string, name: string) => {
        if (!confirm(`¿Duplicar el briefing "${name}"? Se creará una copia en estado Borrador.`)) return;
        setIsCloning(id);
        try {
            const res = await fetch('/api/briefings/clone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceId: id })
            });
            if (res.ok) { router.refresh(); } else { alert("Error al duplicar el briefing."); }
        } catch (error) { alert("Error de conexión al duplicar."); } finally { setIsCloning(null); }
    };

    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`¿Eliminar el briefing ${code || 'sin código'}?`)) return;
        setIsDeleting(id);
        try {
            const res = await fetch(`/api/briefings/${id}`, { method: 'DELETE' });
            if (res.ok) { router.refresh(); } else { alert("Error al eliminar."); }
        } catch (error) { alert("Error de conexión."); } finally { setIsDeleting(null); }
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
        if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedIds.size} briefings seleccionados?`)) return;

        setIsBulkDeleting(true);
        try {
            const res = await fetch('/api/briefings/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });

            if (res.ok) {
                setSelectedIds(new Set());
                router.refresh();
                alert("Briefings eliminados correctamente.");
            } else {
                alert("Error al eliminar briefings.");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión.");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    // Grouping Logic with Filters
    const groupedBriefings = useMemo(() => {
        // 1. Filter
        const filteredRaw = briefings.filter(b => {
            if (filters.code && !b.code?.toLowerCase().includes(filters.code.toLowerCase())) return false;
            if (filters.client.length > 0 && !filters.client.includes(b.clientName)) return false;
            if (filters.status.length > 0 && !filters.status.includes(b.status)) return false;
            return true;
        });

        // 2. Group
        const groups: Record<string, any[]> = {};
        const noCodeBriefings: any[] = [];

        filteredRaw.forEach(b => {
            if (!b.code) { noCodeBriefings.push(b); }
            else {
                if (!groups[b.code]) groups[b.code] = [];
                groups[b.code].push(b);
            }
        });

        const groupList = Object.keys(groups).map(code => {
            const groupItems = groups[code];
            groupItems.sort((a, b) => (b.revision || 0) - (a.revision || 0));
            return { key: code, latest: groupItems[0], all: groupItems };
        });

        const noCodeList = noCodeBriefings.map(b => ({ key: b.id, latest: b, all: [b] }));
        return [...groupList, ...noCodeList];
    }, [briefings, filters]);

    // Sorting Groups
    const sortedGroups = [...groupedBriefings].sort((groupA, groupB) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        const a = groupA.latest;
        const b = groupB.latest;
        let valA: any = a[key];
        let valB: any = b[key];

        if (key === 'createdAt') {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
        } else if (key === 'code') {
            valA = a.code || '';
            valB = b.code || '';
        } else {
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

    const renderRow = (b: any, isChild: boolean = false, hasChildren: boolean = false) => {
        let formData: any = {};
        try { formData = JSON.parse(b.formData || '{}'); } catch (e) { }

        const rowStyle: React.CSSProperties = isChild ? { backgroundColor: '#f9fafb', fontSize: '0.95em' } : {};
        const cellStyle: React.CSSProperties = isChild ? { paddingLeft: '2.5rem' } : {};

        return (
            <tr key={b.id} style={{ ...rowStyle, opacity: (isDeleting === b.id || isCloning === b.id) ? 0.5 : 1 }}>
                {/* Checkbox Column */}
                <td style={{ width: '40px', textAlign: 'center' }}>
                    <input
                        type="checkbox"
                        checked={selectedIds.has(b.id)}
                        onChange={() => toggleSelection(b.id)}
                        style={{ cursor: 'pointer' }}
                    />
                </td>
                <td style={{ fontWeight: isChild ? 'normal' : 'bold', color: 'var(--color-primary-dark)', ...cellStyle }}>
                    {!isChild && hasChildren && (
                        <button
                            onClick={() => toggleGroup(b.code)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0, marginRight: '6px', display: 'inline-flex', alignItems: 'center' }}
                        >
                            {expandedGroups.has(b.code) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    )}
                    {isChild && <span style={{ marginRight: '10px', color: '#94a3b8' }}>↳</span>}
                    <Link href={`/briefings/wizard?id=${b.id}`} className="hover:underline" style={{ color: 'inherit', textDecoration: 'none' }}>
                        {b.code || '-'}
                    </Link>
                    {(b.revision !== null && b.revision !== undefined) && (
                        <span style={{ fontSize: '0.8em', color: '#64748b', marginLeft: '5px' }}>(Rev {b.revision})</span>
                    )}
                </td>
                <td style={{ opacity: isChild ? 0.8 : 1 }}>{b.clientName}</td>
                <td style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)', opacity: isChild ? 0.8 : 1 }}>{b.productName}</td>
                <td>
                    <ResponsibleCell
                        id={b.id}
                        field="responsableComercial"
                        initialValue={b.responsableComercial}
                        users={users}
                        apiPath="/api/briefings"
                        readOnly={!canWrite}
                    />
                </td>
                <td>
                    <ResponsibleCell
                        id={b.id}
                        field="responsableTecnico"
                        initialValue={b.responsableTecnico}
                        users={users}
                        apiPath="/api/briefings"
                        readOnly={!canWrite}
                    />
                </td>
                <td>
                    <span className={styles.badge} style={{ background: getStatusColor(b.status), color: 'white' }}>
                        {b.status}
                    </span>
                </td>
                <td>{formData.targetPrice ? `${formatCurrency(parseFloat(formData.targetPrice), 2)} €` : '-'}</td>
                <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {canWrite && (
                            <>
                                <Link href={`/ofertas/new?briefingId=${b.id}`} className={styles.linkAction} title="Generar Oferta">
                                    <FileText size={16} />
                                </Link>
                                <button onClick={() => handleClone(b.id, b.productName)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }} disabled={isCloning === b.id} title="Duplicar">
                                    <Copy size={16} />
                                </button>
                            </>
                        )}
                        {canDelete && (
                            <button onClick={() => handleDelete(b.id, b.code)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }} disabled={isDeleting === b.id} title="Eliminar">
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    // Flatten groups to get all visible IDs for "Select All"
    const visibleIds = useMemo(() => {
        return sortedGroups.flatMap(g => [g.latest.id, ...g.all.slice(1).map((c: any) => c.id)]);
    }, [sortedGroups]);

    return (
        <div className={styles.tableCard} ref={filterRef}>
            {/* Bulk Actions Header */}
            {selectedIds.size > 0 && canDelete && (
                <div style={{
                    padding: '0.75rem 1rem', background: '#fef2f2', borderBottom: '1px solid #fee2e2',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#991b1b'
                }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {selectedIds.size} seleccionados
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

            <table className={styles.table}>
                <thead>
                    <tr>
                        {/* Checkbox Header */}
                        <th style={{
                            width: '40px', textAlign: 'center',
                            position: 'sticky', top: 0, zIndex: 20, background: '#f8fafc',
                            boxShadow: '0 1px 0 #e2e8f0'
                        }}>
                            <input
                                type="checkbox"
                                checked={visibleIds.length > 0 && selectedIds.size === visibleIds.length}
                                onChange={() => handleSelectAll(visibleIds)}
                                style={{ cursor: 'pointer' }}
                            />
                        </th>
                        {/* CODE - Sortable + Search */}
                        <th style={{
                            position: 'sticky', top: 0, zIndex: 20, background: '#f8fafc',
                            boxShadow: '0 1px 0 #e2e8f0'
                        }}>
                            <div className={styles.filterHeaderContainer}>
                                <div onClick={() => handleSort('code')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, userSelect: 'none' }}>
                                    Nº Briefing <SortIcon column="code" />
                                </div>
                                <div className={styles.inputWrapper}>
                                    <input type="text" placeholder="Buscar..." className={styles.filterHeaderInput} style={{ paddingRight: '22px' }} value={filters.code} onChange={(e) => setFilters(prev => ({ ...prev, code: e.target.value }))} />
                                    {filters.code && (
                                        <button className={styles.clearInputButton} onClick={() => setFilters(prev => ({ ...prev, code: '' }))} title="Limpiar">
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </th>

                        {/* CLIENT - Sortable + Multi-select Filter */}
                        <th style={{
                            position: 'sticky', top: 0, zIndex: 20, background: '#f8fafc',
                            boxShadow: '0 1px 0 #e2e8f0'
                        }}>
                            <div className={styles.filterContainer} style={{ gap: '8px' }}>
                                <div onClick={() => handleSort('clientName')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', userSelect: 'none' }}>
                                    Cliente <SortIcon column="clientName" />
                                </div>
                                <button className={`${styles.filterButton} ${activeFilterDropdown === 'client' || filters.client.length > 0 ? styles.filterButtonActive : ''}`} onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'client' ? null : 'client')} title="Filtrar">
                                    <Filter size={14} />
                                    {filters.client.length > 0 && <span style={{ marginLeft: '4px', fontSize: '0.65rem', background: 'var(--color-primary)', color: 'white', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{filters.client.length}</span>}
                                </button>
                                {activeFilterDropdown === 'client' && (
                                    <div className={styles.filterDropdown}>
                                        {filters.client.length > 0 && (
                                            <button className={styles.filterClearButton} onClick={() => setFilters(prev => ({ ...prev, client: [] }))}>Limpiar</button>
                                        )}
                                        {uniqueClients.map(c => (
                                            <label key={c} className={styles.filterDropdownItem}>
                                                <input type="checkbox" checked={filters.client.includes(c)} onChange={() => toggleFilter('client', c)} />
                                                {c}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </th>

                        {/* PRODUCT */}
                        <th onClick={() => handleSort('productName')} style={{
                            cursor: 'pointer',
                            position: 'sticky', top: 0, zIndex: 20, background: '#f8fafc',
                            boxShadow: '0 1px 0 #e2e8f0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>Producto <SortIcon column="productName" /></div>
                        </th>

                        {/* RESPONSIBLES */}
                        <th style={{
                            position: 'sticky', top: 0, zIndex: 20, background: '#f8fafc',
                            boxShadow: '0 1px 0 #e2e8f0'
                        }}>Comercial</th>
                        <th style={{
                            position: 'sticky', top: 0, zIndex: 20, background: '#f8fafc',
                            boxShadow: '0 1px 0 #e2e8f0'
                        }}>Técnico</th>

                        {/* STATUS - Sortable + Multi-select Filter */}
                        <th style={{
                            position: 'sticky', top: 0, zIndex: 20, background: '#f8fafc',
                            boxShadow: '0 1px 0 #e2e8f0'
                        }}>
                            <div className={styles.filterContainer} style={{ gap: '8px' }}>
                                <div onClick={() => handleSort('status')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', userSelect: 'none' }}>
                                    Estado <SortIcon column="status" />
                                </div>
                                <button className={`${styles.filterButton} ${activeFilterDropdown === 'status' || filters.status.length > 0 ? styles.filterButtonActive : ''}`} onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'status' ? null : 'status')} title="Filtrar">
                                    <Filter size={14} />
                                    {filters.status.length > 0 && <span style={{ marginLeft: '4px', fontSize: '0.65rem', background: 'var(--color-primary)', color: 'white', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{filters.status.length}</span>}
                                </button>
                                {activeFilterDropdown === 'status' && (
                                    <div className={styles.filterDropdown}>
                                        {filters.status.length > 0 && (
                                            <button className={styles.filterClearButton} onClick={() => setFilters(prev => ({ ...prev, status: [] }))}>Limpiar</button>
                                        )}
                                        {uniqueStatuses.map(s => (
                                            <label key={s} className={styles.filterDropdownItem}>
                                                <input type="checkbox" checked={filters.status.includes(s)} onChange={() => toggleFilter('status', s)} />
                                                <span className={styles.badge} style={{ background: getStatusColor(s), color: 'white', fontSize: '0.7rem' }}>{s}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </th>

                        <th style={{
                            position: 'sticky', top: 0, zIndex: 20, background: '#f8fafc',
                            boxShadow: '0 1px 0 #e2e8f0'
                        }}>Target (€)</th>

                        <th onClick={() => handleSort('createdAt')} style={{
                            cursor: 'pointer',
                            position: 'sticky', top: 0, zIndex: 20, background: '#f8fafc',
                            boxShadow: '0 1px 0 #e2e8f0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>Fecha Creación <SortIcon column="createdAt" /></div>
                        </th>

                        <th style={{
                            position: 'sticky', top: 0, zIndex: 20, background: '#f8fafc',
                            boxShadow: '0 1px 0 #e2e8f0'
                        }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedGroups.map(group => {
                        const hasRevisions = group.all.length > 1;
                        const isExpanded = expandedGroups.has(group.key);

                        return (
                            <Fragment key={group.key}>
                                {renderRow(group.latest, false, hasRevisions)}
                                {hasRevisions && isExpanded && group.all.slice(1).map(child => renderRow(child, true, false))}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
            {sortedGroups.length === 0 && <div className={styles.empty}>No hay briefings registrados.</div>}
        </div>
    );
}
