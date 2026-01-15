import { useState } from 'react';
import { Search, Calendar, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface RawMaterialsTableProps {
    data: any[];
}

export default function RawMaterialsTable({ data }: RawMaterialsTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showCompleted, setShowCompleted] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'estimatedDate', direction: 'asc' });
    const router = useRouter();

    // 1. Filter
    const filteredData = data.filter(item => {
        // Text Search
        const matchesSearch =
            item.articleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.articleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.associatedOE && item.associatedOE.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;

        // Completion Filter
        const isCompleted = item.status === 'COMPLETADO (100% ERP)' || (item.unitsOrdered > 0 && item.unitsReceived >= item.unitsOrdered);
        if (!showCompleted && isCompleted) return false;

        return true;
    });

    // 2. Sort
    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let aValue = a[key];
        let bValue = b[key];

        // Specific handling for 'progress' (calculated)
        if (key === 'progress') {
            aValue = a.unitsOrdered > 0 ? a.unitsReceived / a.unitsOrdered : 0;
            bValue = b.unitsOrdered > 0 ? b.unitsReceived / b.unitsOrdered : 0;
        }
        // Specific handling for dates which might be null strings or objects
        else if (key === 'expectedDate' || key === 'orderDate' || key === 'estimatedDate') {
            // Treat null dates as far future (or past depending on pref, here far future for asc sort to keep empty at bottom)
            const getVal = (v: any) => v ? new Date(v).getTime() : (direction === 'asc' ? 9999999999999 : 0);
            aValue = getVal(a[key]);
            bValue = getVal(b[key]);
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });


    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleUpdate = async (id: string, field: string, value: any) => {
        try {
            const res = await fetch(`/api/materias-primas/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });
            if (res.ok) {
                toast.success('Guardado');
                router.refresh();
            } else {
                toast.error('Error al guardar');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error de conexión');
        }
    };

    const getStatusColor = (status: string, date: Date | null) => {
        if (status === 'COMPLETADO (100% ERP)') return '#f0fdf4';
        if (date && new Date(date) < new Date()) return '#fef2f2';
        return 'white';
    };

    const getProgressColor = (received: number, ordered: number) => {
        if (ordered === 0) return '#e2e8f0';
        const progress = received / ordered;
        if (progress >= 1) return '#22c55e';
        if (progress > 0) return '#eab308';
        return '#cbd5e1';
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig?.key !== column) return <div style={{ width: 14 }} />; // Placeholder
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
    };

    const Th = ({ label, sortKey, align = 'left' }: { label: string, sortKey?: string, align?: 'left' | 'center' | 'right' }) => (
        <th
            style={{
                padding: '12px 16px', fontWeight: 600, textAlign: align, cursor: sortKey ? 'pointer' : 'default',
                userSelect: 'none'
            }}
            onClick={() => sortKey && handleSort(sortKey)}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' }}>
                {label}
                {sortKey && <SortIcon column={sortKey} />}
            </div>
        </th>
    );

    return (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center', background: '#f8fafc' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Buscar por artículo, proveedor, OF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1',
                            fontSize: '0.9rem', outline: 'none'
                        }}
                    />
                </div>
                <div style={{ fontSize: '0.9rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
                        <input
                            type="checkbox"
                            checked={showCompleted}
                            onChange={(e) => setShowCompleted(e.target.checked)}
                            style={{ width: '16px', height: '16px', accentColor: '#0f172a', cursor: 'pointer' }}
                        />
                        <span>Mostrar completados</span>
                    </label>
                    <div style={{ width: '1px', height: '20px', background: '#cbd5e1' }} />
                    <span>Mostrando <strong>{filteredData.length}</strong> pedidos</span>
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                            <Th label="OF (Asoc.)" sortKey="associatedOE" />
                            <Th label="Pedido" sortKey="orderNumber" />
                            <Th label="Artículo" sortKey="articleName" />
                            <Th label="Progreso" sortKey="progress" align="center" />
                            <Th label="Pendiente" sortKey="unitsPending" align="right" />
                            <Th label="Fechas Env/Sol/Rec" sortKey="estimatedDate" />
                            <Th label="Proveedor" sortKey="supplierName" />
                            <Th label="Notas" sortKey="notes" />
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((row) => (
                            <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0', background: getStatusColor(row.status || '', row.expectedDate) }}>
                                {/* OF Editable */}
                                <td style={{ padding: '12px 16px', width: '100px' }}>
                                    <input
                                        type="text"
                                        defaultValue={row.associatedOE || ''}
                                        onBlur={(e) => {
                                            if (e.target.value !== row.associatedOE) handleUpdate(row.id, 'associatedOE', e.target.value);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') e.currentTarget.blur();
                                        }}
                                        placeholder="OF..."
                                        style={{
                                            width: '100%', padding: '4px', border: '1px solid transparent',
                                            background: 'transparent', borderRadius: '4px', fontWeight: 600
                                        }}
                                        className="hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white"
                                    />
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                    <div style={{ fontWeight: 600, color: '#334155' }}>{row.orderNumber}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{row.orderDate ? format(new Date(row.orderDate), 'dd/MM/yyyy') : '-'}</div>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{row.articleName}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{row.articleCode}</div>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${Math.min(100, (row.unitsReceived / row.unitsOrdered) * 100)}%`, height: '100%', background: getProgressColor(row.unitsReceived, row.unitsOrdered) }} />
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                            {row.unitsOrdered > 0 ? Math.round((row.unitsReceived / row.unitsOrdered) * 100) : 0}%
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                                        {row.unitsReceived} / {row.unitsOrdered}
                                    </div>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#f59e0b' }}>
                                    {row.unitsPending.toLocaleString()}
                                </td>
                                {/* Dates: Estimated, Expected, Reception */}
                                <td style={{ padding: '12px 16px', minWidth: '160px' }}>
                                    {/* 1. Estimated (Manual) - Primary Sorting */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#64748b', minWidth: '25px' }}>Est:</span>
                                        <input
                                            type="date"
                                            defaultValue={row.estimatedDate ? new Date(row.estimatedDate).toISOString().split('T')[0] : ''}
                                            onBlur={(e) => {
                                                const val = e.target.value;
                                                if (val !== (row.estimatedDate ? new Date(row.estimatedDate).toISOString().split('T')[0] : '')) {
                                                    handleUpdate(row.id, 'estimatedDate', val || null);
                                                }
                                            }}
                                            style={{
                                                border: (row.estimatedDate && row.expectedDate && (new Date(row.estimatedDate).getTime() - new Date(row.expectedDate).getTime()) / (1000 * 3600 * 24) > 9)
                                                    ? '1px solid #eab308' : '1px solid transparent', // Yellow border if > 9 days
                                                background: (row.estimatedDate && row.expectedDate && (new Date(row.estimatedDate).getTime() - new Date(row.expectedDate).getTime()) / (1000 * 3600 * 24) > 9)
                                                    ? '#fef9c3' : '#f1f5f9', // Yellow bg if > 9 days
                                                fontSize: '0.75rem', padding: '1px 4px', borderRadius: '4px',
                                                color: (row.estimatedDate && row.expectedDate && (new Date(row.estimatedDate).getTime() - new Date(row.expectedDate).getTime()) / (1000 * 3600 * 24) > 9)
                                                    ? '#854d0e' : '#0f172a', // Darker yellow text
                                                fontWeight: 600, width: '100px'
                                            }}
                                            className="hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white"
                                        />
                                    </div>

                                    {/* 2. Expected (ERP) - Read Only */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#64748b', minWidth: '25px' }}>Sol:</span>
                                        <span style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 500 }}>
                                            {row.expectedDate ? format(new Date(row.expectedDate), 'dd/MM/yyyy') : '-'}
                                        </span>
                                    </div>

                                    {/* 3. Reception (Manual) - NICHE ONLY */}
                                    {row.supplierName?.toUpperCase().includes('NICHE BEAUTY LAB') && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#16a34a', minWidth: '25px' }}>Rec:</span>
                                            <input
                                                type="date"
                                                defaultValue={row.manualReceptionDate ? new Date(row.manualReceptionDate).toISOString().split('T')[0] : ''}
                                                onBlur={(e) => {
                                                    const val = e.target.value;
                                                    if (val !== (row.manualReceptionDate ? new Date(row.manualReceptionDate).toISOString().split('T')[0] : '')) {
                                                        handleUpdate(row.id, 'manualReceptionDate', val || null);
                                                    }
                                                }}
                                                style={{
                                                    border: '1px solid transparent', background: '#f0fdf4',
                                                    fontSize: '0.75rem', padding: '1px 4px', borderRadius: '4px',
                                                    color: '#15803d', width: '100px'
                                                }}
                                                className="hover:border-green-300 hover:bg-white focus:border-green-500 focus:bg-white"
                                            />
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '12px 16px', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#475569' }}>
                                    {row.supplierName}
                                </td>
                                {/* Notes Editable */}
                                <td style={{ padding: '12px 16px', maxWidth: '200px' }}>
                                    <input
                                        type="text"
                                        defaultValue={row.notes || ''}
                                        onBlur={(e) => {
                                            if (e.target.value !== row.notes) handleUpdate(row.id, 'notes', e.target.value);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') e.currentTarget.blur();
                                        }}
                                        placeholder="Añadir nota..."
                                        style={{
                                            width: '100%', padding: '4px', border: '1px solid #e2e8f0',
                                            background: '#fffbeb', borderRadius: '4px', fontSize: '0.75rem', color: '#b45309'
                                        }}
                                        className="focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </td>
                            </tr>
                        ))}
                        {sortedData.length === 0 && (
                            <tr>
                                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                    No se encontraron pedidos que coincidan con la búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
