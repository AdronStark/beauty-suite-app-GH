'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, FlaskConical, Package, BarChart3, Settings, FileText, Puzzle, ChevronDown } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import styles from './editor.module.css';

import Toast, { ToastType } from '@/components/ui/Toast';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { ProtectedField } from '@/components/ui/ProtectedField';
import ClientSelect from '@/components/clients/ClientSelect';
import { formatCurrency, formatNumber } from '@/lib/formatters';

// Tabs
import TabBulk from '@/components/ofertas/TabBulk';
import TabPackaging from '@/components/ofertas/TabPackaging';
import TabExtras from '@/components/ofertas/TabExtras';
import TabSummary from '@/components/ofertas/TabSummary';
import { calculateOfferCosts } from '@/lib/offerCalculations';
import { generateOfferDocument } from '@/lib/generateOfferDoc';
import DocumentConfigModal from '@/components/ofertas/DocumentConfigModal';

import { getStatusColor } from '@/lib/statusColors';

import { useRecentActivity } from '@/hooks/useRecentActivity';
import { useSession } from 'next-auth/react';

export default function OfferEditor({ initialData, offerId, config }: { initialData: any, offerId: string | null, config: any }) {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'ADMIN';

    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
    const router = useRouter();

    // Read-Only Calculation
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    // Admin can override readonly mode if triggered via link, but usually readonly is for specific views
    const isReadOnly = searchParams.get('mode') === 'readonly';

    const { trackActivity } = useRecentActivity();
    const [activeTab, setActiveTab] = useState('bulk');
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

    // Parse initial data
    const parsedInput = initialData ? JSON.parse(initialData.inputData || '{}') : {};

    // Prepare Document Defaults from Client Data
    const clientDetails = initialData?.clientDetails;
    const defaultDocumentConfig = {
        clientName: clientDetails?.businessName || clientDetails?.name || '',
        clientAddress: clientDetails?.address || '',
        // clientVat: clientDetails?.vat || '', // Field not in Client model yet?
        ...parsedInput.documentConfig
    };

    // Prepare default values
    const defaultValues = {
        client: initialData?.client || '',
        product: initialData?.product || '',

        // Input logic changed: User enters Total Batch Kg
        // Defaults removed to ensure user input
        totalBatchKg: parsedInput.totalBatchKg,
        unitSize: parsedInput.unitSize,
        density: parsedInput.density,

        // This is now derived but we keep it in form for compatibility (will be updated on submit/calc)
        units: parsedInput.units || 0,

        // Bulk
        bulkCostMode: parsedInput.bulkCostMode || 'formula', // 'manual' or 'formula'
        manualBulkCost: parsedInput.manualBulkCost || 0,
        formula: parsedInput.formula || [],
        manufacturingTime: parsedInput.manufacturingTime, // Defaults to empty to force input

        // Packaging
        packaging: parsedInput.packaging || [],
        fillingSpeed: parsedInput.fillingSpeed || 1500,
        fillingPeople: parsedInput.fillingPeople || 1,
        containerType: parsedInput.containerType || '',
        subtype: parsedInput.subtype || '',
        capacity: parsedInput.capacity || '',
        selectedOperations: parsedInput.selectedOperations || [],

        // Extras
        extras: parsedInput.extras || [], // Selected extras IDs

        marginPercent: parsedInput.marginPercent ?? 30,
        discountPercent: parsedInput.discountPercent || 0,
        scenarios: parsedInput.scenarios || [],
    };


    // Determine effective configuration (Frozen vs Live)
    // If status is NOT 'Borrador', we attempt to use the snapshotConfig stored in inputData.
    // If no snapshot exists (legacy data), we fall back to live 'config', but ideally we should warn.
    // ADMIN OVERRIDE: Admin can edit "frozen" offers. BUT we still want to use the snapshot config by default unless they change it?
    // Actually, "Frozen" here mainly controls the "Save" button disabling and the "Locked" banner.
    // We want Admin to be able to Save.
    const isLockedStatus = initialData?.status && initialData.status !== 'Borrador';
    const isFrozen = isLockedStatus && !isAdmin;

    const savedConfig = parsedInput.snapshotConfig;

    // Effective config to use for calculations
    // even if Admin edits, we start with saved config if available.
    const effectiveConfig = (isLockedStatus && savedConfig) ? savedConfig : config;

    const [docModalOpen, setDocModalOpen] = useState(false);

    const { register, handleSubmit, control, watch, setValue, getValues, formState: { errors, isValid } } = useForm({
        defaultValues,
        mode: 'onChange' // Ensure validation updates real-time
    });

    const handleDocAction = async (modalConfig: any, format: 'pdf' | 'docx' | 'save_only') => {
        const currentFormData = getValues();
        // Merge the modal config into the form data AND include the effective config for calculations
        const finalData = {
            ...initialData, // Include server-side fields (id, code, revision, etc.)
            ...currentFormData, // Override with current form values
            documentConfig: modalConfig,
            snapshotConfig: effectiveConfig
        };

        // 1. SAVE (If not read-only for current user)
        if (!isFrozen) {
            // We use the existing onSubmit logic but force the new data
            // We need to act as if the form was submitted with this extra field
            // But main form input doesn't have 'documentConfig' registered? 
            // It's okay, onSubmit takes 'data' and puts it into inputData JSON.
            // We'll call onSubmit manually, but we need to be careful about state.
            // Safer: Update 'inputData' via API directly or rely on onSubmit logic?
            // Let's piggyback on onSubmit.
            await onSubmit(finalData);
        }

        if (format === 'save_only') {
            setDocModalOpen(false);
            return;
        }

        // 2. GENERATE
        // Recalculate to ensure fresh results
        const results = calculateOfferCosts(finalData, effectiveConfig);

        try {
            let blob;
            let filename = `Oferta_${finalData.product || 'SinProducto'}_${finalData.client || 'SinCliente'}`;

            if (format === 'docx') {
                blob = await generateOfferDocument(finalData, results);
                filename += '.docx';
            } else {
                const { generateOfferPDF } = await import('@/lib/generateOfferPDF');
                blob = await generateOfferPDF(finalData, results);
                filename += '.pdf';
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);

            setDocModalOpen(false);
            setToast({ message: "Documento generado correctamente.", type: 'success' });

        } catch (e: any) {
            console.error("Error generating doc:", e);
            setToast({ message: "Error al generar el documento: " + e.message, type: 'error' });
        }
    };

    // Real-time calculation of units for display
    const currentBatchKg = parseFloat(watch('totalBatchKg') || 0);
    const currentSize = parseFloat(watch('unitSize') || 50);
    const currentDensity = parseFloat(watch('density') || 1);

    // Units = (Kg * 1000) / (ml * density)
    const derivedUnits = (currentSize > 0 && currentDensity > 0)
        ? (currentBatchKg * 1000) / (currentSize * currentDensity)
        : 0;

    // Live Calculation for Sidebar Display
    // We recalculate on every render to ensure the sidebar is always up to date
    const liveValues = { ...watch(), units: derivedUnits };
    const liveResults = calculateOfferCosts(liveValues, effectiveConfig);

    const onSubmit = async (data: any) => {
        // Enforce derived units into data package
        // Also Snapshot the configuration if we are saving.
        let configToSave = config; // Default to live
        if (isLockedStatus && savedConfig) {
            configToSave = savedConfig; // Keep existing snapshot if already frozen (unless admin wants to force update? For now keep snapshot)
        }

        const finalData = {
            ...data,
            units: derivedUnits,
            snapshotConfig: configToSave // Save the config used
        };

        const method = offerId ? 'PUT' : 'POST';
        const url = offerId ? `/api/ofertas/${offerId}` : '/api/ofertas';


        // Calculate final results for DB storage
        const results = calculateOfferCosts(finalData, configToSave);

        const payload = {
            ...finalData,
            client: data.client,
            product: data.product,
            status: data.status || initialData?.status || 'Borrador',
            inputData: JSON.stringify(finalData),
            resultsSummary: JSON.stringify({
                total_cost_unit: results.salePrice, // Saving PVP as the main "price" for now
                directCost: results.directCost,
                salePrice: results.salePrice,
                profit: results.profit,
                units: results.derivedUnits,
                totalValue: results.salePrice * results.derivedUnits
            })
        };

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const savedItem = await res.json();

                // Track modification
                trackActivity('offer', savedItem.id, savedItem.product || 'Oferta sin nombre', savedItem.code);

                setToast({ message: 'Oferta guardada correctamente.', type: 'success' });

                if (!offerId) {
                    setTimeout(() => {
                        router.replace(`/ofertas/editor/${savedItem.id}`);
                    }, 1500);
                } else {
                    router.refresh();
                }
            } else {
                const err = await res.text();
                setToast({ message: `Error del Servidor (${res.status}): ${err}`, type: 'error' });
            }
        } catch (e: any) {
            console.error(e);
            setToast({ message: `Error de Conexión: ${e.message}`, type: 'error' });
        }
    };

    // Prevent implicit submit on Enter
    const checkKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') e.preventDefault();
    };

    const tabs = [
        { id: 'bulk', label: '1. Bulk', icon: FlaskConical },
        { id: 'packaging', label: '2. Envasado', icon: Package },
        { id: 'extras', label: '3. Extras', icon: Puzzle },
        { id: 'summary', label: '4. Resumen y Análisis', icon: BarChart3 },
    ];

    const onError = (errors: any) => {
        console.error("Validation Errors:", errors);
        setToast({ message: "Hay errores en el formulario. Por favor revisa los campos requeridos.", type: 'error' });
    };

    // Frozen Status Warning
    const StatusBanner = () => {
        if (!isLockedStatus) return null;
        return (
            <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1e40af',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                marginRight: '0.5rem'
            }} title="Los precios están congelados con las tarifas del momento de cierre.">
                <span>
                    {isFrozen ? '🔒' : '🔓'} Oferta {initialData.status} - Tarifas Snapshot
                </span>
            </div>
        )
    }

    // Status State Machine
    const currentStatus = initialData?.status || 'Borrador';
    const availableTransitions: Record<string, string[]> = {
        'Borrador': ['Pendiente de validar', 'Validada'],
        'Pendiente de validar': ['Validada', 'Borrador'],
        'Validada': ['Enviada', 'Borrador'],
        'Enviada': ['Adjudicada', 'Rechazada'],
        'Adjudicada': isAdmin ? ['Enviada', 'Borrador'] : [], // Admin Override
        'Rechazada': isAdmin ? ['Enviada', 'Borrador'] : []   // Admin Override
    };

    const nextStates = availableTransitions[currentStatus] || [];

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        isDangerous?: boolean;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    const handleStatusChange = (newStatus: string) => {
        setModalConfig({
            isOpen: true,
            title: 'Cambiar Estado',
            message: `¿Estás seguro de cambiar el estado de la oferta a "${newStatus}"?`,
            onConfirm: async () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
                await onSubmit({ ...getValues(), status: newStatus });
            }
        });
    };

    const handleNewRevision = () => {
        setModalConfig({
            isOpen: true,
            title: 'Crear Nueva Revisión',
            message: 'Se creará una NUEVA REVISIÓN (Borrador) copia de esta oferta. ¿Deseas continuar?',
            isDangerous: false, // Creating revision is safe/standard
            onConfirm: async () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
                try {
                    const res = await fetch('/api/ofertas/revision', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sourceOfferId: offerId })
                    });

                    if (res.ok) {
                        const newOffer = await res.json();
                        setToast({ message: "Nueva revisión creada. Se aplicarán las tarifas actuales.", type: 'success' });
                        setTimeout(() => router.push(`/ofertas/editor/${newOffer.id}`), 1000);
                    } else {
                        setToast({ message: "Error al crear revisión: " + await res.text(), type: 'error' });
                    }
                } catch (e: any) {
                    setToast({ message: "Error: " + e.message, type: 'error' });
                }
            }
        });
    };


    return (
        <form onSubmit={handleSubmit(onSubmit, onError)} onKeyDown={checkKeyDown} className={styles.container} style={{ height: 'calc(100vh - var(--header-height))', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

                {/* Header Section (Fixed) */}
                <div style={{ flexShrink: 0, background: '#f8fafc', zIndex: 30, borderBottom: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
                        {/* Top Toolbar */}
                        <div className={styles.topBar} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            {/* Left Section: Code, Status */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <button type="button" onClick={() => router.back()} className={styles.backButton}>
                                    <ArrowLeft size={20} />
                                </button>

                                {/* Code Badge */}
                                {initialData?.code && (
                                    <div style={{ background: 'var(--color-primary-light)', color: 'white', padding: '0.25rem 0.8rem', borderRadius: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                                        #{initialData.code}
                                        {(initialData.revision !== undefined && initialData.revision !== null) && <span style={{ fontSize: '0.75em', opacity: 0.85 }}>(Rev {initialData.revision})</span>}
                                    </div>
                                )}

                                {!isReadOnly && (
                                    /* Status Badge with Dropdown */
                                    <div style={{ position: 'relative' }}>
                                        <button
                                            type="button"
                                            onClick={() => nextStates.length > 0 && setStatusDropdownOpen(!statusDropdownOpen)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                background: getStatusColor(currentStatus), color: 'white',
                                                padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                                                border: 'none', cursor: nextStates.length > 0 ? 'pointer' : 'default'
                                            }}
                                        >
                                            {currentStatus}
                                            {nextStates.length > 0 && <ChevronDown size={14} />}
                                        </button>

                                        {/* Dropdown Menu */}
                                        {statusDropdownOpen && nextStates.length > 0 && (
                                            <div style={{
                                                position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                                                background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, minWidth: '160px', overflow: 'hidden'
                                            }}>
                                                {nextStates.map(s => (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        onClick={() => { handleStatusChange(s); setStatusDropdownOpen(false); }}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                                            padding: '0.5rem 0.75rem', background: 'transparent', border: 'none',
                                                            cursor: 'pointer', fontSize: '0.85rem', textAlign: 'left'
                                                        }}
                                                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                                    >
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(s) }}></span>
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {isReadOnly && (
                                    <span style={{
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        background: getStatusColor(currentStatus),
                                        color: 'white'
                                    }}>
                                        {currentStatus}
                                    </span>
                                )}

                                {/* Revision Button */}
                                {!isReadOnly && (currentStatus === 'Adjudicada' || currentStatus === 'Rechazada') && (
                                    <button
                                        type="button"
                                        onClick={handleNewRevision}
                                        style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#334155', fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        + Crear Revisión
                                    </button>
                                )}
                            </div>

                            {/* Center Section: Client & Product Inputs */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1, justifyContent: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '150px' }}>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>Cliente</label>
                                    <ProtectedField
                                        value={watch('client')}
                                        isProtecting={!!offerId}
                                        protectionMessage="El cliente define las condiciones de la oferta. ¿Seguro que quieres cambiarlo?"
                                    >
                                        <Controller
                                            control={control}
                                            name="client"
                                            rules={{ required: true }}
                                            render={({ field }) => (
                                                <ClientSelect
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Seleccionar Cliente"
                                                    disabled={isReadOnly}
                                                />
                                            )}
                                        />
                                    </ProtectedField>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '200px' }}>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>Producto</label>
                                    <ProtectedField
                                        value={watch('product')}
                                        isProtecting={!!offerId}
                                        protectionMessage="Cambiar el nombre del producto puede afectar a la documentación generada. ¿Editar?"
                                    >
                                        <input
                                            {...register('product', { required: true })}
                                            disabled={isReadOnly}
                                            style={{ border: 'none', borderBottom: `1px solid ${errors.product ? '#ef4444' : '#e2e8f0'}`, padding: '0.25rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-primary-dark)', outline: 'none', background: 'transparent', width: '100%' }}
                                            placeholder="Producto"
                                        />
                                    </ProtectedField>
                                </div>
                            </div>

                            {/* Right Section: Config & Save */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <StatusBanner />
                                {!isReadOnly && (
                                    <button type="button" onClick={() => router.push('/ofertas/config')} className={styles.iconButton} title="Configuración Global de Costes">
                                        <Settings size={20} className={styles.icon} />
                                    </button>
                                )}
                                {isReadOnly && (
                                    <div style={{ padding: '0.5rem 1rem', background: '#f1f5f9', color: '#64748b', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500 }}>
                                        Modo Lectura
                                    </div>
                                )}
                                {!isReadOnly && (
                                    <button type="submit" className={styles.primaryButton} disabled={isFrozen && currentStatus !== 'Borrador'}>
                                        <Save size={16} /> {isFrozen ? 'Guardar (Sin cambios)' : 'Guardar'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Persistent Header Data - Fabricación & Envase */}
                        <div className={styles.persistentHeader} style={{ boxShadow: 'none' }}>
                            <div className={styles.headerField}>
                                <label className={styles.label}>Fabricación principal <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className={styles.unitInputs}>
                                    <div className={styles.unitInputGroup}>
                                        <input
                                            type="number"
                                            step="0.1"
                                            {...register('totalBatchKg', { required: true, valueAsNumber: true })}
                                            disabled={isReadOnly}
                                            className={styles.inputBordered}
                                            style={{ borderColor: errors.totalBatchKg ? '#ef4444' : undefined }}
                                            placeholder="Kg"
                                        />
                                        <span className={styles.helperText}>Kgs Totales</span>
                                    </div>
                                    <div className={styles.unitInputGroup}>
                                        <div className={styles.readOnlyValue}>{isFinite(derivedUnits) ? formatNumber(derivedUnits, 0) : '-'}</div>
                                        <span className={styles.helperText}>Uds (Calc)</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.headerField}>
                                <label className={styles.label}>Envase <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className={styles.unitInputs}>
                                    <div className={styles.unitInputGroup}>
                                        <input
                                            type="number"
                                            {...register('unitSize', { required: true, valueAsNumber: true })}
                                            disabled={isReadOnly}
                                            className={styles.inputBordered}
                                            placeholder="ml"
                                            style={{ borderColor: errors.unitSize ? '#ef4444' : undefined }}
                                        />
                                        <span className={styles.helperText}>Capacidad (ml)</span>
                                    </div>
                                    <div className={styles.unitInputGroup}>
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('density', { required: true, valueAsNumber: true })}
                                            disabled={isReadOnly}
                                            className={styles.inputBordered}
                                            placeholder="g/ml"
                                            style={{ borderColor: errors.density ? '#ef4444' : undefined }}
                                        />
                                        <span className={styles.helperText}>Densidad</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content (Flex Row) */}
                <div className={styles.mainLayout} style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'stretch' }}>
                    {/* Sidebar (Fixed Height, Scrollable) */}
                    <div className={styles.sidebar} style={{ overflowY: 'auto' }}>
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <div key={tab.id}>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''} `}
                                    >
                                        <Icon size={20} />
                                        {tab.label}
                                    </button>

                                    {/* CONDITIONAL SIDEBAR CONTENT */}
                                    {isActive && tab.id === 'bulk' && (
                                        <div className={styles.compactCard} style={{ marginTop: '0.5rem', marginLeft: '0.5rem', borderLeft: '3px solid var(--color-primary)', paddingLeft: '1rem' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                Costes Granel
                                            </div>

                                            {/* Total Granel on one line */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                                                <div className={styles.metricLabel} style={{ marginBottom: 0 }}>Total Granel (ud)</div>
                                                <div className={styles.metricValue} style={{ fontSize: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                    {formatCurrency(derivedUnits > 0 ? liveResults.totalBulkCost / derivedUnits : 0)} €
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                                                    <span>Materiales</span>
                                                    <span style={{ fontWeight: 600 }}>{formatCurrency(derivedUnits > 0 ? (liveResults.details?.totalMaterialCost || 0) / derivedUnits : 0)} €</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                                                    <span>Operaciones</span>
                                                    <span style={{ fontWeight: 600 }}>{formatCurrency(derivedUnits > 0 ? (liveResults.details?.mfgCost || 0) / derivedUnits : 0)} €</span>
                                                </div>
                                                {(liveResults.details?.totalImputedSurplus || 0) > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#c2410c' }}>
                                                        <span>Sobrantes</span>
                                                        <span style={{ fontWeight: 600 }}>{formatCurrency(derivedUnits > 0 ? (liveResults.details?.totalImputedSurplus || 0) / derivedUnits : 0)} €</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {isActive && tab.id === 'packaging' && (
                                        <div className={styles.compactCard} style={{ marginTop: '0.5rem', marginLeft: '0.5rem', borderLeft: '3px solid var(--color-primary)', paddingLeft: '1rem' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                Costes Envasado
                                            </div>

                                            {/* Total Envasado on one line */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                                                <div className={styles.metricLabel} style={{ marginBottom: 0 }}>Total Envasado (ud)</div>
                                                <div className={styles.metricValue} style={{ fontSize: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                    {formatCurrency(liveResults.packingCostUnit + liveResults.processCostUnit)} €
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                                                    <span>Materiales</span>
                                                    <span style={{ fontWeight: 600 }}>{formatCurrency(derivedUnits > 0 ? (liveResults.details?.packagingMaterialCost || 0) / derivedUnits : 0)} €</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                                    <span>Operaciones</span>
                                                    <span style={{ fontWeight: 600 }}>{formatCurrency(derivedUnits > 0 ? (liveResults.details?.packagingFillingCost || 0) / derivedUnits : 0)} €</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                            <button
                                type="button"
                                disabled={!isValid || isReadOnly}
                                onClick={() => !isReadOnly && setDocModalOpen(true)}
                                className={styles.tabButton}
                                style={{
                                    color: isValid && !isReadOnly ? '#0f766e' : '#94a3b8',
                                    marginTop: '0.5rem',
                                    cursor: isValid && !isReadOnly ? 'pointer' : 'not-allowed',
                                    justifyContent: 'flex-start',
                                    background: isValid && !isReadOnly ? '#f0fdf4' : 'transparent',
                                    border: isValid && !isReadOnly ? '1px solid #bbf7d0' : 'none'
                                }}
                                title={isValid ? "Configurar y Descargar Documentación" : "Completa todos los campos requeridos"}
                            >
                                <FileText size={20} />
                                Documentación
                            </button>
                        </div>
                    </div>

                    {/* Tab Content (Scrollable) */}
                    <div className={styles.contentArea} style={{ flex: 1, overflowY: 'auto', paddingBottom: '2rem' }}>
                        <div className={styles.contentContainer}>
                            <div style={{ display: activeTab === 'bulk' ? 'block' : 'none' }}>
                                <TabBulk control={control} register={register} watch={watch} setValue={setValue} config={effectiveConfig} calculatedUnits={derivedUnits} errors={errors} />
                            </div>
                            <div style={{ display: activeTab === 'packaging' ? 'block' : 'none' }}>
                                <TabPackaging control={control} register={register} watch={watch} setValue={setValue} config={effectiveConfig} />
                            </div>
                            <div style={{ display: activeTab === 'extras' ? 'block' : 'none' }}>
                                <TabExtras control={control} register={register} watch={watch} config={effectiveConfig} setValue={setValue} />
                            </div>
                            <div style={{ display: activeTab === 'summary' ? 'block' : 'none' }}>
                                <TabSummary control={control} register={register} watch={watch} setValue={setValue} config={effectiveConfig} calculatedUnits={derivedUnits} offerCosts={liveResults} />
                            </div>
                        </div>
                    </div>
                </div>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )
                }

                <ConfirmationModal
                    isOpen={modalConfig.isOpen}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    isDangerous={modalConfig.isDangerous}
                    onConfirm={modalConfig.onConfirm}
                    onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                />

                <DocumentConfigModal
                    isOpen={docModalOpen}
                    onClose={() => setDocModalOpen(false)}
                    initialConfig={defaultDocumentConfig}
                    offerStatus={initialData?.status || 'Borrador'}
                    onGenerate={handleDocAction}
                />
            </fieldset>
        </form >
    );
}
