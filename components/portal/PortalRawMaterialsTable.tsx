'use client';

import { useState, Fragment } from 'react';
import { Search, ArrowUp, ArrowDown, Package, MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface PortalRawMaterialsTableProps {
    data: any[];
}

export default function PortalRawMaterialsTable({ data }: PortalRawMaterialsTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showCompleted, setShowCompleted] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'estimatedDate', direction: 'asc' });
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [commentInput, setCommentInput] = useState('');
    const [isSendingComment, setIsSendingComment] = useState(false);
    const router = useRouter();

    // Filter
    const filteredData = data.filter(item => {
        const matchesSearch =
            item.articleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.articleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        // Completion filter
        const isCompleted = (item.unitsOrdered > 0 && item.unitsReceived >= item.unitsOrdered);
        if (!showCompleted && isCompleted) return false;

        return true;
    });

    // Sort
    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let aValue = a[key];
        let bValue = b[key];

        if (key === 'estimatedDate' || key === 'manualReceptionDate') {
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

    const toggleRow = (id: string) => {
        if (expandedRowId === id) {
            setExpandedRowId(null);
            setCommentInput('');
        } else {
            setExpandedRowId(id);
            setCommentInput('');
        }
    };

    const handleSendComment = async (id: string) => {
        if (!commentInput.trim()) return;

        setIsSendingComment(true);
        try {
            const res = await fetch(`/api/materias-primas/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newComment: commentInput })
            });

            if (res.ok) {
                toast.success('Comentario añadido');
                setCommentInput(''); // Clear input
                router.refresh(); // Refresh to show new comment in list
            } else {
                toast.error('Error al enviar comentario');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error de conexión');
        } finally {
            setIsSendingComment(false);
        }
    };

    const handleUpdateEstimatedDate = async (id: string, value: string) => {
        try {
            const res = await fetch(`/api/materias-primas/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estimatedDate: value || null })
            });
            if (res.ok) {
                toast.success('Fecha estimada guardada');
                router.refresh();
            } else {
                toast.error('Error al guardar');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error de conexión');
        }
    };

    const handleUpdateUnitsShipped = async (id: string, value: string) => {
        try {
            const res = await fetch(`/api/materias-primas/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unitsShipped: value || null })
            });
            if (res.ok) {
                toast.success('Cantidad enviada guardada');
                router.refresh(); // This re-fetches data, so input will update with server value
            } else {
                toast.error('Error al guardar cantidad');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error de conexión');
        }
    };

    const getProgressColor = (received: number, ordered: number) => {
        if (ordered === 0) return '#e2e8f0';
        const progress = received / ordered;
        if (progress >= 1) return '#22c55e';
        if (progress > 0) return '#eab308';
        return '#cbd5e1';
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig?.key !== column) return <div style={{ width: 14 }} />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
    };

    const Th = ({ label, sortKey, align = 'left' }: { label: string, sortKey?: string, align?: 'left' | 'center' | 'right' }) => (
        <th
            style={{
                padding: '12px 16px', fontWeight: 600, textAlign: align, cursor: sortKey ? 'pointer' : 'default',
                userSelect: 'none', fontSize: '0.8rem', color: '#475569'
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
                        placeholder="Buscar por artículo, código, pedido..."
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
                            style={{ width: '16px', height: '16px', accentColor: '#3E6AD8', cursor: 'pointer' }}
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
                        {/* Group Headers Row */}
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th colSpan={3} style={{ padding: '6px 16px' }}></th>
                            <th colSpan={2} style={{
                                padding: '6px 16px',
                                fontSize: '0.7rem',
                                color: '#64748b',
                                textAlign: 'center',
                                fontWeight: 500,
                                borderLeft: '1px solid #cbd5e1'
                            }}>
                                Proveedor completa
                            </th>
                            <th style={{ padding: '6px 16px' }}></th>
                            <th colSpan={2} style={{
                                padding: '6px 16px',
                                fontSize: '0.7rem',
                                color: '#64748b',
                                textAlign: 'center',
                                fontWeight: 500,
                                borderLeft: '1px solid #cbd5e1'
                            }}>
                                Recepción
                            </th>
                            <th style={{ padding: '6px 16px' }}></th>
                        </tr>
                        {/* Column Headers Row */}
                        <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                            <Th label="Nº Pedido" sortKey="orderNumber" />
                            <Th label="Artículo" sortKey="articleName" />
                            <Th label="Pedido" sortKey="unitsOrdered" align="right" />
                            {/* Group 1: Proveedor completa */}
                            <th style={{
                                padding: '12px 16px', fontWeight: 600, fontSize: '0.8rem', color: '#475569',
                                cursor: 'pointer', userSelect: 'none',
                                borderLeft: '1px solid #cbd5e1'
                            }} onClick={() => handleSort('estimatedDate')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Fecha Estimada
                                    <SortIcon column="estimatedDate" />
                                </div>
                            </th>
                            <th style={{
                                padding: '12px 16px', fontWeight: 600, fontSize: '0.8rem', color: '#475569',
                                userSelect: 'none'
                            }}>
                                kg enviados
                            </th>
                            <th style={{
                                padding: '12px 16px', fontWeight: 600, fontSize: '0.8rem', color: '#475569',
                                cursor: 'pointer', userSelect: 'none',
                                borderLeft: '1px solid #cbd5e1',
                                textAlign: 'right'
                            }} onClick={() => handleSort('unitsPending')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                    Pendiente
                                    <SortIcon column="unitsPending" />
                                </div>
                            </th>
                            {/* Group 2: Recepción */}
                            <th style={{
                                padding: '12px 16px', fontWeight: 600, fontSize: '0.8rem', color: '#475569',
                                cursor: 'pointer', userSelect: 'none',
                                borderLeft: '1px solid #cbd5e1',
                                textAlign: 'right'
                            }} onClick={() => handleSort('unitsReceived')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                    Recibido
                                    <SortIcon column="unitsReceived" />
                                </div>
                            </th>
                            <th style={{
                                padding: '12px 16px', fontWeight: 600, fontSize: '0.8rem', color: '#475569',
                                cursor: 'pointer', userSelect: 'none'
                            }} onClick={() => handleSort('manualReceptionDate')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Fecha Recepción
                                    <SortIcon column="manualReceptionDate" />
                                </div>
                            </th>
                            <Th label="Notas" />
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((row) => (
                            <Fragment key={row.id}>
                                <tr
                                    style={{ borderBottom: '1px solid #e2e8f0', background: expandedRowId === row.id ? '#f1f5f9' : 'white', cursor: 'pointer' }}
                                    onClick={() => toggleRow(row.id)}
                                >
                                    {/* Order Number */}
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ fontWeight: 600, color: '#334155' }}>{row.orderNumber}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                            {row.orderDate ? format(new Date(row.orderDate), 'dd/MM/yyyy') : '-'}
                                        </div>
                                    </td>
                                    {/* Article */}
                                    <td style={{ padding: '12px 16px', maxWidth: '250px' }}>
                                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{row.articleName}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{row.articleCode}</div>
                                    </td>
                                    {/* Ordered */}
                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500 }}>
                                        {row.unitsOrdered.toLocaleString()}
                                    </td>

                                    {/* === GROUP 1: Proveedor completa === */}
                                    {/* Estimated Date - EDITABLE by client (Stop Propagation to not toggle row) */}
                                    <td style={{ padding: '12px 16px', borderLeft: '1px solid #e2e8f0' }} onClick={e => e.stopPropagation()}>
                                        <input
                                            type="date"
                                            defaultValue={row.estimatedDate ? new Date(row.estimatedDate).toISOString().split('T')[0] : ''}
                                            onBlur={(e) => {
                                                const val = e.target.value;
                                                if (val !== (row.estimatedDate ? new Date(row.estimatedDate).toISOString().split('T')[0] : '')) {
                                                    handleUpdateEstimatedDate(row.id, val);
                                                }
                                            }}
                                            style={{
                                                border: '1px solid #cbd5e1',
                                                background: '#f8fafc',
                                                fontSize: '0.8rem',
                                                padding: '6px 8px',
                                                borderRadius: '6px',
                                                color: '#0f172a',
                                                fontWeight: 500,
                                                width: '130px'
                                            }}
                                        />
                                    </td>
                                    {/* kg Sent - PERSISTED (Stop Propagation) */}
                                    <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                                        <input
                                            type="number"
                                            placeholder="kg..."
                                            defaultValue={row.unitsShipped || ''}
                                            onBlur={(e) => {
                                                // Only update if value changed
                                                const val = e.target.value;
                                                if (val != row.unitsShipped) {
                                                    handleUpdateUnitsShipped(row.id, val);
                                                }
                                            }}
                                            style={{
                                                border: '1px solid #cbd5e1',
                                                background: '#f8fafc',
                                                fontSize: '0.8rem',
                                                padding: '6px 8px',
                                                borderRadius: '6px',
                                                color: '#475569',
                                                width: '80px',
                                                textAlign: 'right'
                                            }}
                                        />
                                    </td>

                                    {/* Pending */}
                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: row.unitsPending > 0 ? '#f59e0b' : '#22c55e', borderLeft: '1px solid #e2e8f0' }}>
                                        {row.unitsPending.toLocaleString()}
                                    </td>

                                    {/* === GROUP 2: Recepción === */}
                                    {/* Received */}
                                    <td style={{ padding: '12px 16px', textAlign: 'right', borderLeft: '1px solid #e2e8f0' }}>
                                        <span style={{
                                            fontWeight: 600,
                                            color: row.unitsReceived >= row.unitsOrdered ? '#16a34a' : '#64748b'
                                        }}>
                                            {row.unitsReceived.toLocaleString()}
                                        </span>
                                    </td>
                                    {/* Reception Date - READ ONLY */}
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            fontSize: '0.8rem',
                                            color: row.manualReceptionDate ? '#16a34a' : '#94a3b8',
                                            fontWeight: row.manualReceptionDate ? 600 : 400
                                        }}>
                                            {row.manualReceptionDate ? format(new Date(row.manualReceptionDate), 'dd/MM/yyyy') : '-'}
                                        </span>
                                    </td>

                                    {/* Notes - PREVIEW ONLY */}
                                    <td style={{ padding: '12px 16px', maxWidth: '150px', color: '#64748b' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                            <span style={{
                                                fontSize: '0.8rem',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                maxWidth: '100px'
                                            }}>
                                                {row.notes ? row.notes.split('\n').pop() : '-'}
                                            </span>
                                            {expandedRowId === row.id ?
                                                <ChevronUp size={16} color="#3E6AD8" /> :
                                                <ChevronDown size={16} color={row.notes ? "#3E6AD8" : "#cbd5e1"} />
                                            }
                                        </div>
                                    </td>
                                </tr>

                                {/* EXPANDED NOTES ROW */}
                                {expandedRowId === row.id && (
                                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                        <td colSpan={9} style={{ padding: '0 24px 24px 24px' }}>
                                            <div style={{
                                                background: 'white',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '12px',
                                                padding: '16px',
                                                marginTop: '8px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                            }} onClick={e => e.stopPropagation()}>
                                                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <MessageSquare size={16} />
                                                    Notas Compartidas & Historial
                                                </h4>

                                                {/* History Area */}
                                                <div style={{
                                                    background: '#f1f5f9',
                                                    borderRadius: '8px',
                                                    padding: '12px',
                                                    marginBottom: '12px',
                                                    maxHeight: '300px',
                                                    overflowY: 'auto',
                                                    fontSize: '0.85rem',
                                                    lineHeight: 1.6,
                                                    color: '#334155',
                                                    border: '1px solid #e2e8f0',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '8px'
                                                }}>
                                                    {(!row.notes || !row.notes.trim()) && <em style={{ color: '#94a3b8' }}>No hay notas compartidas todavía.</em>}

                                                    {row.notes && row.notes.split(/\n\n+/).filter((n: string) => n.trim()).map((note: string, idx: number) => {
                                                        // Identify if this note is from a Client (starts with [Client...)
                                                        // We assume the Client viewing this IS the client. Ideally we check the name matches.
                                                        // But safely, we can just check if it DOESNT start with [Laboratorios Coper
                                                        // Actually, user wants "Delete OWN comments".
                                                        // For Portal (Client Side), "Own" means starts with [ClientName...
                                                        const isMyNote = !note.startsWith('[Laboratorios Coper');

                                                        return (
                                                            <div key={idx} style={{
                                                                background: 'white',
                                                                padding: '8px 12px',
                                                                borderRadius: '8px',
                                                                borderLeft: isMyNote ? '3px solid #3E6AD8' : '3px solid #64748b',
                                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                                position: 'relative'
                                                            }}>
                                                                <div style={{ whiteSpace: 'pre-wrap' }}>{note}</div>
                                                                {isMyNote && (
                                                                    <button
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            if (!confirm('¿Eliminar este comentario?')) return;

                                                                            try {
                                                                                const res = await fetch(`/api/materias-primas/${row.id}`, {
                                                                                    method: 'PATCH',
                                                                                    headers: { 'Content-Type': 'application/json' },
                                                                                    body: JSON.stringify({ deleteComment: note })
                                                                                });
                                                                                if (res.ok) {
                                                                                    toast.success('Comentario eliminado');
                                                                                    router.refresh();
                                                                                } else {
                                                                                    toast.error('No se pudo eliminar');
                                                                                }
                                                                            } catch (err) {
                                                                                console.error(err);
                                                                                toast.error('Error de conexión');
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            position: 'absolute',
                                                                            top: '4px',
                                                                            right: '4px',
                                                                            background: 'transparent',
                                                                            border: 'none',
                                                                            cursor: 'pointer',
                                                                            padding: '4px',
                                                                            color: '#ef4444',
                                                                            opacity: 0.6
                                                                        }}
                                                                        title="Eliminar mi comentario"
                                                                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                                                        onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                                                                    >
                                                                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>✕</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Input Area */}
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                                    <textarea
                                                        value={commentInput}
                                                        onChange={(e) => setCommentInput(e.target.value)}
                                                        placeholder="Escribe un comentario..."
                                                        style={{
                                                            flex: 1,
                                                            minHeight: '60px',
                                                            padding: '10px',
                                                            borderRadius: '8px',
                                                            border: '1px solid #cbd5e1',
                                                            fontSize: '0.9rem',
                                                            resize: 'vertical',
                                                            outline: 'none',
                                                            fieldSizing: 'content' // Modern CSS for auto-grow
                                                        } as any}
                                                    />
                                                    <button
                                                        onClick={() => handleSendComment(row.id)}
                                                        disabled={!commentInput.trim() || isSendingComment}
                                                        style={{
                                                            padding: '10px 16px',
                                                            background: commentInput.trim() ? '#3E6AD8' : '#e2e8f0',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            fontWeight: 600,
                                                            cursor: commentInput.trim() ? 'pointer' : 'default',
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                            transition: 'background 0.2s',
                                                            height: '42px'
                                                        }}
                                                    >
                                                        <Send size={16} />
                                                        {isSendingComment ? '...' : 'Enviar'}
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        ))}
                        {sortedData.length === 0 && (
                            <tr>
                                <td colSpan={9} style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                                    <Package size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                                    <div>No hay pedidos de materias primas pendientes.</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Info footer */}
            <div style={{
                padding: '12px 16px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '0.75rem',
                color: '#64748b'
            }}>
                <strong>Nota:</strong> Introduzca la "Fecha Estimada" y los "kg enviados" cuando realice el envío. La "Fecha Recepción" se completará automáticamente al recibir el material.
            </div>
        </div>
    );
}
