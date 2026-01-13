'use client';

import { useState, useMemo } from 'react';
import { format, isValid } from 'date-fns';
import * as XLSX from 'xlsx';
import { Printer, Download, Search, FileBarChart } from 'lucide-react';
import styles from './ReportModal.module.css';

export default function ReportView({ blocks }: { blocks: any[] }) {
    const today = new Date();
    const [startDate, setStartDate] = useState(format(today, 'yyyy-MM-01'));
    const [endDate, setEndDate] = useState(format(today, 'yyyy-MM-dd'));
    const [clientFilter, setClientFilter] = useState('');
    const [articleFilter, setArticleFilter] = useState('');

    const filteredData = useMemo(() => {
        return (blocks || []).filter((b: any) => {
            if (b.status !== 'PLANNED' && b.status !== 'PRODUCED') return false;
            if (!b.plannedDate) return false;

            const date = new Date(b.plannedDate);
            if (!isValid(date)) return false;

            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            if (date < start || date > end) return false;

            if (clientFilter) {
                const client = b.clientName || '';
                if (!client.toLowerCase().includes(clientFilter.toLowerCase())) return false;
            }

            if (articleFilter) {
                const article = `${b.articleCode} ${b.articleDesc}`;
                if (!article.toLowerCase().includes(articleFilter.toLowerCase())) return false;
            }

            return true;
        }).sort((a: any, b: any) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime());
    }, [blocks, startDate, endDate, clientFilter, articleFilter]);

    const handleExportExcel = () => {
        const data = filteredData.map((b: any) => ({
            Fecha: format(new Date(b.plannedDate), 'dd/MM/yyyy'),
            Reactor: b.plannedReactor,
            Turno: b.plannedShift,
            Cliente: b.clientName,
            Orden: b.orderNumber,
            Codigo: b.articleCode,
            Articulo: b.articleDesc,
            Lote: b.batchLabel,
            Kg_Teoricos: b.units,
            Kg_Reales: b.realKg || '',
            Duracion_Real: b.realDuration || '',
            Estado: b.status
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Planificación");
        XLSX.writeFile(wb, `Planificacion_${startDate}_${endDate}.xlsx`);
    };

    const handlePrint = () => {
        window.print();
    };

    const totalKg = filteredData.reduce((sum: number, b: any) => sum + (b.units || 0), 0);
    const totalRealKg = filteredData.reduce((sum: number, b: any) => sum + (b.realKg || 0), 0);

    return (
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div className={styles.header} style={{ background: '#f8fafc' }}>
                <div className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Generador de Informes
                </div>
            </div>

            <div className={styles.body} style={{ flex: 1, overflowY: 'auto' }}>
                {/* Filters */}
                <div className={styles.filterSection}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Desde</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Hasta</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Cliente</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="Buscar cliente..."
                            value={clientFilter}
                            onChange={e => setClientFilter(e.target.value)}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Artículo</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="Código o Nombre..."
                            value={articleFilter}
                            onChange={e => setArticleFilter(e.target.value)}
                        />
                    </div>
                </div>

                {/* Preview Table */}
                <div className={styles.previewSection}>
                    <div className={styles.previewHeader}>
                        <span>Vista Previa ({filteredData.length} registros)</span>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <span>Total Teórico: <b>{totalKg.toLocaleString()} kg</b></span>
                            {totalRealKg > 0 && <span style={{ color: '#10b981' }}>Total Real: <b>{totalRealKg.toLocaleString()} kg</b></span>}
                        </div>
                    </div>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Reactor</th>
                                    <th>Cliente</th>
                                    <th>Artículo</th>
                                    <th>Lote</th>
                                    <th>Kg</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((b: any) => (
                                    <tr key={b.id}>
                                        <td>{format(new Date(b.plannedDate), 'dd/MM/yyyy')}</td>
                                        <td>{b.plannedReactor}</td>
                                        <td>{b.clientName}</td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{b.articleCode}</div>
                                            <div style={{ fontSize: '0.8em', color: '#64748b' }}>{b.articleDesc}</div>
                                        </td>
                                        <td>{b.batchLabel}</td>
                                        <td>
                                            <div>{b.units} kg</div>
                                            {b.realKg && <div style={{ fontSize: '0.8em', color: '#10b981' }}>Real: {b.realKg}</div>}
                                        </td>
                                    </tr>
                                ))}
                                {filteredData.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                            No hay datos que coincidan con los filtros.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className={styles.footer}>
                <button onClick={handlePrint} className={`${styles.btn} ${styles.btnPrimary}`}>
                    <Printer size={18} /> Imprimir / PDF
                </button>
                <button onClick={handleExportExcel} className={`${styles.btn} ${styles.btnSecondary}`}>
                    <Download size={18} /> Exportar Excel
                </button>
            </div>
        </div>
    );
}
