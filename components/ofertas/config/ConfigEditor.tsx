'use client';

import { useState } from 'react';
import { useForm, useFieldArray, Control } from 'react-hook-form';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './config.module.css';

type ConfigData = {
    rates: { min: number, max: number, value: number }[];
    waste: { min: number, max: number, value: number }[];
    residue: { min: number, max: number, value: number }[];
    extras: { id: string, name: string, cost: number, type: 'FIXED' | 'VARIABLE' }[];
    packaging: any[]; // Using any for brevity in ConfigData, ideally typed
};

export default function ConfigEditor({ initialConfig }: { initialConfig: any }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'rates' | 'waste' | 'residue' | 'extras' | 'packaging'>('rates');

    // Parse initial config
    const defaultValues: ConfigData = {
        rates: initialConfig.OFFER_RATES_SCALING ? JSON.parse(initialConfig.OFFER_RATES_SCALING) : [],
        waste: initialConfig.OFFER_WASTE_SCALING ? JSON.parse(initialConfig.OFFER_WASTE_SCALING) : [],
        residue: initialConfig.OFFER_RESIDUE_SCALING ? JSON.parse(initialConfig.OFFER_RESIDUE_SCALING) : [],
        extras: initialConfig.OFFER_EXTRAS ? JSON.parse(initialConfig.OFFER_EXTRAS) : [],
        packaging: initialConfig.OFFER_PACKAGING_RULES ? JSON.parse(initialConfig.OFFER_PACKAGING_RULES) : []
    };

    const { control, register, handleSubmit } = useForm<ConfigData>({ defaultValues });

    const onSubmit = async (data: ConfigData) => {
        try {
            const res = await fetch('/api/configuration', {
                method: 'POST',
                body: JSON.stringify({
                    OFFER_RATES_SCALING: JSON.stringify(data.rates),
                    OFFER_WASTE_SCALING: JSON.stringify(data.waste),
                    OFFER_RESIDUE_SCALING: JSON.stringify(data.residue),
                    OFFER_EXTRAS: JSON.stringify(data.extras),
                    OFFER_PACKAGING_RULES: JSON.stringify(data.packaging)
                })
            });
            if (res.ok) {
                router.refresh();
                alert('Configuración guardada correctamente');
            }
        } catch (e) {
            console.error(e);
            alert('Error al guardar');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <button type="button" onClick={() => router.back()} className={styles.backButton}>
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className={styles.title}>Configuración de Ofertas</h1>
                        <p className={styles.subtitle}>Define las reglas de negocio para el cálculo automático</p>
                    </div>
                </div>
                <button type="submit" className={styles.saveBtn}>
                    <Save size={20} />
                    Guardar Cambios
                </button>
            </div>

            <div className={styles.tabs}>
                <TabButton id="rates" label="Tasas (€/h)" active={activeTab} onClick={setActiveTab} />
                <TabButton id="waste" label="Mermas (Granel)" active={activeTab} onClick={setActiveTab} />
                <TabButton id="residue" label="Gestión Residuos" active={activeTab} onClick={setActiveTab} />
                <TabButton id="extras" label="Conceptos Extras" active={activeTab} onClick={setActiveTab} />
                <TabButton id="packaging" label="Reglas Envasado" active={activeTab} onClick={setActiveTab} />
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'rates' && <RatesTable control={control} register={register} />}
                {activeTab === 'waste' && <WasteTable control={control} register={register} />}
                {activeTab === 'residue' && <ResidueTable control={control} register={register} />}
                {activeTab === 'extras' && <ExtrasTable control={control} register={register} />}
                {activeTab === 'packaging' && <PackagingRulesTable control={control} register={register} />}
            </div>
        </form>
    );
}

function TabButton({ id, label, active, onClick }: any) {
    return (
        <button
            type="button"
            onClick={() => onClick(id)}
            className={`${styles.tabBtn} ${active === id ? styles.activeTab : ''}`}
        >
            {label}
        </button>
    );
}

// --- SUB-COMPONENTS FOR TABLES ---

function RatesTable({ control, register }: { control: Control<ConfigData>, register: any }) {
    const { fields, append, remove } = useFieldArray({ control, name: 'rates' });
    return (
        <div>
            <div className={styles.infoBox}>
                Define la <strong>Tasa Horaria (€/hora)</strong> a aplicar según el coste de la Materia Prima (€/kg).
                <br />Esta tasa se multiplica por el tiempo de fabricación.
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Coste MP Mín (€/kg)</th>
                        <th>Coste MP Máx (€/kg)</th>
                        <th>Tasa (€/hora)</th>
                        <th style={{ width: 50 }}></th>
                    </tr>
                </thead>
                <tbody>
                    {fields.map((field, index) => (
                        <tr key={field.id}>
                            <td><input type="number" step="0.01" {...register(`rates.${index}.min`)} className={styles.input} /></td>
                            <td><input type="number" step="0.01" {...register(`rates.${index}.max`)} className={styles.input} /></td>
                            <td><input type="number" step="0.01" {...register(`rates.${index}.value`)} className={styles.input} /></td>
                            <td>
                                <button type="button" onClick={() => remove(index)} className={styles.deleteBtn}>
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button type="button" onClick={() => append({ min: 0, max: 0, value: 0 })} className={styles.addBtn}>
                <Plus size={16} className="inline mr-2" /> Añadir Rango
            </button>
        </div>
    );
}

function WasteTable({ control, register }: { control: Control<ConfigData>, register: any }) {
    const { fields, append, remove } = useFieldArray({ control, name: 'waste' });
    return (
        <div>
            <div className={styles.infoBox}>
                Define el <strong>% de Merma de Granel</strong> a aplicar según los Kgs totales a fabricar.
                <br />Ejemplo: 0-100 Kg {'→'} 5% Merma.
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Kgs Mín (Lote)</th>
                        <th>Kgs Máx (Lote)</th>
                        <th>Merma (%)</th>
                        <th style={{ width: 50 }}></th>
                    </tr>
                </thead>
                <tbody>
                    {fields.map((field, index) => (
                        <tr key={field.id}>
                            <td><input type="number" {...register(`waste.${index}.min`)} className={styles.input} /></td>
                            <td><input type="number" {...register(`waste.${index}.max`)} className={styles.input} /></td>
                            <td><input type="number" step="0.1" {...register(`waste.${index}.value`)} className={styles.input} /></td>
                            <td>
                                <button type="button" onClick={() => remove(index)} className={styles.deleteBtn}>
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button type="button" onClick={() => append({ min: 0, max: 0, value: 0 })} className={styles.addBtn}>
                <Plus size={16} className="inline mr-2" /> Añadir Rango
            </button>
        </div>
    );
}

function ResidueTable({ control, register }: { control: Control<ConfigData>, register: any }) {
    const { fields, append, remove } = useFieldArray({ control, name: 'residue' });
    return (
        <div>
            <div className={styles.infoBox}>
                Define el <strong>% de Recargo por Residuos</strong> a aplicar sobre el coste total, según los Kgs a fabricar.
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Kgs Mín (Lote)</th>
                        <th>Kgs Máx (Lote)</th>
                        <th>Recargo Residuos (%)</th>
                        <th style={{ width: 50 }}></th>
                    </tr>
                </thead>
                <tbody>
                    {fields.map((field, index) => (
                        <tr key={field.id}>
                            <td><input type="number" {...register(`residue.${index}.min`)} className={styles.input} /></td>
                            <td><input type="number" {...register(`residue.${index}.max`)} className={styles.input} /></td>
                            <td><input type="number" step="0.1" {...register(`residue.${index}.value`)} className={styles.input} /></td>
                            <td>
                                <button type="button" onClick={() => remove(index)} className={styles.deleteBtn}>
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button type="button" onClick={() => append({ min: 0, max: 0, value: 0 })} className={styles.addBtn}>
                <Plus size={16} className="inline mr-2" /> Añadir Rango
            </button>
        </div>
    );
}

function ExtrasTable({ control, register }: { control: Control<ConfigData>, register: any }) {
    const { fields, append, remove } = useFieldArray({ control, name: 'extras' });
    return (
        <div>
            <div className={styles.infoBox}>
                Conceptos adicionales seleccionables en la oferta.
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Concepto</th>
                        <th>Coste Defecto (€)</th>
                        <th>Tipo</th>
                        <th style={{ width: 50 }}></th>
                    </tr>
                </thead>
                <tbody>
                    {fields.map((field, index) => (
                        <tr key={field.id}>
                            <td><input {...register(`extras.${index}.name`)} placeholder="Nombre del extra" className={styles.input} /></td>
                            <td><input type="number" step="0.01" {...register(`extras.${index}.cost`)} className={styles.input} /></td>
                            <td>
                                <select {...register(`extras.${index}.type`)} className={styles.select}>
                                    <option value="FIXED">Fijo (Por Lote)</option>
                                    <option value="VARIABLE">Variable (Por Ud)</option>
                                </select>
                            </td>
                            <td>
                                <button type="button" onClick={() => remove(index)} className={styles.deleteBtn}>
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button type="button" onClick={() => append({ id: crypto.randomUUID(), name: '', cost: 0, type: 'FIXED' })} className={styles.addBtn}>
                <Plus size={16} className="inline mr-2" /> Añadir Concepto
            </button>
        </div>
    );
}

function PackagingRulesTable({ control, register }: { control: Control<ConfigData>, register: any }) {
    const { fields, remove, prepend } = useFieldArray({ control, name: 'packaging' });
    // Filter States
    const [page, setPage] = useState(1);
    const pageSize = 50;

    // Explicit filters
    const [fContainer, setFContainer] = useState('');
    const [fSubtype, setFSubtype] = useState('');
    const [fOperation, setFOperation] = useState('');
    const [fCapacity, setFCapacity] = useState('');
    const [fScale, setFScale] = useState('');

    // Extract Unique Values for Dropdowns
    const uniqueContainers = Array.from(new Set(fields.map((f: any) => f.container))).filter(Boolean).sort();

    const validSubtypes = fields
        .filter((f: any) => !fContainer || f.container === fContainer)
        .map((f: any) => f.subtype)
        .filter(Boolean);
    const uniqueSubtypes = Array.from(new Set(validSubtypes)).sort();

    // Map fields with index
    const fieldsWithIndex = fields.map((f, i) => ({ ...f, originalIndex: i }));

    const allFiltered = fieldsWithIndex.filter((f: any) => {
        // Container
        if (fContainer && f.container !== fContainer) return false;

        // Subtype
        if (fSubtype && f.subtype !== fSubtype) return false;

        // Operation
        if (fOperation && !f.operation?.toLowerCase().includes(fOperation.toLowerCase())) return false;

        // Capacity
        if (fCapacity) {
            const capVal = parseFloat(fCapacity);
            if (!isNaN(capVal)) {
                const min = parseFloat(f.capacityMin) || 0;
                const max = parseFloat(f.capacityMax) || 0;
                if (capVal < min || capVal > max) return false;
            }
        }

        // Scale
        if (fScale) {
            const scaleVal = parseFloat(fScale);
            if (!isNaN(scaleVal)) {
                const min = parseFloat(f.scaleMin) || 0;
                const max = parseFloat(f.scaleMax) || 0;
                if (scaleVal < min || scaleVal > max) return false;
            }
        }

        return true;
    });

    const totalPages = Math.ceil(allFiltered.length / pageSize);
    const paginatedFields = allFiltered.slice((page - 1) * pageSize, page * pageSize);

    const handleFilterChange = (setter: any, value: any) => {
        setter(value);
        setPage(1);
    };

    const handleAddRule = () => {
        // Clear filters so the new item (empty/default) is visible
        setFContainer('');
        setFSubtype('');
        setFOperation('');
        setFCapacity('');
        setFScale('');
        setPage(1);

        // Prepend new item
        prepend({
            container: '',
            subtype: '',
            capacityMin: 0,
            capacityMax: 0,
            operation: '',
            scaleMin: 0,
            scaleMax: 0,
            unitCost: 0,
            people: 0
        });
    };

    return (
        <div>
            <div className={styles.infoBox}>
                Base de Datos de <strong>Tiempos y Costes de Envasado</strong>.
                <br />Estos datos se usan para calcular el coste del proceso según el envase seleccionado.
            </div>

            {/* Advanced Filters Grid */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>

                {/* Container Filter */}
                <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Tipo Envase</label>
                    <select
                        value={fContainer}
                        onChange={(e) => {
                            setFContainer(e.target.value);
                            setFSubtype('');
                            setPage(1);
                        }}
                        className={styles.select}
                        style={{ width: '100%' }}
                    >
                        <option value="">Todos</option>
                        {uniqueContainers.map((c: any) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Subtype Filter */}
                <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Subtipo</label>
                    <select
                        value={fSubtype}
                        onChange={(e) => handleFilterChange(setFSubtype, e.target.value)}
                        className={styles.select}
                        style={{ width: '100%' }}
                    >
                        <option value="">Todos</option>
                        {uniqueSubtypes.map((s: any) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {/* Capacity Lookup */}
                <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Capacidad (ml)</label>
                    <input
                        type="number"
                        placeholder="Buscar por ml..."
                        value={fCapacity}
                        onChange={(e) => handleFilterChange(setFCapacity, e.target.value)}
                        className={styles.input}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Operation Search */}
                <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Operación</label>
                    <input
                        type="text"
                        placeholder="Filtrar por nombre..."
                        value={fOperation}
                        onChange={(e) => handleFilterChange(setFOperation, e.target.value)}
                        className={styles.input}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Scale Lookup */}
                <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Rango Uds</label>
                    <input
                        type="number"
                        placeholder="Buscar por Uds..."
                        value={fScale}
                        onChange={(e) => handleFilterChange(setFScale, e.target.value)}
                        className={styles.input}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* Action Bar: Stats + Add Button + Pagination */}
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        type="button"
                        onClick={handleAddRule}
                        className={styles.addBtn}
                        style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                    >
                        <Plus size={16} className="inline mr-2" /> Añadir Regla Manual
                    </button>
                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                        <strong>{allFiltered.length}</strong> reglas.
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className={styles.tabBtn} // Reusing tabBtn style for simplicity or define new one
                        style={{ padding: '0.25rem 0.5rem', opacity: page === 1 ? 0.5 : 1 }}
                    >
                        Anterior
                    </button>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                        Pág {page} de {totalPages || 1}
                    </span>
                    <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className={styles.tabBtn}
                        style={{ padding: '0.25rem 0.5rem', opacity: page >= totalPages ? 0.5 : 1 }}
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className={styles.table} style={{ fontSize: '0.85rem' }}>
                    <thead>
                        <tr>
                            <th>Envase</th>
                            <th>Subtipo</th>
                            <th>Cap (ml)</th>
                            <th>Operación</th>
                            <th>Rango Uds</th>
                            <th>Coste (€/ud)</th>
                            <th>Personas</th>
                            <th style={{ width: 50 }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedFields.map((field) => {
                            const index = field.originalIndex;
                            return (
                                <tr key={field.id}>
                                    <td><input {...register(`packaging.${index}.container`)} className={styles.input} style={{ width: 80 }} /></td>
                                    <td><input {...register(`packaging.${index}.subtype`)} className={styles.input} style={{ width: 100 }} /></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <input type="number" {...register(`packaging.${index}.capacityMin`)} className={styles.input} style={{ width: 40 }} />
                                            -
                                            <input type="number" {...register(`packaging.${index}.capacityMax`)} className={styles.input} style={{ width: 40 }} />
                                        </div>
                                    </td>
                                    <td><input {...register(`packaging.${index}.operation`)} className={styles.input} /></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <input type="number" {...register(`packaging.${index}.scaleMin`)} className={styles.input} style={{ width: 50 }} />
                                            -
                                            <input type="number" {...register(`packaging.${index}.scaleMax`)} className={styles.input} style={{ width: 50 }} />
                                        </div>
                                    </td>
                                    <td><input type="number" step="0.0001" {...register(`packaging.${index}.unitCost`)} className={styles.input} style={{ width: 70 }} /></td>
                                    <td><input type="number" step="0.1" {...register(`packaging.${index}.people`)} className={styles.input} style={{ width: 50 }} /></td>
                                    <td>
                                        <button type="button" onClick={() => remove(index)} className={styles.deleteBtn}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                * Nota: Para añadir nuevas reglas masivas, se recomienda usar la importación de Excel (contactar soporte).
            </div>
        </div>
    );
}
