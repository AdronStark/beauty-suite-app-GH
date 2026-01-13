'use strict';
'use client';

import { useState, useMemo } from 'react';
import { Package, Truck, CheckCircle, Clock, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ProductionBlock } from '@prisma/client'; // Assuming types available, or use any if needed temporarily

interface OrdersListClientProps {
    orders: any[]; // Using any to avoid strict type issues with relation fields not in basic ProductionBlock
}

export default function OrdersListClient({ orders }: OrdersListClientProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

    const toggleSort = () => {
        if (sortOrder === null) setSortOrder('asc');
        else if (sortOrder === 'asc') setSortOrder('desc');
        else setSortOrder(null);
    };

    const filteredOrders = useMemo(() => {
        let result = orders.filter(order => {
            // Text Search
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                (order.articleDesc || '').toLowerCase().includes(searchLower) ||
                (order.orderNumber || '').toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;

            // Status Filter
            const isCompleted = order.status === 'PRODUCED';
            if (filter === 'active') return !isCompleted;
            if (filter === 'completed') return isCompleted;

            return true;
        });

        // Sorting
        if (sortOrder) {
            result.sort((a, b) => {
                const dateA = a.deadline ? new Date(a.deadline).getTime() : (sortOrder === 'asc' ? Number.MAX_SAFE_INTEGER : 0);
                const dateB = b.deadline ? new Date(b.deadline).getTime() : (sortOrder === 'asc' ? Number.MAX_SAFE_INTEGER : 0);

                if (dateA === dateB) return 0;

                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            });
        }

        return result;
    }, [orders, searchTerm, filter, sortOrder]);

    return (
        <div>
            {/* HEADER & CONTROLS */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-text-heading)', letterSpacing: '-0.025em' }}>
                    Producción en Curso
                </h1>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Search Bar */}
                    <div style={{ position: 'relative', flexGrow: 1, maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Buscar por producto o lote..."
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
                            title={sortOrder === 'asc' ? 'Fecha Estimada (Próxima primero)' : sortOrder === 'desc' ? 'Fecha Estimada (Lejana primero)' : 'Ordenar por fecha'}
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

            {/* ORDERS LIST */}
            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {filteredOrders.length === 0 ? (
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
                        <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No se encontraron pedidos.</p>
                        <p style={{ fontSize: '0.9rem' }}>Intenta ajustar tus filtros de búsqueda.</p>
                    </div>
                ) : (
                    filteredOrders.map(o => <OrderTracker key={o.id} order={o} />)
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

function OrderTracker({ order }: { order: any }) {
    // Status Flow: PENDING -> PLANNED -> PRODUCED
    const steps = [
        { label: 'Recibido', icon: <Clock size={16} /> },
        { label: 'Planificado', icon: <CheckCircle size={16} /> },
        { label: 'Fabricación', icon: <Package size={16} /> },
        { label: 'Envío', icon: <Truck size={16} /> }
    ];

    let activeIndex = 0;
    // Logic mapping (Simplified for demo, can be refined based on real status details)
    if (order.status === 'PENDING') activeIndex = 1;
    else if (order.status === 'PLANNED') activeIndex = 2; // Is planned
    else if (order.status === 'IN_PROGRESS') activeIndex = 3; // If we had this status
    else if (order.status === 'PRODUCED') activeIndex = 4; // Complete

    // Refinement: If PLANNED and start date is passed/today, maybe show as Fabrication?
    // For now stick to simple status mapping.

    const progress = (activeIndex / steps.length) * 100;
    // Adjust progress bar visually to connect centers of circles
    // 4 steps = 3 intervals. 
    // Step 0: 0%
    // Step 1: 33% (1/3)
    // Step 2: 66% (2/3)
    // Step 3: 100% (3/3)
    const visualProgress = Math.max(0, Math.min(100, ((activeIndex - 0.5) / (steps.length - 1)) * 100));


    return (
        <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '16px', // Slightly tighter radius
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
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{
                        width: '48px', height: '48px',
                        background: 'var(--color-secondary)',
                        borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-primary)'
                    }}>
                        <Package size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-heading)', marginBottom: '0.25rem', lineHeight: 1.2 }}>
                            {order.articleDesc}
                        </h2>
                        <div style={{ color: '#64748b', fontSize: '0.85rem', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{ background: '#f8fafc', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                Lote: {order.orderNumber || 'Pendiente'}
                            </span>
                            <span>{order.units} Uds</span>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>Entrega Estimada</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '6px', border: '1px solid #d1fae5', display: 'inline-block' }}>
                        {order.deadline ? new Date(order.deadline).toLocaleDateString() : 'Por confirmar'}
                    </div>
                </div>
            </div>

            {/* TRACKER VISUAL */}
            <div style={{ position: 'relative', marginTop: '1.5rem', padding: '0 0.5rem' }}>
                {/* Bar Background */}
                <div style={{ position: 'absolute', top: '15px', left: '20px', right: '20px', height: '3px', background: '#f1f5f9', borderRadius: '4px', zIndex: 0 }}></div>

                {/* Active Bar */}
                <div style={{
                    position: 'absolute', top: '15px', left: '20px',
                    height: '3px', background: '#3b82f6', borderRadius: '4px', zIndex: 0,
                    width: `calc(${visualProgress}% - 40px)`, // Rough calc, CSS relative width is tricky for perfect center-to-center
                    maxWidth: 'calc(100% - 40px)',
                    transition: 'width 1s ease'
                }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                    {steps.map((step, idx) => {
                        const isCompleted = idx < activeIndex;
                        const isCurrent = idx === activeIndex - 1; // Current active step

                        // Calculate if this step is "covered" by progress
                        const stepPercent = (idx / (steps.length - 1)) * 100;
                        const covered = stepPercent <= visualProgress;

                        return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '80px' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: isCompleted || (isCurrent && covered) ? '#3b82f6' : 'white',
                                    border: isCompleted || (isCurrent && covered) ? 'none' : '2px solid #e2e8f0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: isCompleted || (isCurrent && covered) ? 'white' : '#cbd5e1',
                                    boxShadow: isCurrent ? '0 0 0 4px rgba(59, 130, 246, 0.15)' : 'none',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {step.icon}
                                </div>
                                <span style={{
                                    fontSize: '0.75rem',
                                    textAlign: 'center',
                                    color: isCompleted ? '#1e293b' : '#94a3b8',
                                    fontWeight: isCompleted ? 600 : 400
                                }}>
                                    {step.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
