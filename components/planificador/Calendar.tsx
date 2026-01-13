
'use client';

import { useState, useMemo } from 'react';
import { addDays, addMonths, format, startOfWeek, isSameDay, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { SHIFTS, BATCH_COLORS } from '@/lib/planner-constants';
import { ProductionBlock, Holiday, MaintenanceBlock } from '@/lib/planner-types';
import styles from './Calendar.module.css';

interface CalendarProps {
    blocks: ProductionBlock[];
    holidays: Holiday[];
    maintenance: MaintenanceBlock[];
    reactors: any[]; // Dynamic Reactors from DB
    onSlotClick: (date: Date, reactor: string, shift: string) => void;
    onBlockClick: (block: ProductionBlock) => void;
    highlightSlots: boolean;
    showWeekends: boolean;
    onToggleWeekends: (show: boolean) => void;
}

export default function Calendar({ blocks, holidays, maintenance, reactors, onSlotClick, onBlockClick, highlightSlots, showWeekends, onToggleWeekends }: CalendarProps) {
    const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

    const fullWeek = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
    const displayDays = showWeekends ? fullWeek : fullWeek.filter(d => !isWeekend(d));

    const getBatchColor = (label: string) => {
        return BATCH_COLORS[label] || BATCH_COLORS["DEFAULT"];
    };

    // OPTIMIZATION: Create a lookup map for instant access
    // Key format: "YYYY-MM-DD|REACTOR|SHIFT"
    const blockMap = useMemo(() => {
        const map = new Map<string, ProductionBlock>();
        blocks.forEach(b => {
            if (b.plannedDate && b.plannedReactor && b.plannedShift) {
                const dateKey = format(new Date(b.plannedDate), 'yyyy-MM-dd');
                const key = `${dateKey}| ${b.plannedReactor}| ${b.plannedShift} `;
                map.set(key, b);
            }
        });
        return map;
    }, [blocks]);

    // Use passed reactors instead of static constant
    // Assuming reactors have { name: string, description: string, ... }
    // We Map 'name' as the ID for logic.

    return (
        <div className={styles.container}>
            <div className={styles.header} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem 0.5rem', position: 'relative' }}>
                {/* Date Navigation - Centered */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={() => setStartDate(d => startOfWeek(addMonths(d, -1), { weekStartsOn: 1 }))} title="Mes Anterior" style={{ padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>{'<<'}</button>
                    <button onClick={() => setStartDate(d => addDays(d, -7))} title="Semana Anterior" style={{ padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>{'<'}</button>

                    <span style={{ fontWeight: 700, minWidth: '160px', textAlign: 'center', fontSize: '0.95rem' }}>
                        Semana {format(startDate, 'dd/MM/yyyy')}
                    </span>

                    <button onClick={() => setStartDate(d => addDays(d, 7))} title="Semana Siguiente" style={{ padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>{'>'}</button>
                    <button onClick={() => setStartDate(d => startOfWeek(addMonths(d, 1), { weekStartsOn: 1 }))} title="Mes Siguiente" style={{ padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>{'>>'}</button>
                </div>

                {/* Weekend Toggle - Absolute Right */}
                {onToggleWeekends && (
                    <label style={{ position: 'absolute', right: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', color: '#64748b' }}>
                        <input
                            type="checkbox"
                            checked={showWeekends}
                            onChange={e => onToggleWeekends(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                        />
                        Mostrar Fines de Semana
                    </label>
                )}
            </div>

            <div className={styles.grid}>
                {/* Header Row */}
                <div className={styles.headerRow}>
                    <div style={{
                        width: 80, minWidth: 80, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: '#475569',
                        textTransform: 'capitalize', textAlign: 'center', lineHeight: '1.2'
                    }}>
                        {format(startDate, 'MMMM yyyy', { locale: es })}
                    </div>
                    {displayDays.map(d => {
                        const isHol = holidays.some(h => isSameDay(new Date(h.date), d));
                        const isWk = isWeekend(d);

                        let headerStyle = {};
                        if (isHol || isWk) headerStyle = { color: '#dc2626', background: '#fee2e2', borderRadius: '4px' };

                        return (
                            <div key={d.toString()} className={styles.dayHeader} style={headerStyle}>
                                {format(d, 'EEEE dd', { locale: es })}
                            </div>
                        )
                    })}
                </div>

                {/* Rows */}
                {reactors && reactors.map(rDef => (
                    <div key={rDef.name} className={styles.reactorRow}>
                        <div className={styles.reactorLabel}>{rDef.name} <br /><span style={{ fontSize: '0.85em', fontWeight: 'bold' }}>{rDef.capacity > 0 ? `${rDef.capacity}L` : ''}</span></div>
                        <div className={styles.daysTrack}>
                            {displayDays.map(d => {
                                const isHol = holidays.some(h => isSameDay(new Date(h.date), d));
                                const isWk = isWeekend(d);

                                // Check Maintenance
                                const mainBlock = maintenance && maintenance.find(m => {
                                    if (m.reactorId !== rDef.name) return false;
                                    const start = new Date(m.startDate);
                                    const end = new Date(m.endDate);
                                    start.setHours(0, 0, 0, 0);
                                    end.setHours(23, 59, 59, 999);
                                    return d >= start && d <= end;
                                });

                                const isBlocked = isHol || isWk;
                                const isMaintenance = !!mainBlock;

                                let bg = 'transparent';
                                if (isMaintenance) bg = `repeating-linear-gradient(45deg, #cbd5e1, #cbd5e1 10px, #f8fafc 10px, #f8fafc 20px)`;
                                else if (isBlocked) bg = '#fef2f2';

                                return (
                                    <div key={d.toISOString()} className={styles.dayColumn} style={{ flex: 1, background: bg, position: 'relative', overflow: 'hidden' }}>
                                        {isMaintenance && (
                                            <div style={{
                                                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.6rem', color: '#334155', fontWeight: 800, zIndex: 5,
                                                transform: 'rotate(-45deg)',
                                                pointerEvents: 'none',
                                                whiteSpace: 'nowrap',
                                                opacity: 0.6
                                            }}>
                                                MANTENIMIENTO
                                            </div>
                                        )}
                                        {SHIFTS.map(shift => {
                                            // Find block using Optimized Map
                                            const dateKey = format(d, 'yyyy-MM-dd');
                                            const key = `${dateKey}| ${rDef.name}| ${shift} `;
                                            const block = blockMap.get(key);

                                            return (
                                                <div
                                                    key={shift}
                                                    className={styles.slot}
                                                    data-highlight={highlightSlots && !block && !isBlocked && !isMaintenance}
                                                    onClick={() => {
                                                        const isSlotBlocked = isHol || isWk;

                                                        if (block) {
                                                            if (onBlockClick) onBlockClick(block);
                                                        } else if (isMaintenance) {
                                                            alert(`Mantenimiento: ${mainBlock?.reason} `);
                                                        } else if (highlightSlots && !isSlotBlocked) {
                                                            onSlotClick(d, rDef.name, shift);
                                                        } else {
                                                            if (!highlightSlots) alert("Primero selecciona una ficha de la lista de pendientes.");
                                                            else if (isSlotBlocked) alert("Este espacio está bloqueado (festivo o fin de semana).");
                                                        }
                                                    }}
                                                    style={{ cursor: block ? 'pointer' : (isMaintenance ? 'not-allowed' : 'default') }}
                                                >
                                                    {block ? (
                                                        <div className={styles.block}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                                                <div style={{ fontSize: '0.8rem', lineHeight: '1.1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 700, color: '#1e293b', flex: 1, minWidth: 0 }} title={`${block.articleCode} | ${block.clientName || ''} `}>
                                                                    {block.articleCode} <span style={{ fontWeight: '400', color: '#64748b', fontSize: '0.7rem' }}>| {block.clientName || ''}</span>
                                                                </div>
                                                                <span className={styles.blockUnits} style={{ color: '#64748b', fontWeight: 'normal', fontSize: '0.7rem', flexShrink: 0, marginLeft: '4px' }}>#{block.orderNumber}</span>
                                                            </div>

                                                            <div style={{ fontSize: '0.65rem', color: '#475569', lineHeight: '1.2', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 'auto' }} title={block.articleDesc}>
                                                                {block.articleDesc}
                                                            </div>

                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '2px' }}>
                                                                <span className={styles.blockUnits} style={{ background: '#e0e7ff', color: '#3730a3', padding: '1px 4px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 600 }}>
                                                                    {block.units}kg
                                                                </span>
                                                                <span style={{
                                                                    fontSize: '0.65rem', fontWeight: 'bold', color: 'white',
                                                                    background: getBatchColor(block.batchLabel || 'T1'),
                                                                    padding: '1px 4px', borderRadius: '3px'
                                                                }}>
                                                                    {block.batchLabel || 'T1'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className={styles.slotLabel}>{!isBlocked && !isMaintenance ? shift[0] : ''}</span>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
}
