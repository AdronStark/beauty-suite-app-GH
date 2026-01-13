'use client';
import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCompany } from '@/context/CompanyContext';
import { useSession } from 'next-auth/react';
import { useAppConfig } from '@/context/AppConfigContext';
import { Toaster, toast } from 'sonner';
import PendingQueue from '@/components/planificador/PendingQueue';
import Calendar from '@/components/planificador/Calendar';
import StatsView from '@/components/planificador/StatsView';
import ConfigView from '@/components/planificador/ConfigView';
import BlockDetailsModal from '@/components/planificador/BlockDetailsModal';
import AutoPlanReportModal from '@/components/planificador/AutoPlanReportModal';
import MaintenanceModal from '@/components/planificador/MaintenanceModal';
import ProductionTable from '@/components/planificador/ProductionTable';
import ReportView from '@/components/planificador/ReportView';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Calendar as CalendarIcon, List as ListIcon, FileBarChart, Settings, ClipboardList } from 'lucide-react';
import styles from './page.module.css';
// Removed STATIC reactors import
import { ProductionBlock, Holiday, MaintenanceBlock } from '@/lib/planner-types';

export default function PlannerLayout({ initialBlocks, holidays, maintenance, reactors }: {
    initialBlocks: ProductionBlock[],
    holidays: Holiday[],
    maintenance: MaintenanceBlock[],
    reactors: any[] // Dynamic Reactors
}) {
    const [activeTab, setActiveTab] = useState<'planner' | 'stats' | 'reports' | 'config'>('planner');
    const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
    const [blocks, setBlocks] = useState(initialBlocks);

    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [autoPlanResults, setAutoPlanResults] = useState<any>(null);
    const [confirmConfig, setConfirmConfig] = useState<any>({
        isOpen: false, title: '', message: '', onConfirm: () => { }, isDangerous: false
    });

    // Sync state with prop
    useEffect(() => {
        setBlocks(initialBlocks);
    }, [initialBlocks]);

    // Selection for assigning
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

    // Selection for details (clicking on calendar/table)
    const [viewBlock, setViewBlock] = useState<any>(null);

    // Toggle
    const [showWeekends, setShowWeekends] = useState(false);

    // Search
    const [searchTerm, setSearchTerm] = useState('');

    // Derived
    const plannedBlocks = blocks.filter((b: any) => (b.status === 'PLANNED' || b.status === 'PRODUCED') && b.plannedDate);

    // Filter Pending Blocks based on search
    const allPending = blocks.filter((b: any) => b.status === 'PENDING' || !b.plannedDate);
    const pendingBlocks = allPending.filter((b: any) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (b.articleCode && b.articleCode.toLowerCase().includes(term)) ||
            (b.clientName && b.clientName.toLowerCase().includes(term)) ||
            (b.orderNumber && b.orderNumber.toLowerCase().includes(term))
        );
    });

    const router = useRouter();
    const { selectedCompanyId } = useCompany();
    const { data: session, status } = useSession();
    const { checkAccess } = useAppConfig();

    useEffect(() => {
        if (status === 'loading') return;

        // Strict Access Control via Central Config
        // Check if current user+company can access '/planificador'
        const canAccess = checkAccess('/planificador', session?.user?.role as string, selectedCompanyId);

        if (!canAccess) {
            toast.error("Acceso restringido: No tienes permisos para acceder a esta aplicación en el entorno actual.");
            router.push('/');
        }
    }, [selectedCompanyId, session, status, router, checkAccess]);

    // --- ACTIONS ---

    const handleSaveMaintenance = async (data: any) => {
        try {
            const res = await fetch('/api/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                router.refresh();
                toast.success('Cambios guardados');
            } else {
                toast.error('Error al guardar mantenimiento');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error de conexión');
        }
    };

    const handleDeleteMaintenance = async (id: string) => {
        if (!confirm('¿Eliminar este mantenimiento?')) return;
        try {
            const res = await fetch(`/api/maintenance/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                router.refresh();
                toast.success('Mantenimiento eliminado');
            } else {
                toast.error('Error al eliminar');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error de conexión');
        }
    };

    const handleAssign = async (blockId: string, date: Date, reactorName: string, shift: string) => {
        // 1. Find Block
        const block = blocks.find((b: any) => b.id === blockId);
        if (!block) return;

        // 2. Validation Logic
        const errors = [];

        // Maintenance Check
        const isMaintenance = maintenance && maintenance.some((m: any) => {
            if (m.reactorId !== reactorName) return false;
            const start = new Date(m.startDate);
            const end = new Date(m.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            return date >= start && date <= end;
        });

        if (isMaintenance) {
            errors.push(`⚠️ Alerta: El reactor ${reactorName} está en mantenimiento.`);
        }

        // Capacity Check using DYNAMIC Reactors
        const reactorDef = reactors.find(r => r.name === reactorName);
        const reactorCap = reactorDef ? reactorDef.capacity : 0;

        // Special case for Agitación: capacity 0 usually means "no limit" or "manual check".
        // If regular reactor has capacity > 0 check fit
        if (reactorCap > 0 && block.units > reactorCap) {
            errors.push(`⚠️ Capacidad excedida: El bloque (${block.units}kg) es mayor que el reactor ${reactorName} (${reactorCap}kg).`);
        }

        // Weekend Check
        const day = date.getDay();
        if (day === 0 || day === 6) {
            errors.push(`⚠️ Alerta: Estás planificando en fin de semana.`);
        }

        // Deadline Check
        if (block.deadline) {
            const d = new Date(block.deadline);
            if (date > d) {
                errors.push(`⚠️ Retraso: La fecha planificada es posterior al deadline (${d.toLocaleDateString()}).`);
            }
        }

        // Holiday Check
        const dateStr = date.toLocaleDateString('en-CA');
        const isHoliday = holidays.some((h: any) => {
            const hDate = new Date(h.date);
            return hDate.toLocaleDateString('en-CA') === dateStr;
        });
        if (isHoliday) {
            errors.push(`⚠️ Alerta: Estás planificando en un día festivo.`);
        }

        // Past Date Check
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
            errors.push(`⚠️ Alerta: Estás planificando en una fecha pasada (${date.toLocaleDateString()}).`);
        }

        // Definition of Execution Logic
        const executeAssignment = async () => {
            // Optimistic update
            const previousBlocks = [...blocks]; // Snapshot for rollback
            const updated = blocks.map((b: any) => {
                if (b.id === blockId) {
                    return {
                        ...b,
                        status: 'PLANNED',
                        plannedDate: date.toISOString(),
                        plannedReactor: reactorName,
                        plannedShift: shift
                    };
                }
                return b;
            });
            setBlocks(updated);
            setSelectedBlockId(null);
            setConfirmConfig(prev => ({ ...prev, isOpen: false })); // Close modal

            // Fix Timezone Issue: Normalize to Noon to ensure it stays in same day relative to UTC
            const normalizedDate = new Date(date);
            normalizedDate.setHours(12, 0, 0, 0);

            // API Call
            try {
                const res = await fetch('/api/planificador', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: blockId,
                        status: 'PLANNED',
                        plannedDate: normalizedDate,
                        plannedReactor: reactorName,
                        plannedShift: shift
                    })
                });

                if (!res.ok) {
                    console.error("DEBUG: Server responded with error status:", res.status, res.statusText);
                    throw new Error('Server responded with error');
                }
            } catch (e) {
                console.error("Failed to save assignment", e);
                toast.error("Error al guardar la asignación. Revirtiendo cambios...");
                setBlocks(previousBlocks); // Rollback
            }
        };

        // Confirmation or Execution
        if (errors.length > 0) {
            setConfirmConfig({
                isOpen: true,
                title: 'Confirmar Planificación con Conflictos',
                message: (
                    <div>
                        <p style={{ marginBottom: '1rem' }}>Se han detectado los siguientes conflictos:</p>
                        <ul style={{ paddingLeft: '1.2rem', marginBottom: '1.5rem', listStyleType: 'disc' }}>
                            {errors.map((err, i) => (
                                <li key={i} style={{ marginBottom: '0.5rem', color: '#b91c1c' }}>{err}</li>
                            ))}
                        </ul>
                        <p style={{ fontWeight: 600 }}>¿Deseas continuar de todas formas?</p>
                    </div>
                ),
                onConfirm: executeAssignment,
                isDangerous: false // It's a warning, not destructive like delete
            });
            return;
        }

        // Direct execution if no errors
        await executeAssignment();
    };

    const handleUnplan = async (blockId: string, reselect: boolean = false) => {
        const executeUnplan = async () => {
            // Optimistic
            const previousBlocks = [...blocks]; // Snapshot
            const updated = blocks.map((b: any) => {
                if (b.id === blockId) {
                    return {
                        ...b,
                        status: 'PENDING',
                        plannedDate: null,
                        plannedReactor: null,
                        plannedShift: null
                    };
                }
                return b;
            });
            setBlocks(updated);
            setViewBlock(null);
            setConfirmConfig(prev => ({ ...prev, isOpen: false })); // Close modal

            if (reselect) {
                setSelectedBlockId(blockId);
            }

            // API Call
            try {
                const res = await fetch('/api/planificador', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: blockId,
                        status: 'PENDING',
                        plannedDate: null,
                        plannedReactor: null,
                        plannedShift: null
                    })
                });

                if (!res.ok) throw new Error('Failed to unplan');

            } catch (e) {
                console.error("Failed to unplan", e);
                toast.error("Error al mover a pendientes. Revirtiendo...");
                setBlocks(previousBlocks); // Rollback
            }
        };

        setConfirmConfig({
            isOpen: true,
            title: 'Confirmar desplanificación',
            message: '¿Seguro que quieres desplanificar este bloque y devolverlo a la cola de pendientes?',
            onConfirm: executeUnplan,
            isDangerous: false
        });
    };

    const handleAutoPlan = async () => {
        const visibleIds = pendingBlocks.map((b: any) => b.id);
        const count = visibleIds.length;
        if (count === 0) {
            toast.info('No hay bloques pendientes visibles para planificar.');
            return;
        }

        if (!confirm(`¿Estás seguro de ejecutar la auto-planificación para los ${count} bloques VISIBLES?`)) return;

        try {
            const res = await fetch('/api/planificador/autoplan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetIds: visibleIds })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.details || 'Autoplan failed');
            }

            const data = await res.json();
            if (data.success) {
                setAutoPlanResults(data);
                toast.success('Propuesta de planificación generada');
                router.refresh();
            } else {
                toast.error('Error al ejecutar auto-planificación');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error de conexión o servidor');
        }
    };

    const handleSaveAutoPlan = async (finalResults: any[]) => {
        const loadingToast = toast.loading('Guardando planificación...');
        try {
            await Promise.all(finalResults.map(r =>
                fetch('/api/planificador', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: r.id,
                        status: 'PLANNED',
                        plannedDate: r.plannedDate,
                        plannedReactor: r.plannedReactor,
                        plannedShift: r.plannedShift
                    })
                })
            ));

            setAutoPlanResults(null);
            router.refresh();
            toast.success('Planificación actualizada y confirmada', { id: loadingToast });
        } catch (e) {
            console.error("Failed to save edited plan", e);
            alert('Error al guardar los cambios.');
        }
    };

    const handleSplit = async (blockId: string, units: number) => {
        if (!confirm(`¿Dividir esta fabricación de ${units}kg en tandas más pequeñas?`)) return;
        try {
            const res = await fetch('/api/planificador/split', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: blockId })
            });

            if (res.ok) {
                router.refresh();
                setSelectedBlockId(null); // Deselect after split
            } else {
                alert('Error al dividir');
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión');
        }
    };

    return (
        <div className="flex flex-col bg-slate-50 overflow-hidden" style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Toaster position="top-center" richColors />
            {/* Header Toolbar */}
            <div style={{
                background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0.5rem 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)', zIndex: 10, gap: '1rem',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                        Planificador de Producción
                    </h1>

                    {/* Tabs - now includes Informes */}
                    <div style={{ display: 'flex', gap: '2px', background: '#f1f5f9', borderRadius: '6px', padding: '2px' }}>
                        <button
                            onClick={() => setActiveTab('planner')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '4px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                                background: activeTab === 'planner' ? 'white' : 'transparent',
                                color: activeTab === 'planner' ? '#3b82f6' : '#64748b',
                                fontWeight: 600, fontSize: '0.85rem',
                                boxShadow: activeTab === 'planner' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            <CalendarIcon size={16} /> Planificador
                        </button>
                        <button
                            onClick={() => setActiveTab('stats')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '4px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                                background: activeTab === 'stats' ? 'white' : 'transparent',
                                color: activeTab === 'stats' ? '#3b82f6' : '#64748b',
                                fontWeight: 600, fontSize: '0.85rem',
                                boxShadow: activeTab === 'stats' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            <FileBarChart size={16} /> Estadísticas
                        </button>
                        <button
                            onClick={() => setActiveTab('reports')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '4px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                                background: activeTab === 'reports' ? 'white' : 'transparent',
                                color: activeTab === 'reports' ? '#3b82f6' : '#64748b',
                                fontWeight: 600, fontSize: '0.85rem',
                                boxShadow: activeTab === 'reports' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            <ClipboardList size={16} /> Informes
                        </button>
                        <button
                            onClick={() => setActiveTab('config')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '4px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                                background: activeTab === 'config' ? 'white' : 'transparent',
                                color: activeTab === 'config' ? '#3b82f6' : '#64748b',
                                fontWeight: 600, fontSize: '0.85rem',
                                boxShadow: activeTab === 'config' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            <Settings size={16} /> Configuración
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {activeTab === 'planner' && (
                        <>
                            {/* View Toggle only */}
                            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', padding: '2px' }}>
                                <button
                                    onClick={() => setViewMode('calendar')}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        padding: '4px 8px', border: 'none', background: viewMode === 'calendar' ? 'white' : 'transparent',
                                        borderRadius: '4px', cursor: 'pointer', color: viewMode === 'calendar' ? '#3b82f6' : '#64748b',
                                        fontWeight: 500, boxShadow: viewMode === 'calendar' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                    }}
                                    title="Vista Calendario"
                                >
                                    <CalendarIcon size={16} /> Calendario
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        padding: '4px 8px', border: 'none', background: viewMode === 'table' ? 'white' : 'transparent',
                                        borderRadius: '4px', cursor: 'pointer', color: viewMode === 'table' ? '#3b82f6' : '#64748b',
                                        fontWeight: 500, boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                    }}
                                    title="Vista Tabla"
                                >
                                    <ListIcon size={16} /> Listado
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modals */}
            {viewBlock && (
                <BlockDetailsModal
                    block={viewBlock}
                    onClose={() => setViewBlock(null)}
                    onUnplan={handleUnplan}
                />
            )}


            {showMaintenanceModal && (
                <MaintenanceModal
                    maintenance={maintenance}
                    reactors={reactors}
                    onClose={() => setShowMaintenanceModal(false)}
                    onSave={handleSaveMaintenance}
                    onDelete={handleDeleteMaintenance}
                />
            )}

            {autoPlanResults && (
                <AutoPlanReportModal
                    results={autoPlanResults.results || []}
                    planned={autoPlanResults.planned}
                    splits={autoPlanResults.splits}
                    existingBlocks={blocks}
                    reactors={reactors}
                    onClose={() => setAutoPlanResults(null)}
                    onSave={handleSaveAutoPlan}
                />
            )}

            {/* Content Area */}
            <div className={styles.content}>
                {activeTab === 'planner' && (
                    <div className={styles.plannerGrid}>
                        <div className={styles.sidebar}>
                            <PendingQueue
                                blocks={pendingBlocks}
                                onSelect={setSelectedBlockId}
                                selectedId={selectedBlockId}
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                onAutoPlan={handleAutoPlan}
                                onSplit={handleSplit}
                            />
                        </div>
                        <div className={styles.main}>

                            {viewMode === 'calendar' ? (
                                <Calendar
                                    blocks={plannedBlocks}
                                    holidays={holidays}
                                    maintenance={maintenance}
                                    reactors={reactors} // PASS REACTORS
                                    showWeekends={showWeekends}
                                    onToggleWeekends={setShowWeekends}
                                    highlightSlots={!!selectedBlockId}
                                    onSlotClick={(date: Date, reactor: string, shift: string) => {
                                        if (selectedBlockId) {
                                            handleAssign(selectedBlockId, date, reactor, shift);
                                        }
                                    }}
                                    onBlockClick={(b: any) => {
                                        const allSiblings = blocks.filter((other: any) =>
                                            other.orderNumber === b.orderNumber &&
                                            other.articleCode === b.articleCode // Ensure same article
                                        );
                                        allSiblings.sort((a: any, b: any) => (a.batchLabel || '').localeCompare(b.batchLabel || ''));
                                        setViewBlock({ ...b, relatedBlocks: allSiblings });
                                    }}
                                />
                            ) : (
                                <ProductionTable
                                    blocks={plannedBlocks}
                                    onBlockClick={(b: any) => {
                                        const allSiblings = blocks.filter((other: any) =>
                                            other.orderNumber === b.orderNumber &&
                                            other.articleCode === b.articleCode // Ensure same article
                                        );
                                        allSiblings.sort((a: any, b: any) => (a.batchLabel || '').localeCompare(b.batchLabel || ''));
                                        setViewBlock({ ...b, relatedBlocks: allSiblings });
                                    }}
                                />
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'stats' && <StatsView blocks={blocks} holidays={holidays} reactors={reactors} />}

                {activeTab === 'reports' && <ReportView blocks={blocks} />}

                {activeTab === 'config' && <ConfigView onShowMaintenance={() => setShowMaintenanceModal(true)} />}

                <ConfirmationModal
                    isOpen={confirmConfig.isOpen}
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                    onConfirm={confirmConfig.onConfirm}
                    onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                    isDangerous={confirmConfig.isDangerous}
                />
            </div>
        </div>
    );
}
