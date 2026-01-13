'use client';

import {
    useState, useMemo
} from 'react';
import {
    format, isSameDay, isSameWeek, isSameMonth, parseISO, isValid,
    addDays, subDays, addWeeks, subWeeks, addMonths, subMonths,
    startOfWeek, endOfWeek
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './ProductionTable.module.css';

export default function ProductionTable({ blocks, onBlockClick }: any) {
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
    const [currentDate, setCurrentDate] = useState(new Date());

    const handlePrev = () => {
        if (viewMode === 'day') setCurrentDate(d => subDays(d, 1));
        if (viewMode === 'week') setCurrentDate(d => subWeeks(d, 1));
        if (viewMode === 'month') setCurrentDate(d => subMonths(d, 1));
    };

    const handleNext = () => {
        if (viewMode === 'day') setCurrentDate(d => addDays(d, 1));
        if (viewMode === 'week') setCurrentDate(d => addWeeks(d, 1));
        if (viewMode === 'month') setCurrentDate(d => addMonths(d, 1));
    };

    // Format label based on view mode
    const dateLabel = useMemo(() => {
        if (viewMode === 'day') {
            return format(currentDate, "EEEE, d 'de' MMMM", { locale: es });
        }
        if (viewMode === 'week') {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            const end = endOfWeek(currentDate, { weekStartsOn: 1 });
            // If same month
            if (isSameMonth(start, end)) {
                return `${format(start, 'd', { locale: es })} - ${format(end, "d 'de' MMMM", { locale: es })}`;
            }
            return `${format(start, 'd MMM', { locale: es })} - ${format(end, "d MMM", { locale: es })}`;
        }
        if (viewMode === 'month') {
            return format(currentDate, 'MMMM yyyy', { locale: es }); // e.g., "Diciembre 2025"
        }
        return '';
    }, [viewMode, currentDate]);


    const filteredBlocks = useMemo(() => {
        const validBlocks = blocks.filter((b: any) =>
            (b.status === 'PLANNED' || b.status === 'PRODUCED') && b.plannedDate
        );

        return validBlocks.filter((b: any) => {
            const date = new Date(b.plannedDate);
            if (!isValid(date)) return false;

            if (viewMode === 'day') return isSameDay(date, currentDate);
            if (viewMode === 'week') return isSameWeek(date, currentDate, { weekStartsOn: 1 });
            if (viewMode === 'month') return isSameMonth(date, currentDate);
            return false;
        }).sort((a: any, b: any) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime());
    }, [blocks, viewMode, currentDate]);

    const getBatchColor = (label: string) => {
        const colors: Record<string, string> = {
            "T1": "#3b82f6", "T2": "#8b5cf6", "T3": "#f59e0b", "T4": "#ec4899", "T5": "#14b8a6",
        };
        return colors[label] || "#64748b";
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className={styles.title}>
                        Listado de Producción
                    </div>
                    {/* Navigation Contols */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '2px 4px' }}>
                        <button onClick={handlePrev} className={styles.navBtn}><ChevronLeft size={16} /></button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', minWidth: '140px', textAlign: 'center', textTransform: 'capitalize' }}>
                            {dateLabel}
                        </span>
                        <button onClick={handleNext} className={styles.navBtn}><ChevronRight size={16} /></button>
                    </div>
                </div>

                <div className={styles.filters}>
                    <button
                        className={styles.filterBtn}
                        data-active={viewMode === 'day'}
                        onClick={() => { setViewMode('day'); setCurrentDate(new Date()); }}
                    >
                        Día
                    </button>
                    <button
                        className={styles.filterBtn}
                        data-active={viewMode === 'week'}
                        onClick={() => { setViewMode('week'); setCurrentDate(new Date()); }}
                    >
                        Semana
                    </button>
                    <button
                        className={styles.filterBtn}
                        data-active={viewMode === 'month'}
                        onClick={() => { setViewMode('month'); setCurrentDate(new Date()); }}
                    >
                        Mes
                    </button>
                </div>
            </div>

            <div className={styles.tableContainer}>
                {filteredBlocks.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                        No hay fabricaciones planificadas para este periodo.
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Reactor / Turno</th>
                                <th>Orden</th>
                                <th>Artículo</th>
                                <th>Kg Teóricos</th>
                                <th>Realidad</th>
                                <th>Lote</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBlocks.map((block: any) => {
                                const date = new Date(block.plannedDate);
                                const hasReal = block.realKg !== null && block.realKg !== undefined;

                                return (
                                    <tr key={block.id} className={styles.row} onClick={() => onBlockClick(block)}>
                                        <td style={{ fontWeight: 500 }}>
                                            {format(date, 'dd MMM', { locale: es })}
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {format(date, 'EEEE', { locale: es })}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 600, color: '#334155' }}>{block.plannedReactor}</span>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{block.plannedShift}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{block.orderNumber}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{block.clientName || 'Sin Cliente'}</div>
                                        </td>
                                        <td>
                                            <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={block.articleDesc}>
                                                {block.articleDesc}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>{block.articleCode}</div>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 600 }}>{block.units} kg</span>
                                        </td>
                                        <td>
                                            {hasReal ? (
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span className={styles.realData}>{block.realKg} kg</span>
                                                    {block.realDuration && <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{block.realDuration} min</span>}
                                                </div>
                                            ) : (
                                                <span className={styles.missingData}>- Pendiente -</span>
                                            )}
                                        </td>
                                        <td>
                                            <span
                                                className={styles.tag}
                                                style={{ backgroundColor: getBatchColor(block.batchLabel) }}
                                            >
                                                {block.batchLabel || 'T1'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
