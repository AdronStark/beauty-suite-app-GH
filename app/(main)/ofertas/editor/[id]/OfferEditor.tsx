'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, Printer, FlaskConical, Package, Puzzle, BarChart3, Settings, FileText, ChevronDown, Check, X, Calculator, Percent, Lock, Unlock, Copy } from 'lucide-react';
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
import OfferSummaryGlobal from '@/components/ofertas/OfferSummaryGlobal'; // New Global Summary Component

import { getStatusColor } from '@/lib/statusColors';
import { getNextPossibleStatuses } from '@/lib/statusWorkflow';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { useSession } from 'next-auth/react';

// Type for our Items (Frontend Representation)
interface EditorItem {
    id: string; // Real ID or "temp_..."
    productName: string;
    inputData: any; // Parsed JSON
    resultsSummary: any; // Parsed JSON
    order: number;
    // UI state
    isDirty?: boolean;
}

export default function OfferEditor({ initialData, offerId, config }: { initialData: any, offerId: string | null, config: any }) {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'ADMIN';

    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
    const router = useRouter();

    // Read-Only Calculation
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const isReadOnly = searchParams.get('mode') === 'readonly';

    const { trackActivity } = useRecentActivity();
    const [activeTab, setActiveTab] = useState('bulk');
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

    // --- MULTI-PRODUCT STATE ---

    // Initialize Items from initialData
    const initItems = (): EditorItem[] => {
        if (initialData?.items && initialData.items.length > 0) {
            return initialData.items.map((i: any) => ({
                id: i.id,
                productName: i.productName,
                inputData: typeof i.inputData === 'string' ? JSON.parse(i.inputData) : i.inputData,
                resultsSummary: typeof i.resultsSummary === 'string' ? JSON.parse(i.resultsSummary) : i.resultsSummary,
                order: i.order
            }));
        } else {
            // Legacy / Fallback: Create one item from the offer root fields
            const parsedInput = initialData ? JSON.parse(initialData.inputData || '{}') : {};
            return [{
                id: 'temp_' + Date.now(),
                productName: initialData?.product || 'Nuevo Producto',
                inputData: parsedInput,
                resultsSummary: {},
                order: 0
            }];
        }
    };

    const [items, setItems] = useState<EditorItem[]>(initItems);
    const [activeItemId, setActiveItemId] = useState<string>(items[0]?.id);

    // Identify the active item object
    const activeItem = items.find(i => i.id === activeItemId) || items[0];

    // --- GLOBAL FIELDS STATE ---
    // Client is global to the Offer, not per item.
    const [client, setClient] = useState(initialData?.client || '');
    // Offer Description is global
    const [offerDescription, setOfferDescription] = useState(initialData?.description || '');

    // Prepare default values for the FORM based on ACTIVE ITEM
    const getDefaultValues = (item: EditorItem) => {
        const parsedInput = item.inputData || {};

        return {
            product: item.productName || '',

            // Re-use logic from previous editor
            totalBatchKg: parsedInput.totalBatchKg,
            unitSize: parsedInput.unitSize,
            density: parsedInput.density,
            units: parsedInput.units || 0,

            // Bulk
            bulkCostMode: parsedInput.bulkCostMode || 'formula',
            manualBulkCost: parsedInput.manualBulkCost || 0,
            formula: parsedInput.formula || [],
            manufacturingTime: parsedInput.manufacturingTime,

            // Packaging
            packaging: parsedInput.packaging || [],
            fillingSpeed: parsedInput.fillingSpeed || 1500,
            fillingPeople: parsedInput.fillingPeople || 1,
            containerType: parsedInput.containerType || '',
            subtype: parsedInput.subtype || '',
            capacity: parsedInput.capacity || '',
            selectedOperations: parsedInput.selectedOperations || [],

            // Extras
            extras: parsedInput.extras || [],
            marginPercent: parsedInput.marginPercent ?? 30,
            discountPercent: parsedInput.discountPercent || 0,
            scenarios: parsedInput.scenarios || [],

            // Snapshot
            snapshotConfig: parsedInput.snapshotConfig
        };
    };

    const { register, handleSubmit, control, watch, setValue, getValues, reset, formState: { errors, isValid } } = useForm({
        defaultValues: getDefaultValues(activeItem),
        mode: 'onChange'
    });

    // --- SYNC FORM TO STATE ON SWITCH ---
    const prevItemIdRef = useRef<string>(activeItemId);

    // Watch for product name changes to update sidebar in real-time
    const currentProductName = watch('product');

    useEffect(() => {
        setItems(prev => prev.map(i => {
            if (i.id === activeItemId) {
                return { ...i, productName: currentProductName || 'Sin Nombre' };
            }
            return i;
        }));
    }, [currentProductName, activeItemId]);

    // When activeItemId changes, save prev form state to `items` and load new
    useEffect(() => {
        if (prevItemIdRef.current !== activeItemId) {
            // This Effect runs AFTER render, so `activeItemId` is new.
            // But we need to save the OLD form values to the OLD item id.
            // However, `getValues()` gives current form values.
            // We should sync "on change" or rely on a "saveCurrent" function called BEFORE switching.
        }
    }, [activeItemId]);

    // Rename state
    const [isRenaming, setIsRenaming] = useState(false);

    const handleSwitchItem = (newItemId: string) => {
        if (newItemId === activeItemId) return;

        setIsRenaming(false); // Reset rename mode

        // 1. Save current form values to current item in state
        const currentFormValues = getValues();
        setItems(prev => prev.map(i => {
            if (i.id === activeItemId) {
                return {
                    ...i,
                    productName: currentFormValues.product,
                    inputData: { ...currentFormValues, product: undefined }, // strip flatten fields if needed? No, store everything.
                };
            }
            return i;
        }));

        // 2. Find new item
        // 2. Find new item
        const newItem = items.find(i => i.id === newItemId);

        // 3. Reset form logic
        if (newItem) {
            reset(getDefaultValues(newItem));
            setActiveItemId(newItemId);
            prevItemIdRef.current = newItemId;
        } else if (newItemId === 'SUMMARY') {
            setActiveItemId('SUMMARY');
            prevItemIdRef.current = 'SUMMARY';
            // No form to reset here, or maybe reset to empty/safe values?
            // Since we unmount the form (conditionally), reset might not matter as much, but safer to keep state.
        }
    };

    const handleAddItem = () => {
        const currentFormValues = getValues();

        // If we are currently on SUMMARY, we don't have form values to save to "activeItemId".
        // But if we are on a product, we save it.
        if (activeItemId !== 'SUMMARY') {
            setItems(prev => prev.map(i => {
                if (i.id === activeItemId) {
                    return { ...i, inputData: currentFormValues, productName: currentFormValues.product };
                }
                return i;
            }));
        }

        const newId = 'temp_' + Date.now();
        const newItem: EditorItem = {
            id: newId,
            productName: 'Nuevo Producto',
            inputData: {},
            resultsSummary: {},
            order: items.length
        };

        setItems(prev => [...prev, newItem]);
        // Switch to it
        reset(getDefaultValues(newItem));
        setActiveItemId(newId);
        prevItemIdRef.current = newId;
    };

    const handleRemoveItem = (itemId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (items.length <= 1) {
            setToast({ message: "La oferta debe tener al menos un producto.", type: 'error' });
            return;
        }

        if (confirm('¿Seguro que quieres eliminar este producto de la oferta?')) {
            const newItems = items.filter(i => i.id !== itemId);
            setItems(newItems);

            // If we removed the active one, switch to first
            if (activeItemId === itemId) {
                const next = newItems[0];
                reset(getDefaultValues(next));
                setActiveItemId(next.id);
                prevItemIdRef.current = next.id;
            }
        }
    };

    const handleDuplicateItem = (itemId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        // 1. Get the item to copy
        // If it's the active item, we should take the CURRENT form values to be safe/up-to-date
        // If it's another item, take its stored state
        const itemToCopy = items.find(i => i.id === itemId);
        if (!itemToCopy) return;

        let dataToCopy = itemToCopy.inputData;
        let nameToCopy = itemToCopy.productName;

        if (activeItemId === itemId) {
            const currentForm = getValues();
            dataToCopy = { ...currentForm, product: undefined }; // store clean config
            nameToCopy = currentForm.product;
        }

        const newId = 'temp_' + Date.now();
        const newItem: EditorItem = {
            id: newId,
            productName: `${nameToCopy} (Copia)`,
            inputData: JSON.parse(JSON.stringify(dataToCopy)), // Deep copy
            resultsSummary: { ...itemToCopy.resultsSummary }, // Copy last known results
            order: items.length
        };

        setItems(prev => [...prev, newItem]);
        setToast({ message: "Producto duplicado correctamente.", type: 'success' });

        // Optional: switch to new item? Let's say yes for better UX
        // But we need to save current first if we were editing something else?
        // Actually, let's just add it. The user can switch if they want.
        // Wait, if we duplicate the ACTIVE item, we just took its values.
        // If we duplicate another item, we don't disturb the active one.
    };

    // --- CALCULATION LOGIC (Same as before) ---
    // Prepare defaults
    const ParsedInputForConfig = activeItem.inputData; // Initial loaded
    const savedConfig = ParsedInputForConfig.snapshotConfig;
    const isLockedStatus = initialData?.status && initialData.status !== 'Borrador';
    const isFrozen = isLockedStatus && !isAdmin;
    const effectiveConfig = (isLockedStatus && savedConfig) ? savedConfig : config;

    // Real-time calculation vars
    const currentBatchKg = parseFloat(watch('totalBatchKg') || 0);
    const currentSize = parseFloat(watch('unitSize') || 50);
    const currentDensity = parseFloat(watch('density') || 1);
    const derivedUnits = (currentSize > 0 && currentDensity > 0)
        ? (currentBatchKg * 1000) / (currentSize * currentDensity)
        : 0;

    const liveValues = { ...watch(), units: derivedUnits };
    const liveResults = calculateOfferCosts(liveValues, effectiveConfig);

    // --- SAVE LOGIC ---
    const onSubmit = async (currentFormData: any, overrides?: any) => {
        // 1. Capture current form data for the ACTIVE item
        const itemsWithActiveArg = items.map(i => {
            if (i.id === activeItemId) {
                // Merge current Document Config if not provided in overrides
                const existingDocConfig = (i.inputData as any)?.documentConfig || {};
                const docConfigToSave = overrides?.documentConfig || existingDocConfig;

                return {
                    ...i,
                    productName: currentFormData.product,
                    inputData: {
                        ...currentFormData,
                        units: derivedUnits, // Use the live derived units
                        snapshotConfig: effectiveConfig,
                        documentConfig: docConfigToSave,
                        ...(overrides || {})
                    }
                    // We don't set resultsSummary here yet, we do it for ALL items below
                };
            }
            return i;
        });

        // 2. RECALCULATE RESULTS FOR ALL ITEMS
        // This ensures inactive items have fresh resultsSummary if their inputData was changed but not saved
        const updatedItems = itemsWithActiveArg.map(item => {
            // Determine config to use (snapshot or global effective)
            const itemConfig = item.inputData.snapshotConfig || effectiveConfig;

            // Recalculate
            const results = calculateOfferCosts(item.inputData, itemConfig);

            return {
                ...item,
                resultsSummary: {
                    total_cost_unit: results.salePrice,
                    directCost: results.directCost,
                    salePrice: results.salePrice,
                    profit: results.profit,
                    units: results.derivedUnits,
                    totalValue: results.salePrice * results.derivedUnits
                }
            };
        });

        setItems(updatedItems); // Optimistic UI update

        // NEW: Calculate Global Totals for Root Offer Record
        const globalTotalValue = updatedItems.reduce((acc, item) => {
            const itemUnits = item.resultsSummary?.units || 0;
            const itemPrice = item.resultsSummary?.salePrice || 0;
            return acc + (itemUnits * itemPrice);
        }, 0);

        const method = offerId ? 'PUT' : 'POST';
        const url = offerId ? `/api/ofertas/${offerId}` : '/api/ofertas';

        const payload = {
            id: offerId, // for PUT
            client: client,
            // Offer Description (Main Name)
            description: offerDescription || 'Nueva Oferta',
            status: currentStatus,

            // SAVE GLOBAL SUMMARY TO ROOT
            resultsSummary: {
                totalValue: globalTotalValue
            },

            // Send ALL items
            items: updatedItems.map((i, idx) => ({
                id: i.id,
                productName: i.productName,
                inputData: i.inputData,
                resultsSummary: i.resultsSummary,
                order: idx
            }))
        };

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const savedOffer = await res.json();

                // Track activity
                trackActivity('offer', savedOffer.id, savedOffer.description, savedOffer.code);
                setToast({ message: 'Oferta guardada correctamente.', type: 'success' });

                // CRITICAL: Update local items with the REAL IDs returned from DB.
                // Otherwise, subsequent saves will send 'temp_' IDs again, causing the backend 
                // to delete the actual items (since they aren't in the "incomingIds" allowlist).
                if (savedOffer.items && Array.isArray(savedOffer.items)) {
                    // We need to map the server items to our EditorItem structure
                    const newEditorItems: EditorItem[] = savedOffer.items.map((srvItem: any) => ({
                        id: srvItem.id,
                        productName: srvItem.productName,
                        inputData: typeof srvItem.inputData === 'string' ? JSON.parse(srvItem.inputData) : srvItem.inputData,
                        resultsSummary: typeof srvItem.resultsSummary === 'string' ? JSON.parse(srvItem.resultsSummary) : srvItem.resultsSummary,
                        order: srvItem.order
                    }));

                    // We need to preserve the "active" selection.
                    // If we are in SUMMARY, stay there.
                    if (activeItemId === 'SUMMARY') {
                        setItems(newEditorItems);
                        // No need to reset form or change active ID
                    } else {
                        // Since specific IDs might have changed (temp_ -> real), we rely on INDEX.
                        const activeIndex = items.findIndex(i => i.id === activeItemId);
                        const newActiveIndex = activeIndex >= 0 ? activeIndex : 0;

                        setItems(newEditorItems);

                        // Update active ID to the new real ID
                        if (newEditorItems[newActiveIndex]) {
                            const newActiveId = newEditorItems[newActiveIndex].id;
                            setActiveItemId(newActiveId);
                            prevItemIdRef.current = newActiveId; // Sync ref !

                            // Also reset the form with the new "clean" values from server to avoid dirty states mismatch
                            reset(getDefaultValues(newEditorItems[newActiveIndex]));
                        }
                    }
                }

                if (!offerId) {
                    // If it was a CREATE, we redirect to URL with ID
                    setTimeout(() => router.replace(`/ofertas/editor/${savedOffer.id}`), 500);
                } else {
                    router.refresh();
                }
            } else {
                const err = await res.text();
                setToast({ message: `Error (${res.status}): ${err}`, type: 'error' });
            }
        } catch (e: any) {
            setToast({ message: `Error de conexión: ${e.message}`, type: 'error' });
        }
    };

    // --- DOCUMENT LOGIC ---
    const [docModalOpen, setDocModalOpen] = useState(false);
    const clientDetails = initialData?.clientDetails;
    const defaultDocumentConfig = {
        clientName: clientDetails?.businessName || clientDetails?.name || '',
        clientAddress: clientDetails?.address || '',
        ...activeItem.inputData.documentConfig
    };

    const handleDocAction = async (modalConfig: any, format: 'pdf' | 'docx' | 'save_only') => {
        // Prepare final data
        const currentFormData = getValues();
        const finalData = {
            ...initialData,
            ...currentFormData,
            documentConfig: modalConfig,
            snapshotConfig: effectiveConfig,
            client: client
        };

        // 1. Save Config to Offer (Persistence)
        if (!isFrozen) {
            await onSubmit(currentFormData, { documentConfig: modalConfig });
        }

        if (format === 'save_only') {
            setToast({ message: 'Configuración guardada correctamente', type: 'success' });
            // Do NOT close modal
            return;
        }

        // Generate flow...
        setToast({ message: 'Generando documento...', type: 'success' });

        // Generate
        // Prepare items for generation (Update active item with current form data)
        const currentItems = items.map(item => {
            if (item.id === activeItemId) {
                return {
                    ...item,
                    productName: currentFormData.product,
                    inputData: {
                        ...item.inputData,
                        ...currentFormData,
                        snapshotConfig: effectiveConfig,
                        // Ensure scenarios are passed if they are in form data
                        scenarios: currentFormData.scenarios || item.inputData.scenarios
                    }
                };
            }
            return item;
        });

        try {
            let blob;
            let filename = `Oferta_${finalData.description || offerId || 'Doc'}`;

            if (format === 'docx') {
                blob = await generateOfferDocument(finalData, currentItems);
                filename += '.docx';
            } else {
                // PDF Generator might need refactor too. For now, we pass result of MAIN active item?
                // Or disable PDF? Let's try to keeping it working for active item or refactor later.
                // Revert to single item behavior for PDF for now or TODO.
                const { generateOfferPDF } = await import('@/lib/generateOfferPDF');
                // Updated for multi-product support
                blob = await generateOfferPDF(finalData, currentItems);
                filename += '.pdf';
            }

            // ... download blob ...
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);

            setDocModalOpen(false);
        } catch (e: any) {
            console.error(e);
            setToast({ message: "Error generando documento: " + e.message, type: 'error' });
        }
    };

    // --- TEMPLATE LOGIC REMOVED ---

    // prevent enter submit
    const checkKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault(); };

    // Tabs List
    const tabs = [
        { id: 'bulk', label: '1. Bulk', icon: FlaskConical },
        { id: 'packaging', label: '2. Envasado', icon: Package },
        { id: 'extras', label: '3. Extras', icon: Puzzle },
        { id: 'summary', label: '4. Resumen', icon: BarChart3 },
    ];



    // --- TAB COST SUMMARY WIDGET ---
    const TabCostWidget = ({ tab, result, units }: { tab: string, result: any, units: number }) => {
        if (!result) return null;
        const details = result.details || {};

        // Define what to show per tab
        let content = null;
        switch (tab) {
            case 'bulk':
                const surplusCost = details.totalImputedSurplus || 0;
                content = (
                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem', lineHeight: 1.2, color: '#64748b', minWidth: '120px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>Total Granel: {formatCurrency(result.bulkCostUnit, 3)} €</div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <span>Mat: {formatCurrency(details.totalMaterialCost / (units || 1), 3)} €</span>
                            <span>Ops: {formatCurrency(details.mfgCost / (units || 1), 3)} €</span>
                        </div>
                        {surplusCost > 0 && (
                            <div style={{ color: '#d97706' }}>+ Sobrante: {formatCurrency(surplusCost / (units || 1), 3)} €</div>
                        )}
                    </div>
                );
                break;
            case 'packaging':
                content = (
                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem', lineHeight: 1.2, color: '#64748b', minWidth: '120px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>Total Envasado: {formatCurrency(result.packingCostUnit + result.processCostUnit, 3)} €</div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <span>Mat: {formatCurrency(result.packingCostUnit, 3)} €</span>
                            <span>Llenado: {formatCurrency(result.processCostUnit, 3)} €</span>
                        </div>
                    </div>
                );
                break;
            case 'extras':
                return null;
            case 'summary':
                return null;
        }

        if (!content) return null;

        return (
            <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '4px 8px',
                marginLeft: '1rem',
                borderLeft: '3px solid var(--color-primary)'
            }}>
                {content}
            </div>
        );
    };

    // Config Modal
    const [modalConfig, setModalConfig] = useState<any>({ isOpen: false });

    // Status Logic helpers
    const [currentStatus, setCurrentStatus] = useState(initialData?.status || 'Borrador');

    const handleStatusChange = (newStatus: string) => {
        setCurrentStatus(newStatus);
    };

    return (
        <div className={styles.container} style={{ height: 'calc(100vh - var(--header-height))', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* TOP HEADER */}
            <div style={{ flexShrink: 0, background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => router.back()} className={styles.backButton}><ArrowLeft size={20} /></button>

                    {/* 1. CODE (Rev) */}
                    {initialData?.code && (
                        <div style={{ background: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                            {initialData.code} <span style={{ opacity: 0.6 }}>(Rev{initialData.revision})</span>
                        </div>
                    )}

                    {/* 2. STATUS SELECTOR */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => !isReadOnly && setStatusDropdownOpen(!statusDropdownOpen)}
                            style={{
                                padding: '0.2rem 0.6rem',
                                background: getStatusColor(currentStatus),
                                color: 'white',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                border: 'none',
                                cursor: isReadOnly ? 'default' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                        >
                            {currentStatus}
                            {!isReadOnly && <ChevronDown size={14} />}
                        </button>

                        {statusDropdownOpen && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                                background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                zIndex: 50, minWidth: '160px', overflow: 'hidden'
                            }}>
                                {getNextPossibleStatuses(currentStatus, isAdmin).map(s => (
                                    <div
                                        key={s}
                                        onClick={() => {
                                            handleStatusChange(s);
                                            setStatusDropdownOpen(false);
                                        }}
                                        style={{
                                            padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer',
                                            background: currentStatus === s ? '#f1f5f9' : 'white',
                                            borderBottom: '1px solid #f1f5f9'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={e => e.currentTarget.style.background = currentStatus === s ? '#f1f5f9' : 'white'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(s) }} />
                                            {s}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 3. CLIENT */}
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>CLIENTE</div>
                        <ProtectedField value={client} isProtecting={!!offerId}>
                            <div style={{ width: '200px' }}>
                                <ClientSelect value={client} onChange={setClient} placeholder="Seleccionar Cliente" disabled={isReadOnly} />
                            </div>
                        </ProtectedField>
                    </div>

                    {/* 4. OFFER NAME (Description) */}
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>NOMBRE DE LA OFERTA</div>
                        <ProtectedField value={offerDescription} isProtecting={!!offerId}>
                            <div style={{ width: '300px' }}>
                                <input
                                    type="text"
                                    value={offerDescription}
                                    onChange={(e) => setOfferDescription(e.target.value)}
                                    placeholder="Descripción general..."
                                    disabled={isReadOnly}
                                    className={styles.inputBordered}
                                />
                            </div>
                        </ProtectedField>
                    </div>

                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>

                    <button
                        type="button"
                        onClick={() => handleSwitchItem('SUMMARY')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', padding: '6px 12px',
                            background: activeItemId === 'SUMMARY' ? '#eff6ff' : 'white',
                            color: activeItemId === 'SUMMARY' ? 'var(--color-primary)' : '#334155',
                            border: `1px solid ${activeItemId === 'SUMMARY' ? 'var(--color-primary)' : '#cbd5e1'}`,
                            borderRadius: '6px', cursor: 'pointer', fontWeight: 500
                        }}
                    >
                        <BarChart3 size={16} /> Resumen Global
                    </button>

                    <button type="button" onClick={() => !isReadOnly && setDocModalOpen(true)} disabled={!isValid || isReadOnly} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', padding: '6px 12px', background: 'white', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                        <FileText size={16} /> Documento
                    </button>

                    {!isReadOnly && (
                        <button onClick={handleSubmit((data) => onSubmit(data))} className={styles.primaryButton}>
                            <Save size={16} /> Guardar Oferta
                        </button>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT ROW */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* LEFT SIDEBAR: PRODUCTS LIST */}
                <div style={{ width: '240px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>Productos</span>
                        {!isReadOnly && (
                            <button onClick={() => handleAddItem()} style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }} title="Añadir Producto">
                                <Plus size={16} />
                            </button>
                        )}
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                        {items.map((item, idx) => (
                            <div
                                key={item.id}
                                onClick={() => handleSwitchItem(item.id)}
                                style={{
                                    padding: '0.75rem', borderRadius: '6px', marginBottom: '0.5rem', cursor: 'pointer',
                                    background: item.id === activeItemId ? 'white' : 'transparent',
                                    boxShadow: item.id === activeItemId ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    border: item.id === activeItemId ? '1px solid #cbd5e1' : '1px solid transparent',
                                    position: 'relative',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px'
                                }}
                                className="product-list-item"
                            >
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: item.id === activeItemId ? 'var(--color-primary-dark)' : '#64748b', flex: '1 1 auto', minWidth: 0, overflow: 'hidden', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.2' }}>
                                    {item.id === activeItemId ? (
                                        <>
                                            <input
                                                {...register('product', { required: true })}
                                                placeholder="Nombre del producto..."
                                                disabled={isReadOnly}
                                                // autoFocus only works on mount, so we need a ref or focus effect? 
                                                // Or just key on isRenaming? 
                                                // Simple: use styling to hide/show.
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        setIsRenaming(false);
                                                    }
                                                }}
                                                onBlur={() => setIsRenaming(false)}
                                                style={{
                                                    display: isRenaming ? 'block' : 'none',
                                                    width: '100%',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    borderBottom: '1px dashed #94a3b8',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    color: 'var(--color-primary-dark)',
                                                    outline: 'none',
                                                    padding: '2px 0',
                                                    cursor: 'text'
                                                }}
                                            />
                                            {!isRenaming && (
                                                <span
                                                    style={{ whiteSpace: 'normal', wordBreak: 'break-word', cursor: isReadOnly ? 'default' : 'text' }}
                                                    onDoubleClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!isReadOnly) {
                                                            setIsRenaming(true);
                                                            // setTimeout to focus input? existing input ref integration might be needed.
                                                            // Since input was 'display:none', it wasn't focused.
                                                            // We can rely on clicking? No.
                                                            // Let's rely on user clicking input after it appears? No, should be auto.
                                                            // Adding Ref to input to focus.
                                                            setTimeout(() => {
                                                                const inputs = document.querySelectorAll('input[name="product"]');
                                                                if (inputs.length > 0) (inputs[0] as HTMLInputElement).focus();
                                                            }, 50);
                                                        }
                                                    }}
                                                >
                                                    {/* Use watch to get live value, simplified */}
                                                    {watch('product') || 'Sin Nombre'}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span title={item.productName || 'Sin Nombre'}>{idx + 1}. {item.productName || 'Sin Nombre'}</span>
                                    )}
                                </div>
                                {item.id === activeItemId && !isReadOnly && (
                                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                        <button
                                            onClick={(e) => handleDuplicateItem(item.id, e)}
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', opacity: 0.7 }}
                                            title="Duplicar"
                                        >
                                            <Copy size={14} />
                                        </button>
                                        {items.length > 1 && (
                                            <button
                                                onClick={(e) => handleRemoveItem(item.id, e)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.7 }}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                </div>
                {/* RIGHT: EDITOR (Only if items exist) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'white' }}>

                    {activeItemId === 'SUMMARY' ? (
                        <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
                            <OfferSummaryGlobal items={items} />
                        </div>
                    ) : (
                        items.length === 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>No hay productos. Añade uno.</div>
                        ) : (
                            <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                {/* Product Name & Actions Header - SIMPLIFIED */}
                                <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', background: '#fff' }}>

                                    {/* RICH GLOBAL CONFIG WIDGET */}
                                    <div style={{ display: 'flex', gap: '2rem', marginRight: '1.5rem', borderRight: '1px solid #e2e8f0', paddingRight: '1.5rem' }}>
                                        {/* GROUP 1: MFG */}
                                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', letterSpacing: '0.05em', marginBottom: '2px' }}>FABRICACIÓN PRINCIPAL <span style={{ color: '#ef4444' }}>*</span></div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        {...register('totalBatchKg', { required: true })}
                                                        style={{ width: '80px', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}
                                                        disabled={isReadOnly}
                                                    />
                                                    <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Kgs Totales</span>
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600, display: 'flex', flexDirection: 'column', paddingTop: '2px' }}>
                                                    {isFinite(derivedUnits) ? formatNumber(derivedUnits, 0) : '-'}
                                                    <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 400 }}>Uds (Calc)</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* GROUP 2: PACKAGING */}
                                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', letterSpacing: '0.05em', marginBottom: '2px' }}>ENVASE <span style={{ color: '#ef4444' }}>*</span></div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <input
                                                        type="number"
                                                        {...register('unitSize', { required: true })}
                                                        style={{ width: '90px', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.9rem' }}
                                                        placeholder="100"
                                                        disabled={isReadOnly}
                                                    />
                                                    <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Capacidad (ml)</span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        {...register('density', { required: true })}
                                                        style={{ width: '60px', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.9rem' }}
                                                        placeholder="1"
                                                        disabled={isReadOnly}
                                                    />
                                                    <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Densidad</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* TABS moved to Header */}
                                    <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', padding: '4px', borderRadius: '8px', marginRight: '1rem' }}>
                                        {tabs.map(tab => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setActiveTab(tab.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    background: activeTab === tab.id ? 'white' : 'transparent',
                                                    color: activeTab === tab.id ? 'var(--color-primary)' : '#64748b',
                                                    boxShadow: activeTab === tab.id ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <tab.icon size={16} />
                                                <span>{tab.label.split('. ')[1]}</span>
                                            </button>
                                        ))}

                                        {/* Live Cost Widget inside same container for flow */}
                                        <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '0.5rem', marginLeft: '0.5rem', display: 'flex', alignItems: 'center' }}>
                                            <TabCostWidget tab={activeTab} result={liveResults} units={liveValues.units} />
                                        </div>
                                    </div>


                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    </div>
                                </div>

                                {/* Persistent Data Bar */}

                                {/* Tabs & Content layout (Reuse existing logic) */}
                                {/* Tabs & Content layout (Simplified - No Sidebar) */}
                                <div className={styles.mainLayout} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                                    {/* Tab Content - Full Width */}
                                    <div className={styles.contentArea} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
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
                            </form>
                        )
                    )}
                </div>
            </div>


            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}


            <DocumentConfigModal
                isOpen={docModalOpen}
                onClose={() => setDocModalOpen(false)}
                initialConfig={defaultDocumentConfig}
                offerStatus={initialData?.status || 'Borrador'}
                onGenerate={handleDocAction}
            />
        </div >
    );
}

