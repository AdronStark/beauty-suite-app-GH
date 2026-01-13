'use client';
import { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Upload, Calendar as CalIcon, Trash2, Plus, AlertTriangle, Search, CheckCircle, ChevronDown, ChevronRight, Settings, Zap, BarChart3, Wrench, Database } from 'lucide-react';
import { read, utils } from 'xlsx';
import { format, isAfter, parseISO, eachDayOfInterval } from 'date-fns';
import { toast } from 'sonner';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function ConfigView({ onShowMaintenance }: { onShowMaintenance?: () => void }) {
    const [activeSubTab, setActiveSubTab] = useState<'system' | 'reactors' | 'import' | 'holidays' | 'maintenance'>('system');

    return (
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Sub-Tabs Nav */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <button
                    onClick={() => setActiveSubTab('system')}
                    style={{
                        padding: '1rem', border: 'none', background: 'none',
                        borderBottom: activeSubTab === 'system' ? '2px solid #4f46e5' : '2px solid transparent',
                        color: activeSubTab === 'system' ? '#4f46e5' : '#64748b', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <Settings size={18} /> Sistema
                </button>
                <button
                    onClick={() => setActiveSubTab('reactors')}
                    style={{
                        padding: '1rem', border: 'none', background: 'none',
                        borderBottom: activeSubTab === 'reactors' ? '2px solid #4f46e5' : '2px solid transparent',
                        color: activeSubTab === 'reactors' ? '#4f46e5' : '#64748b', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <Database size={18} /> Reactores
                </button>
                <button
                    onClick={() => setActiveSubTab('import')}
                    style={{
                        padding: '1rem', border: 'none', background: 'none',
                        borderBottom: activeSubTab === 'import' ? '2px solid #4f46e5' : '2px solid transparent',
                        color: activeSubTab === 'import' ? '#4f46e5' : '#64748b', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <Upload size={18} /> Importar Datos
                </button>
                <button
                    onClick={() => setActiveSubTab('holidays')}
                    style={{
                        padding: '1rem', border: 'none', background: 'none',
                        borderBottom: activeSubTab === 'holidays' ? '2px solid #4f46e5' : '2px solid transparent',
                        color: activeSubTab === 'holidays' ? '#4f46e5' : '#64748b', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <CalIcon size={18} /> Calendario
                </button>
                <button
                    onClick={() => setActiveSubTab('maintenance')}
                    style={{
                        padding: '1rem', border: 'none', background: 'none',
                        borderBottom: activeSubTab === 'maintenance' ? '2px solid #4f46e5' : '2px solid transparent',
                        color: activeSubTab === 'maintenance' ? '#4f46e5' : '#64748b', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <Wrench size={18} /> Mantenimiento
                </button>
            </div>

            <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                {activeSubTab === 'system' && <SystemConfigPanel />}
                {activeSubTab === 'reactors' && <ReactorsManagePanel />}
                {activeSubTab === 'import' && <ImportDataPanel />}
                {activeSubTab === 'holidays' && <HolidaysPanel />}
                {activeSubTab === 'maintenance' && (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Mantenimiento de Reactores</h3>
                        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                            Gestiona los periodos de mantenimiento programado de los reactores.
                        </p>
                        <button
                            onClick={onShowMaintenance}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                background: '#4f46e5', color: 'white', border: 'none',
                                padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            🔧 Abrir Gestor de Mantenimiento
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- SUB-PANEL: SYSTEM CONFIG ---
function SystemConfigPanel() {
    const [config, setConfig] = useState({
        shifts_count: "2",
        // Auto-Plan Rules
        ap_batchLimit: "2000",
        ap_minDaysAfterOrder: "28",
        ap_bufferDaysBeforeDeadline: "15",
        ap_maxWindowDays: "35"
    });
    const [loading, setLoading] = useState(true);

    // Fetch config on mount
    useState(() => {
        fetch('/api/configuration')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setConfig(prev => ({ ...prev, ...data }));
                }
                setLoading(false);
            })
            .catch(err => console.error(err));
    });

    const handleChange = (key: string, val: string) => {
        setConfig({ ...config, [key]: val });
    };

    const saveConfig = async () => {
        try {
            await fetch('/api/configuration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            toast.success('Configuración guardada correctamente');
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar configuración');
        }
    };

    if (loading) return <div>Cargando configuración...</div>;

    return (
        <div style={{ width: '100%' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Configuración General</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
                {/* Sistema y Turnos Card */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', marginBottom: '1.25rem', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Settings size={18} /> Sistema y Turnos
                    </h4>
                    <div>
                        <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Número de Turnos Diarios</label>
                        <select
                            value={config.shifts_count}
                            onChange={e => handleChange('shifts_count', e.target.value)}
                            style={{ padding: '0.5rem', width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px', background: 'white' }}
                        >
                            <option value="1">1 Turno</option>
                            <option value="2">2 Turnos (M/T)</option>
                            <option value="3">3 Turnos (M/T/N)</option>
                        </select>
                        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                            Afecta al cálculo de eficiencia y capacidad diaria (Target = Lote * Turnos).
                        </p>
                    </div>
                </div>

                {/* Reglas de Auto-Planificación Card */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', marginBottom: '1.25rem', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={18} /> Reglas de Auto-Planificación
                    </h4>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Límite Lote (kg) <span style={{ color: '#94a3b8' }}>(División auto)</span></label>
                            <input type="number" value={config.ap_batchLimit} onChange={e => handleChange('ap_batchLimit', e.target.value)} style={{ padding: '0.5rem', width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Días Bloqueo <span style={{ color: '#94a3b8' }}>(Tras fecha pedido)</span></label>
                            <input type="number" value={config.ap_minDaysAfterOrder} onChange={e => handleChange('ap_minDaysAfterOrder', e.target.value)} style={{ padding: '0.5rem', width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Buffer Entrega <span style={{ color: '#94a3b8' }}>(Días antes deadline)</span></label>
                            <input type="number" value={config.ap_bufferDaysBeforeDeadline} onChange={e => handleChange('ap_bufferDaysBeforeDeadline', e.target.value)} style={{ padding: '0.5rem', width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Ventana <span style={{ color: '#94a3b8' }}>(Días vista)</span></label>
                            <input type="number" value={config.ap_maxWindowDays} onChange={e => handleChange('ap_maxWindowDays', e.target.value)} style={{ padding: '0.5rem', width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                        </div>
                    </div>
                </div>
            </div>

            <button onClick={saveConfig} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#4f46e5', color: 'white', border: 'none',
                padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer',
                marginTop: '2rem'
            }}>
                <Save size={18} /> Guardar Configuración
            </button>
        </div>
    );
}

// --- SUB-PANEL: REACTORS MANAGEMENT ---
function ReactorsManagePanel() {
    const router = useRouter();
    const [reactors, setReactors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [shiftsConfig, setShiftsConfig] = useState(2); // Default

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        capacity: '',
        plant: 'Coper'
    });
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false, title: '', message: '', onConfirm: () => { }, isDangerous: false
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [rRes, cRes] = await Promise.all([
                fetch('/api/planificador/reactors'),
                fetch('/api/configuration')
            ]);

            const rData = await rRes.json();
            const cData = await cRes.json();

            // Handle potential array vs object returns safely
            if (Array.isArray(rData)) {
                setReactors(rData);
            } else {
                setReactors([]);
            }

            // shifts_count from config
            if (cData && cData.shifts_count) {
                setShiftsConfig(parseInt(cData.shifts_count));
            }
        } catch (e) {
            console.error(e);
            alert("Error cargando datos");
        } finally {
            setLoading(false);
        }
    };

    useState(() => {
        loadData();
    });

    const resetForm = () => {
        setEditingId(null);
        setFormData({ name: '', description: '', capacity: '', plant: 'Coper' });
    };

    const handleEdit = (r: any) => {
        setEditingId(r.id);
        setFormData({
            name: r.name,
            description: r.description || '',
            capacity: r.capacity.toString(),
            plant: r.plant
        });
    };

    const handleDelete = async (id: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Eliminar Reactor',
            message: '¿Estás seguro de eliminar este reactor? Esta acción no se puede deshacer.',
            isDangerous: true,
            onConfirm: async () => {
                try {
                    await fetch(`/api/planificador/reactors/${id}`, { method: 'DELETE' });
                    toast.success("Reactor eliminado");
                    loadData();
                } catch (e) {
                    toast.error("Error al eliminar");
                }
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleSave = async () => {
        if (!formData.name || !formData.capacity) {
            alert("Nombre y Capacidad son obligatorios");
            return;
        }

        const payload = {
            ...formData,
            dailyTarget: Number(formData.capacity) * shiftsConfig // Helper calculation, though dynamically used in dashboard
        };

        try {
            if (editingId) {
                // Update
                await fetch(`/api/planificador/reactors/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                // Create
                const res = await fetch('/api/planificador/reactors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    const err = await res.json();
                    alert(err.error || "Error al crear");
                    return;
                }
            }
            resetForm();
            resetForm();
            loadData();
            router.refresh();
        } catch (e) {
            toast.error("Error al guardar");
        }
    };

    if (loading) return <div>Cargando reactores...</div>;

    return (
        <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Gestión de Reactores</h3>
                <div style={{ background: '#e0e7ff', color: '#4338ca', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                    Configuración Global: {shiftsConfig} Turnos/Día
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 2fr) minmax(300px, 1fr)', gap: '2rem' }}>
                {/* List */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#64748b' }}>Nombre</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#64748b' }}>Descripción</th>
                                <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#64748b' }}>Cap. Lote</th>
                                <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#64748b' }}>Obj. Diario*</th>
                                <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#64748b' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reactors.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{r.name}</td>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#64748b' }}>{r.description}</td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'monospace' }}>{r.capacity} kg</td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'monospace', color: '#059669', fontWeight: 600 }}>
                                        {r.capacity * shiftsConfig} kg
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleEdit(r)} style={{ border: 'none', background: 'none', color: '#3b82f6', cursor: 'pointer' }} title="Editar">
                                                <Settings size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(r.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }} title="Eliminar">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {reactors.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                        No hay reactores definidos.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#94a3b8', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                        * Objetivo Diario calculado dinámicamente según turno global.
                    </div>
                </div>

                {/* Form */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#334155' }}>
                        {editingId ? 'Editar Reactor' : 'Nuevo Reactor'}
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>Código (ID)</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: R5"
                                disabled={!!editingId}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>Descripción</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Ej: Reactor Especial 300L"
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>Capacidad Lote (Kg)</label>
                            <input
                                type="number"
                                value={formData.capacity}
                                onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                                placeholder="0"
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button
                                onClick={handleSave}
                                style={{ flex: 1, background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}
                            >
                                {editingId ? 'Actualizar' : 'Crear'}
                            </button>
                            {editingId && (
                                <button
                                    onClick={resetForm}
                                    style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </div>
                </div>

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

// --- SUB-PANEL: IMPORT DATA ---
function ImportDataPanel() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false, title: '', message: '', onConfirm: () => { }, isDangerous: false
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus('processing');
        setMsg('Leyendo archivo...');

        try {
            const arrayBuffer = await file.arrayBuffer();
            const wb = read(arrayBuffer);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const updatedData = utils.sheet_to_json(ws);

            console.log("Imported Data Preview:", updatedData.slice(0, 3));

            // Send to API
            const response = await fetch('/api/planificador/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });

            const result = await response.json();

            if (result.success) {
                setStatus('success');
                setMsg(`Carga completada: ${result.stats.processed} procesados, ${result.stats.created} nuevos, ${result.stats.updated} actualizados, ${result.stats.closed} marcados como realizados. (Omitidos: ${result.stats.skipped || 0}). Clientes Nuevos: ${result.stats.newClients || 0}.`);
                router.refresh();
            } else {
                throw new Error(result.error || 'Error desconocido');
            }

        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setMsg(err.message || 'Error al procesar el archivo. Asegúrate de que es un Excel válido.');
        }
    };

    const handleClearPending = async () => {
        setConfirmConfig({
            isOpen: true,
            title: 'Eliminar Producción Pendiente',
            message: '¿Estás seguro de ELIMINAR TODAS las fabricaciones pendientes? Esta acción no se puede deshacer.',
            isDangerous: true,
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                setStatus('processing');
                setMsg('Eliminando registros...');

                try {
                    const response = await fetch('/api/planificador/clear-pending', { method: 'POST' });
                    const result = await response.json();

                    if (result.success) {
                        setStatus('success');
                        setMsg(`Se han eliminado ${result.count} registros pendientes.`);
                        router.refresh();
                    } else {
                        throw new Error(result.error);
                    }
                } catch (err: any) {
                    console.error(err);
                    setStatus('error');
                    setMsg(err.message || 'Error al eliminar registros.');
                }
            }
        });
    };

    return (
        <div style={{ width: '100%' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Carga Datos ERP</h3>
            <p style={{ marginBottom: '2rem', color: '#64748b', fontSize: '0.9rem' }}>
                Sube un archivo Excel (.xlsx) o CSV con el listado de pedidos pendientes de fabricación.
                El sistema sincronizará los datos manteniendo la planificación existente.
            </p>

            <div style={{
                border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '3rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '1rem', background: '#f8fafc', marginBottom: '2rem'
            }}>
                <Upload size={48} color="#94a3b8" />
                <div style={{ textAlign: 'center' }}>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Seleccionar Archivo
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" hidden />
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Máximo 5MB</p>
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #fecaca', borderRadius: '8px', background: '#fef2f2' }}>
                <h3 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Zona de Peligro</h3>
                <p style={{ fontSize: '0.9rem', color: '#b91c1c', marginBottom: '1rem' }}>
                    Acciones destructivas. Úsalo con cautela.
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={handleClearPending}
                        style={{
                            padding: '0.5rem 1rem', background: '#dc2626', color: 'white',
                            borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600
                        }}
                    >
                        Eliminar Pendientes
                    </button>
                    <button
                        onClick={async () => {
                            setConfirmConfig({
                                isOpen: true,
                                title: 'ELIMINAR TODO',
                                message: "⚠️ ¿ELIMINAR ABSOLUTAMENTE TODO?\n\nSe borrarán todas las fabricaciones, tanto pendientes como planificadas.\nEsta acción no se puede deshacer.",
                                isDangerous: true,
                                onConfirm: async () => {
                                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                                    try {
                                        const res = await fetch('/api/planificador/clear-all', { method: 'POST' });
                                        if (res.ok) {
                                            toast.success("Todo eliminado.");
                                            router.refresh();
                                        } else toast.error("Error al eliminar");
                                    } catch (e) { console.error(e); toast.error("Error de conexión"); }
                                }
                            });
                        }}
                        style={{
                            padding: '0.5rem 1rem', background: '#7f1d1d', color: 'white',
                            borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600
                        }}
                    >
                        ☢️ ELIMINAR TODO
                    </button>
                </div>
            </div>

            {status !== 'idle' && (
                <div style={{
                    padding: '1rem', borderRadius: '6px',
                    background: status === 'success' ? '#f0fdf4' : (status === 'error' ? '#fef2f2' : '#eff6ff'),
                    color: status === 'success' ? '#166534' : (status === 'error' ? '#991b1b' : '#1e40af'),
                    border: `1px solid ${status === 'success' ? '#bbf7d0' : (status === 'error' ? '#fecaca' : '#bfdbfe')}`
                }}>
                    <strong>{status === 'processing' ? 'Procesando...' : (status === 'success' ? '¡Éxito!' : 'Error')}</strong>
                    <p style={{ margin: 0 }}>{msg}</p>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                isDangerous={confirmConfig.isDangerous}
            />
        </div>
    );
}

// --- SUB-PANEL: HOLIDAYS ---
function HolidaysPanel() {
    const router = useRouter(); // To refresh calendar
    const [holidays, setHolidays] = useState<any[]>([]);
    const [newDate, setNewDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isRange, setIsRange] = useState(false);
    const [newDesc, setNewDesc] = useState('');
    const [loading, setLoading] = useState(true);
    const [collapsedYears, setCollapsedYears] = useState<string[]>([]);

    const toggleYear = (year: string) => {
        setCollapsedYears(prev =>
            prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
        );
    };

    // Grouping logic
    const groupedHolidays = useMemo(() => {
        const groups: { [year: string]: any[] } = {};

        // Sort all holidays by date ASC
        const sorted = [...holidays].sort((a: any, b: any) => a.date.localeCompare(b.date));

        sorted.forEach((h: any) => {
            const year = h.date.split('-')[0];
            if (!groups[year]) groups[year] = [];
            groups[year].push(h);
        });

        // Return keys (years) sorted DESC
        return Object.keys(groups)
            .sort((a, b) => b.localeCompare(a))
            .map(year => ({
                year,
                items: groups[year]
            }));
    }, [holidays]);

    // Conflict state
    const [conflicts, setConflicts] = useState<{ count: number, ids: string[] } | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isResolving, setIsResolving] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false, title: '', message: '', onConfirm: () => { }, isDangerous: false
    });

    // Load initial
    useState(() => {
        fetch('/api/configuration/holidays')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Map to local format
                    setHolidays(data.map((d: any) => ({
                        id: d.id || Math.random(),
                        date: d.date.split('T')[0],
                        desc: d.description || 'Festivo'
                    })));
                }
                setLoading(false);
            })
            .catch(err => console.error(err));
    });

    const addHoliday = () => {
        if (!newDate) return;

        if (isRange) {
            if (!endDate) {
                alert("Por favor, selecciona una fecha de fin para el rango.");
                return;
            }
            if (isAfter(parseISO(newDate), parseISO(endDate))) {
                alert("La fecha de inicio no puede ser posterior a la fecha de fin.");
                return;
            }

            try {
                const interval = eachDayOfInterval({
                    start: parseISO(newDate),
                    end: parseISO(endDate)
                });

                const newHolidays = interval.map(date => ({
                    id: Math.random() + date.getTime(),
                    date: format(date, 'yyyy-MM-dd'),
                    desc: newDesc || 'Vacaciones'
                }));

                // Deduplicate by date
                const existingDates = new Set(holidays.map(h => h.date));
                const uniqueNew = newHolidays.filter(h => !existingDates.has(h.date));

                setHolidays([...holidays, ...uniqueNew]);
                setNewDate('');
                setEndDate('');
                setNewDesc('');
            } catch (err) {
                console.error(err);
                alert("Error al generar el rango de fechas.");
            }
        } else {
            // Check if already exists
            if (holidays.some(h => h.date === newDate)) {
                alert("Esta fecha ya está en el calendario.");
                return;
            }
            setHolidays([...holidays, { id: Date.now(), date: newDate, desc: newDesc || 'Festivo' }]);
            setNewDate('');
            setNewDesc('');
        }
    };

    const removeHoliday = (id: number) => {
        setHolidays(holidays.filter(h => h.id !== id));
    };

    const checkConflicts = async () => {
        setIsChecking(true);
        try {
            const res = await fetch('/api/planificador/conflicts');
            const data = await res.json();
            setConflicts({ count: data.count, ids: data.conflicts.map((c: any) => c.id) });
        } catch (err) {
            console.error(err);
            alert("Error al comprobar conflictos.");
        } finally {
            setIsChecking(false);
        }
    };

    const resolveConflicts = async () => {
        if (!conflicts || conflicts.count === 0) return;

        setConfirmConfig({
            isOpen: true,
            title: 'Resolver Conflictos',
            message: `¿Estás seguro de mover los ${conflicts.count} bloques defectuosos a pendientes? Esta acción des-planificará estos lotes.`,
            isDangerous: true,
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                setIsResolving(true);
                try {
                    const res = await fetch('/api/planificador/conflicts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: conflicts.ids })
                    });

                    if (res.ok) {
                        toast.success("Conflictos resueltos. Los bloques han sido movido a la cola de pendientes.");
                        setConflicts(null);
                        router.refresh();
                    } else {
                        throw new Error("Failed to resolve");
                    }
                } catch (err) {
                    console.error(err);
                    toast.error("Error al resolver conflictos.");
                } finally {
                    setIsResolving(false);
                }
            }
        });
    };

    const saveHolidays = async () => {
        try {
            await fetch('/api/configuration/holidays', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dates: holidays.map(h => h.date) }) // API needs array of dates
            });
            alert('Calendario guardado correctamente');
            router.refresh(); // Update main calendar
        } catch (err) {
            console.error(err);
            alert('Error al guardar calendario');
        }
    };

    if (loading) return <div>Cargando calendario...</div>;

    return (
        <div style={{ width: '100%' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Calendario Laboral</h3>

            {/* Quick Actions & Conflict Detector at TOP */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button onClick={saveHolidays} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: '#4f46e5', color: 'white', border: 'none',
                        padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
                    }}>
                        <Save size={18} /> Guardar Cambios en Calendario
                    </button>

                    <button
                        onClick={checkConflicts}
                        disabled={isChecking}
                        style={{
                            background: 'white', color: '#9a3412', border: '1px solid #fdba74',
                            padding: '0.75rem 1.2rem', borderRadius: '6px', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        {isChecking ? "Comprobando..." : <><Search size={18} /> Identificar Conflictos</>}
                    </button>
                </div>

                {conflicts !== null && (
                    <div style={{
                        padding: '1.5rem', background: '#fff7ed',
                        borderRadius: '10px', border: '1px solid #ffedd5',
                        display: 'flex', alignItems: 'center', gap: '1.5rem'
                    }}>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#9a3412', margin: 0, fontSize: '1rem' }}>
                                <AlertTriangle size={20} /> Resolución de Conflictos
                            </h4>
                            {conflicts.count > 0 ? (
                                <p style={{ color: '#c2410c', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                                    😱 Se han detectado <strong>{conflicts.count}</strong> bloques en días no laborables.
                                </p>
                            ) : (
                                <p style={{ color: '#16a34a', fontSize: '0.85rem', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle size={16} /> ¡Todo en orden! No hay conflictos detectados.
                                </p>
                            )}
                        </div>
                        {conflicts.count > 0 && (
                            <button
                                onClick={resolveConflicts}
                                disabled={isResolving}
                                style={{
                                    background: '#ef4444', color: 'white', border: 'none',
                                    padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 600,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                            >
                                {isResolving ? "Resolviendo..." : <><Trash2 size={18} /> Mover a Pendientes</>}
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                    <input
                        type="checkbox"
                        id="rangeMode"
                        checked={isRange}
                        onChange={e => setIsRange(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="rangeMode" style={{ fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Activar Modo Rango (Vacaciones/Blocks)</label>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                            {isRange ? 'Fecha Inicio' : 'Fecha'}
                        </label>
                        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                    </div>

                    {isRange && (
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Fecha Fin</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                        </div>
                    )}

                    <div style={{ flex: 2 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Descripción</label>
                        <input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder={isRange ? "Ej: Vacaciones Verano" : "Ej: Festivo Local"} style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                    </div>
                    <button onClick={addHoliday} style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', height: '40px' }}>
                        <Plus size={18} /> Añadir
                    </button>
                </div>
            </div>

            {groupedHolidays.map(group => {
                const isCollapsed = collapsedYears.includes(group.year);
                return (
                    <div key={group.year} style={{ marginBottom: '1.5rem' }}>
                        <button
                            onClick={() => toggleYear(group.year)}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '0.75rem 1rem',
                                borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                                Año {group.year} ({group.items.length} festivos)
                            </span>
                        </button>

                        {!isCollapsed && (
                            <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', overflow: 'hidden', padding: '1px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#64748b' }}>Fecha</th>
                                            <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#64748b' }}>Descripción</th>
                                            <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#64748b' }}>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.items.map((h: any) => (
                                            <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '0.75rem 1rem' }}>{h.date.split('-').reverse().join('/')}</td>
                                                <td style={{ padding: '0.75rem 1rem' }}>{h.desc}</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                    <button onClick={() => removeHoliday(h.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}

            <ConfirmationModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                isDangerous={confirmConfig.isDangerous}
            />
        </div>
    );
}
