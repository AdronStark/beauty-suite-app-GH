'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import { ChevronRight, ChevronLeft, ChevronDown, Save, Plus, Trash2, DollarSign, Package, FlaskConical, Target, Upload, CheckSquare, Square, Sparkles, Image as ImageIcon } from 'lucide-react';
import styles from './wizard.module.css';
import GalleryModal from '@/components/briefings/GalleryModal';
import Toast, { ToastType } from '@/components/ui/Toast';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { formatCurrency } from '@/lib/formatters';
import SampleRegistrationModal from '@/components/briefings/SampleRegistrationModal';
import ClientSelect from '@/components/clients/ClientSelect';
import { ProtectedField } from '@/components/ui/ProtectedField';

type FormulaIngredient = {
    name: string;
    percentage: string;
    cost?: string;
};

type FormData = {
    // 1. Basic
    clientName: string;
    productName: string;
    category: string;

    // 2. Commercial
    unitsPerYear: string;
    targetPrice: string;
    distributionChannels: string[];
    launchDate: string;

    // 3. Benchmarks & Strategy
    targetAudience: string;
    claims: string;
    benchmarkProduct: string;
    benchmarkUrl: string;

    // 4. Formula & Quality
    formulaOwnership: 'client' | 'new' | 'standard';
    targetBulkCost: string;
    density: string; // New field for cost calc
    pao: string;
    texture: string;
    color: string;
    fragrance: string;
    formula: FormulaIngredient[];
    forbiddenIngredients: string;
    qualityTests: string[];

    // 5. Packaging & Logistics
    packagingType: string;
    capacity: string;
    primaryMaterial: string;
    decoration: string;
    targetPricePrimary: string;
    supplierPrimary: string;

    secondaryPackaging: string[];
    unitsPerBox: string;
    palletType: string;
};

const STEPS = [
    { id: 1, label: 'Comercial', icon: DollarSign },
    { id: 2, label: 'Estrategia', icon: Upload },
    { id: 3, label: 'Fórmula', icon: FlaskConical },
    { id: 4, label: 'Pack', icon: Package },
    { id: 5, label: 'Revisión y Guardar', icon: Save },
];

const QUALITY_TESTS = [
    { id: 'stability', label: 'Estabilidad (3m 40ºC)' },
    { id: 'compatibility', label: 'Compatibilidad Envase' },
    { id: 'challenge', label: 'Challenge Test (Conservantes)' },
    { id: 'clinical', label: 'Eficacia Clínica' },
    { id: 'dermatological', label: 'Test Dermatológico' },
    { id: 'ophthalmological', label: 'Test Oftalmológico' },
];

const SALES_CHANNELS = [
    { id: 'Retail', label: 'Gran Consumo (Retail)' },
    { id: 'Pharmacy', label: 'Farmacia' },
    { id: 'Professional', label: 'Profesional (Salones)' },
    { id: 'Online', label: 'E-commerce / D2C' },
    { id: 'Luxury', label: 'Alta Gama' },
];

const SECONDARY_PACK_OPTIONS = [
    { id: 'FoldingBox', label: 'Estuche (Folding)' },
    { id: 'RigidBox', label: 'Caja Rígida (Coffret)' },
    { id: 'Cello', label: 'Celofán / Retractilado' },
    { id: 'Spatula', label: 'Espátula / Accesorio' },
    { id: 'Leaflet', label: 'Prospecto Interior' },
    { id: 'SecurityLabel', label: 'Etiqueta Seguridad' },
];

export default function WizardClient({ initialData, initialMode }: { initialData: any, initialMode?: 'manual' | 'smart' }) {
    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
    const { trackActivity } = useRecentActivity();

    const parsedInit = initialData?.formData ? JSON.parse(initialData.formData) : {};

    // Determine entry mode.
    // We want to show "Selection Mode" (Smart vs Manual) ONLY when:
    // 1. It is a Draft
    // 2. We don't have technical data defined yet (implies it's a fresh prompt)
    const hasTechnicalData = !!(parsedInit.packagingType || parsedInit.texture || parsedInit.claims || (parsedInit.formula && parsedInit.formula.length > 1));
    const isDraft = !initialData?.status || initialData.status === 'Borrador';

    // If it's not a draft or we already have data, go straight to manual form.
    const [entryMode, setEntryMode] = useState<'selection' | 'manual' | 'smart'>(
        initialMode || ((isDraft && !hasTechnicalData) ? 'selection' : 'manual')
    );

    const [step, setStep] = useState(1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [showGallery, setShowGallery] = useState(false);
    const [galleryUrl, setGalleryUrl] = useState<string | null>(null);
    const [saveToGallery, setSaveToGallery] = useState(true);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const parsedFormData = initialData?.formData ? JSON.parse(initialData.formData) : {};

    const defaultValues = {
        ...parsedFormData,
        clientName: initialData?.clientName || parsedFormData.clientName || '',
        productName: initialData?.productName || parsedFormData.productName || '',
        category: initialData?.category || parsedFormData.category || '',

        formula: parsedFormData.formula || parsedFormData.actives || [{ name: '', percentage: '' }],
        distributionChannels: parsedFormData.distributionChannels || [],
        qualityTests: parsedFormData.qualityTests || [],
        secondaryPackaging: parsedFormData.secondaryPackaging || [],

        launchDate: parsedFormData.launchDate || (initialData?.targetDate ? new Date(initialData.targetDate).toISOString().split('T')[0] : '')
    };

    const { register, control, handleSubmit, formState: { errors }, trigger, watch, reset, setValue } = useForm<FormData>({
        defaultValues
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "formula"
    });

    // AI ANALYSIS
    const convertBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = () => {
                resolve(fileReader.result as string);
            };
            fileReader.onerror = (error) => {
                reject(error);
            };
        });
    };

    const [progress, setProgress] = useState(0);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setProgress(0);

        // Simulate progress
        const interval = setInterval(() => {
            setProgress(old => {
                if (old >= 90) return old;
                // Slower increment as it gets higher
                const increment = old < 50 ? 5 : (old < 80 ? 2 : 1);
                return old + increment;
            });
        }, 800);

        try {
            const contextText = document.querySelector('textarea')?.value || "Cosmetic product development";
            let base64Image = null;

            if (galleryUrl) {
                const r = await fetch(galleryUrl);
                const blob = await r.blob();
                base64Image = await convertBase64(new File([blob], "gallery_image.jpg"));
            } else if (files.length > 0) {
                base64Image = await convertBase64(files[0]);

                if (saveToGallery) {
                    try {
                        const formData = new FormData();
                        formData.append('file', files[0]);
                        await fetch('/api/gallery', { method: 'POST', body: formData });
                    } catch (e) { console.warn("Failed to save to gallery", e); }
                }
            }

            const res = await fetch('/api/briefings/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: base64Image,
                    context: contextText
                })
            });

            clearInterval(interval);
            setProgress(100); // Complete

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Analysis failed");
            }

            const aiResult = await res.json();

            // Populate Form - Merge with existing basic info
            const currentValues = watch();
            reset({
                ...currentValues,
                ...aiResult,
                // PERSIST CRITICAL IDENTIFIERS: Ensure these are NOT overwritten by AI hallucinations
                clientName: currentValues.clientName || aiResult.clientName,
                productName: currentValues.productName || aiResult.productName,
                // Also preserve category if already selected and meaningful
                category: (currentValues.category && currentValues.category !== '') ? currentValues.category : aiResult.category
            });

            setEntryMode('manual');
            setStep(1);

        } catch (error: any) {
            clearInterval(interval);
            console.error("AI Error:", error);
            setToast({ message: `Error: ${error.message}`, type: 'error' });
        } finally {
            // Delay slightly to show 100%
            setTimeout(() => {
                setIsAnalyzing(false);
                setProgress(0);
            }, 500);
        }
    };

    if (isAnalyzing) {
        return (
            <div className={styles.analyzingOverlay}>
                <div className={styles.spinner} style={{ marginBottom: '2rem' }} />
                <div className={styles.aiMessage} style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>
                    Analizando y Generando Briefing...
                </div>

                <div className={styles.progressBarContainer}>
                    <div className={styles.progressBarFill} style={{ width: `${progress}%` }} />
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
                    {progress}%
                </div>

                <div style={{ marginTop: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                    Extrayendo ingredientes, packaging y claims
                </div>
            </div>
        );
    }

    /* SELECTION MODE For New Briefings */
    if (entryMode === 'selection') {
        const clientVal = watch('clientName');
        const productVal = watch('productName');

        return (
            <div className={styles.container} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '2rem', color: '#1e293b' }}>Completar Definición</h1>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', width: '100%', maxWidth: '600px', justifyContent: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Cliente</label>
                        <Controller
                            control={control}
                            name="clientName"
                            render={({ field }) => (
                                <ClientSelect
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Seleccionar Cliente"
                                />
                            )}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Proyecto / Producto</label>
                        <input
                            {...register('productName')}
                            placeholder="Nombre del proyecto"
                            style={{ width: '100%', padding: '0.5rem', border: 'none', borderBottom: '1px solid #e2e8f0', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
                        />
                    </div>
                </div>

                <div className={styles.modeSelection}>
                    <div className={styles.modeCard} onClick={() => setEntryMode('manual')}>
                        <div className={styles.modeIcon}><Plus size={32} /></div>
                        <h3 className={styles.modeTitle}>Rellenar Manualmente</h3>
                        <p className={styles.modeDesc}>Introduce los detalles técnicos paso a paso.</p>
                        <button className={styles.secondaryButton} style={{ marginTop: 'auto', width: '100%' }}>Manual</button>
                    </div>

                    <div className={styles.modeCard} onClick={() => setEntryMode('smart')}>
                        <div className={styles.modeIcon} style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)', color: '#2563eb' }}><Sparkles size={32} /></div>
                        <h3 className={styles.modeTitle}>Smart Briefing AI</h3>
                        <p className={styles.modeDesc}>Sube referencias y deja que la IA rellene los detalles.</p>
                        <button className={styles.primaryButton} style={{ marginTop: 'auto', width: '100%', background: '#2563eb', justifyContent: 'center' }}>Usar IA <Sparkles size={16} /></button>
                    </div>
                </div>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </div>
        );
    }

    /* SMART INPUT MODE */
    if (entryMode === 'smart') {
        // ... (Smart Briefing Logic remains similar, just refined styles)
        const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) setFiles(Array.from(e.target.files));
        };
        const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
        const handleDrop = (e: React.DragEvent) => {
            e.preventDefault(); e.stopPropagation();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) setFiles(Array.from(e.dataTransfer.files));
        };

        const currentClient = watch('clientName');
        const currentProduct = watch('productName');

        return (
            <div className={styles.container} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'white', padding: '3rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', maxWidth: '800px', width: '100%' }}>
                    <button onClick={() => setEntryMode('selection')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                        <ChevronLeft size={16} /> Volver
                    </button>

                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{
                            background: '#f1f5f9',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            display: 'inline-block',
                            marginBottom: '1.5rem',
                            border: '1px solid #e2e8f0'
                        }}>
                            <span style={{ color: '#64748b', fontWeight: 500 }}>Cliente: </span>
                            <span style={{ color: '#0f172a', fontWeight: 700, marginRight: '1rem' }}>{currentClient || 'Sin Cliente'}</span>
                            <span style={{ color: '#cbd5e1' }}>|</span>
                            <span style={{ color: '#64748b', fontWeight: 500, marginLeft: '1rem' }}>Proyecto: </span>
                            <span style={{ color: '#0f172a', fontWeight: 700 }}>{currentProduct || 'Sin Nombre'}</span>
                        </div>

                        <div className={styles.modeIcon} style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)', color: '#2563eb', margin: '0 auto 1rem auto' }}><Sparkles size={32} /></div>
                        <h2 className={styles.stepTitle}>Smart Briefing</h2>
                        <p className={styles.stepSubtitle}>Aportanos contexto y la IA hará el trabajo pesado.</p>
                    </div>

                    <div
                        style={{ border: '2px dashed #cbd5e1', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', marginBottom: '2rem', cursor: 'pointer', background: '#f8fafc' }}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple accept="image/*,.pdf" onChange={onFileChange} />
                        <Upload size={48} style={{ color: files.length > 0 ? '#2563eb' : '#94a3b8', marginBottom: '1rem', margin: '0 auto' }} />
                        <p style={{ fontWeight: 600, color: '#1e293b' }}>
                            {files.length > 0 ? `${files.length} archivo(s) seleccionado(s)` : 'Arrastra fotos de referencia aquí'}
                        </p>
                    </div>

                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Contexto / Instrucciones</label>
                    <textarea
                        className={styles.input}
                        rows={4}
                        placeholder="Ej. Quiero una crema antiedad parecida a la de La Mer..."
                        style={{ marginBottom: '1.5rem' }}
                    />

                    <button className={styles.primaryButton} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', background: '#2563eb', justifyContent: 'center' }} onClick={handleAnalyze}>
                        <Sparkles size={20} /> Generar Briefing con IA
                    </button>
                </div>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </div>
        );
    }

    const onSubmit = async (data: FormData) => {
        try {
            // ALWAYS update the existing record
            const url = `/api/briefings/${initialData.id}`;
            const method = 'PUT';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                // Track activity
                trackActivity('briefing', initialData.id, data.productName, initialData.code);

                router.refresh();
                setToast({ message: "Briefing guardado correctamente", type: 'success' });
            } else {
                setToast({ message: "Error al guardar el briefing", type: 'error' });
            }
        } catch (e) {
            console.error(e);
            setToast({ message: "Error de conexión", type: 'error' });
        }
    };

    const next = async () => {
        let valid = true;
        if (step === 1) {
            valid = await trigger(['clientName', 'productName']);
        }
        if (valid) setStep(s => Math.min(s + 1, STEPS.length));
    };

    const formData = watch();

    // Helper for Multi-Select Checkboxes
    const CheckboxGroup = ({ name, options }: { name: any, options: { id: string, label: string }[] }) => (
        <Controller
            name={name}
            control={control}
            defaultValue={[]}
            render={({ field }) => (
                <div className={styles.checkboxGrid}>
                    {options.map(opt => (
                        <label key={opt.id} className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                value={opt.id}
                                checked={(field.value || []).includes(opt.id)}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    const current = field.value || [];
                                    if (e.target.checked) {
                                        field.onChange([...current, value]);
                                    } else {
                                        field.onChange(current.filter((v: string) => v !== value));
                                    }
                                }}
                            />
                            <span>{opt.label}</span>
                        </label>
                    ))}
                </div>
            )}
        />
    );

    // Status State Machine
    const currentStatus = initialData?.status || 'Borrador';
    const availableTransitions: Record<string, string[]> = {
        'Borrador': ['Enviado a Cliente'],
        'Enviado a Cliente': ['Aceptado', 'Rechazado', 'Borrador'],
        'Aceptado': [],
        'Rechazado': []
    };
    const nextStates = availableTransitions[currentStatus] || [];
    const isTerminal = currentStatus === 'Aceptado' || currentStatus === 'Rechazado';

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'Borrador': '#64748b',
            'Enviado a Cliente': '#2563eb',
            'Aceptado': '#16a34a',
            'Rechazado': '#dc2626'
        };
        return colors[status] || '#64748b';
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            const res = await fetch(`/api/briefings/${initialData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, status: newStatus }),
            });
            if (res.ok) {
                // Track activity on status change too
                trackActivity('briefing', initialData.id, formData.productName, initialData.code);

                router.refresh();
                setToast({ message: `Estado cambiado a "${newStatus}"`, type: 'success' });
            } else {
                setToast({ message: 'Error al cambiar estado', type: 'error' });
            }
        } catch (e) {
            setToast({ message: 'Error de conexión', type: 'error' });
        }
    };

    const handleNewRevision = async () => {
        try {
            const res = await fetch('/api/briefings/revision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceBriefingId: initialData.id })
            });

            if (res.ok) {
                const newBriefing = await res.json();
                setToast({ message: "Nueva revisión creada.", type: 'success' });
                setTimeout(() => router.push(`/briefings/wizard?id=${newBriefing.id}`), 1000);
            } else {
                setToast({ message: "Error al crear revisión: " + await res.text(), type: 'error' });
            }
        } catch (e: any) {
            setToast({ message: "Error: " + e.message, type: 'error' });
        }
    };

    const handleGenerateFormula = async () => {
        try {
            const res = await fetch('/api/formulas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ briefingId: initialData.id })
            });

            if (res.ok) {
                setToast({ message: "Fórmula generada correctamente", type: 'success' });
                router.refresh();
            } else {
                setToast({ message: "Error al generar fórmula", type: 'error' });
            }
        } catch (e) {
            setToast({ message: "Error de conexión", type: 'error' });
        }
    };

    return (
        <div className={styles.container}>
            {/* Top Bar / Header */}
            <header className={styles.topBar} style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                {/* Left Section: Code, Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button type="button" onClick={() => router.push('/briefings')} className={styles.backButton}>
                        <ChevronLeft size={20} />
                    </button>

                    {/* Code Badge */}
                    <div style={{ background: 'var(--color-primary-light)', color: 'white', padding: '0.25rem 0.8rem', borderRadius: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                        #{initialData.code || '-'}
                        {(initialData.revision !== undefined && initialData.revision !== null) && <span style={{ fontSize: '0.75em', opacity: 0.85 }}>(Rev {initialData.revision})</span>}
                    </div>

                    {/* Status Badge with Dropdown */}
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
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, minWidth: '150px', overflow: 'hidden'
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

                    {/* Create Revision Button */}
                    {isTerminal && (
                        <button
                            type="button"
                            onClick={handleNewRevision}
                            style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#334155', fontSize: '0.8rem', padding: '0.25rem 0.75rem', borderRadius: '0.375rem', cursor: 'pointer' }}
                        >
                            + Crear Revisión
                        </button>
                    )}

                    {/* Sample Registration Button */}
                    {/* Sample Registration Button & Formula Gen */}
                    {/* Only show Generate Formula if less than 1 formula exists or just always allow multiple? Always allow. */}
                    <button
                        type="button"
                        onClick={handleGenerateFormula}
                        title="Generar Fórmula desde este Briefing"
                        style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#334155', fontSize: '0.8rem', padding: '0.25rem 0.75rem', borderRadius: '0.375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <FlaskConical size={14} /> +Fórmula
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsSampleModalOpen(true)}
                        style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#334155', fontSize: '0.8rem', padding: '0.25rem 0.75rem', borderRadius: '0.375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <Package size={14} /> Enviar Muestra
                    </button>
                </div>

                {/* Center/Spacer Section: Client & Product Inputs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1, justifyContent: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '160px' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>Cliente</label>
                        <ProtectedField
                            value={watch('clientName')}
                            isProtecting={!!initialData?.id}
                            protectionMessage="El cliente define el proyecto. ¿Cambiar cliente?"
                        >
                            <Controller
                                control={control}
                                name="clientName"
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <ClientSelect
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Seleccionar Cliente"
                                    />
                                )}
                            />
                        </ProtectedField>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '220px' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>Producto</label>
                        <ProtectedField
                            value={watch('productName')}
                            isProtecting={!!initialData?.id}
                            protectionMessage="¿Editar nombre del producto?"
                        >
                            <input
                                {...register('productName', { required: true })}
                                style={{ border: 'none', borderBottom: '1px solid #e2e8f0', padding: '0.25rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-primary-dark)', outline: 'none', background: 'transparent', width: '100%' }}
                                placeholder="Producto"
                            />
                        </ProtectedField>
                    </div>
                </div>



                {/* Right Section: Save Button */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="button" onClick={handleSubmit(onSubmit)} className={styles.primaryButton}>
                        <Save size={18} /> Guardar
                    </button>
                </div>
            </header>

            {/* Sample Modal */}
            {isSampleModalOpen && (
                <SampleRegistrationModal
                    briefingId={initialData.id}
                    formulas={initialData.formulas || []}
                    onClose={() => setIsSampleModalOpen(false)}
                    onSuccess={() => {
                        setIsSampleModalOpen(false);
                        setToast({ message: "Muestra registrada correctamente", type: 'success' });
                    }}
                />
            )}

            {/* Main Layout */}
            <div className={styles.mainLayout}>
                {/* Sidebar Navigation */}
                <div className={styles.sidebar}>
                    <div className={styles.sidebarTitle}>Fases del Briefing</div>
                    {STEPS.map((s) => {
                        const isActive = s.id === step;
                        const Icon = s.icon;
                        return (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setStep(s.id)}
                                className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
                            >
                                <Icon size={20} />
                                {s.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className={styles.contentArea}>
                    <form className={styles.formCard}>
                        {step === 1 && (
                            <div className={styles.stepContent}>
                                <h2 className={styles.stepTitle}>Objetivos Comerciales</h2>
                                <p className={styles.stepSubtitle}>Establece el marco de negocio, categoría y canales de venta.</p>

                                <div className={styles.field}>
                                    <label>Categoría</label>
                                    <select {...register('category')} className={styles.input}>
                                        <option value="Facial">Facial</option>
                                        <option value="Corporal">Corporal</option>
                                        <option value="Capilar">Capilar</option>
                                        <option value="Solar">Solar</option>
                                        <option value="Higiene">Higiene</option>
                                        <option value="Perfumería">Perfumería</option>
                                    </select>
                                </div>

                                <div className={styles.grid2}>
                                    <div className={styles.field}>
                                        <label>Unidades Anuales (Estimadas)</label>
                                        <input type="number" {...register('unitsPerYear')} className={styles.input} placeholder="Ej. 50000" />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Target Price (€/ud)</label>
                                        <input type="number" step="0.01" {...register('targetPrice')} className={styles.input} placeholder="Ej. 1.25" />
                                    </div>
                                </div>

                                <div className={styles.field}>
                                    <label>Fecha de Lanzamiento Deseada</label>
                                    <input type="date" {...register('launchDate')} className={styles.input} />
                                </div>

                                <div className={styles.field}>
                                    <label style={{ marginBottom: '1rem', display: 'block' }}>Canales de Distribución</label>
                                    <CheckboxGroup name="distributionChannels" options={SALES_CHANNELS} />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className={styles.stepContent}>
                                <h2 className={styles.stepTitle}>Estrategia y Benchmarks</h2>
                                <p className={styles.stepSubtitle}>¿A quién nos dirigimos y en qué nos inspiramos?</p>

                                <div className={styles.field}>
                                    <label>Público Objetivo</label>
                                    <input {...register('targetAudience')} className={styles.input} placeholder="Ej: Mujeres 35-55 años..." />
                                </div>

                                <div className={styles.field}>
                                    <label>Claims Principales (Argumentario)</label>
                                    <textarea {...register('claims')} className={styles.input} rows={3} placeholder="Ej. 99% Natural, Vegano, Efecto Lifting..." />
                                </div>

                                <div className={styles.separator} />
                                <h3>Benchmark (Referencia)</h3>

                                <div className={styles.grid2}>
                                    <div className={styles.field}>
                                        <label>Producto de Referencia</label>
                                        <input {...register('benchmarkProduct')} className={styles.input} placeholder="Marca / Nombre" />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Enlace / URL</label>
                                        <input {...register('benchmarkUrl')} className={styles.input} placeholder="https://..." />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className={styles.stepContent}>
                                <h2 className={styles.stepTitle}>Fórmula y Calidad</h2>
                                <p className={styles.stepSubtitle}>Detalles técnicos, activos y requisitos de calidad.</p>

                                <div className={styles.grid3}>
                                    <div className={styles.field}>
                                        <label>Propiedad Fórmula</label>
                                        <select {...register('formulaOwnership')} className={styles.input}>
                                            <option value="new">Nueva (Nuestra)</option>
                                            <option value="client">Cliente (Técnica)</option>
                                            <option value="standard">Base Estándar</option>
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Target Cost Granel (€/kg)</label>
                                        <input type="number" step="0.01" {...register('targetBulkCost')} className={styles.input} placeholder="Ej. 4.50" />
                                    </div>
                                    <div className={styles.field}>
                                        <label>PAO (Meses)</label>
                                        <input {...register('pao')} className={styles.input} placeholder="Ej. 12M" />
                                    </div>
                                </div>

                                <div className={styles.grid2}>
                                    <div className={styles.field}>
                                        <label>Textura</label>
                                        <input {...register('texture')} className={styles.input} placeholder="Ej. Gel-crema" />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Color / Fragancia</label>
                                        <input {...register('fragrance')} className={styles.input} placeholder="Ej. Blanco / Floral suave" />
                                    </div>
                                </div>

                                <div className={styles.field}>
                                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        Fórmula Cualitativa (Ingredientes / % / Coste)
                                        <button type="button" onClick={() => append({ name: '', percentage: '', cost: '' })} className={styles.addBtn}>
                                            <Plus size={14} /> Añadir Ingrediente
                                        </button>
                                    </label>

                                    {/* Header Row */}
                                    <div className={styles.activeRow} style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                                        <span>INGREDIENTE (INCI)</span>
                                        <span>%</span>
                                        <span>€/KG</span>
                                        <span></span>
                                    </div>

                                    <div className={styles.activesList}>
                                        {fields.map((field, index) => (
                                            <div key={field.id} className={styles.activeRow}>
                                                <input
                                                    {...register(`formula.${index}.name`)}
                                                    placeholder="Ingrediente"
                                                    className={styles.input}
                                                />
                                                <input
                                                    {...register(`formula.${index}.percentage`)}
                                                    placeholder="%"
                                                    className={styles.input}
                                                />
                                                <input
                                                    {...register(`formula.${index}.cost`)}
                                                    placeholder="€/kg"
                                                    type="number"
                                                    step="0.01"
                                                    className={styles.input}
                                                />
                                                <button type="button" onClick={() => remove(index)} className={styles.removeBtn}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Automatic Calculation Summary */}
                                    {fields.length > 0 && (
                                        <div style={{ marginTop: '1.5rem', background: '#f0f9ff', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #bae6fd' }}>
                                            <h4 style={{ margin: '0 0 1rem 0', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <DollarSign size={18} /> Estimación de Costes
                                            </h4>

                                            <div className={styles.grid3} style={{ marginBottom: '0' }}>
                                                <div className={styles.field} style={{ marginBottom: 0 }}>
                                                    <label style={{ color: '#0369a1' }}>Coste Fórmula (€/kg)</label>
                                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0c4a6e' }}>
                                                        {(() => {
                                                            const total = fields.reduce((acc, _, idx) => {
                                                                // Use watch to get real-time values including those not yet submitted
                                                                // Note: watch('formula') gives the array with current values
                                                                const item = formData.formula?.[idx];
                                                                if (!item) return acc;
                                                                const pct = parseFloat(item.percentage) || 0;
                                                                const cst = parseFloat(item.cost || '0') || 0;
                                                                return acc + (pct * cst / 100);
                                                            }, 0);
                                                            return formatCurrency(total, 4); // 4 decimals for high precision in bulk
                                                        })()} €
                                                    </div>
                                                </div>

                                                <div className={styles.field} style={{ marginBottom: 0 }}>
                                                    <label style={{ color: '#0369a1' }}>Densidad (g/ml)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        defaultValue="1.00"
                                                        {...register('density')}
                                                        className={styles.input}
                                                        style={{ borderColor: '#bae6fd', background: 'white' }}
                                                    />
                                                </div>

                                                <div className={styles.field} style={{ marginBottom: 0 }}>
                                                    <label style={{ color: '#0369a1' }}>Coste Unitario (MMPP)</label>
                                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0c4a6e' }}>
                                                        {(() => {
                                                            const totalBulk = fields.reduce((acc, _, idx) => {
                                                                const item = formData.formula?.[idx];
                                                                if (!item) return acc;
                                                                const pct = parseFloat(item.percentage) || 0;
                                                                const cst = parseFloat(item.cost || '0') || 0;
                                                                return acc + (pct * cst / 100);
                                                            }, 0);

                                                            const cap = parseFloat(formData.capacity || '0');
                                                            const den = parseFloat(formData.density || '1') || 1;

                                                            // Cost = Bulk (€/kg) * (Capacity(ml)*density(g/ml) / 1000)
                                                            const unitWeightKg = (cap * den) / 1000;
                                                            const unitCost = totalBulk * unitWeightKg;

                                                            return formatCurrency(unitCost, 4);
                                                        })()} €
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>
                                                        Para envase de {formData.capacity || '0'} ml
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.field}>
                                    <label>Blacklist (Prohibidos)</label>
                                    <input {...register('forbiddenIngredients')} className={styles.input} placeholder="Ej. Parabenos, Siliconas..." style={{ borderColor: '#f87171' }} />
                                </div>

                                <div className={styles.separator} />

                                <div className={styles.field}>
                                    <label style={{ marginBottom: '1rem', display: 'block' }}>Requisitos de Calidad y Tests</label>
                                    <CheckboxGroup name="qualityTests" options={QUALITY_TESTS} />
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className={styles.stepContent}>
                                <h2 className={styles.stepTitle}>Packaging y Logística</h2>
                                <p className={styles.stepSubtitle}>Especificaciones de envase, targets y logística.</p>

                                <div className={styles.grid2}>
                                    <div className={styles.field}>
                                        <label>Tipo de Envase (1º)</label>
                                        <select {...register('packagingType')} className={styles.input}>
                                            <option value="Jar">Tarro (Jar)</option>
                                            <option value="Bottle">Botella</option>
                                            <option value="Tube">Tubo</option>
                                            <option value="Airless">Airless</option>
                                            <option value="Dropper">Gotero</option>
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Capacidad (ml)</label>
                                        <input {...register('capacity')} className={styles.input} placeholder="Ej. 50" />
                                    </div>
                                </div>

                                <div className={styles.grid2}>
                                    <div className={styles.field}>
                                        <label>Material / Decoración</label>
                                        <input {...register('primaryMaterial')} className={styles.input} placeholder="Ej. Vidrio / Serigrafía" />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Proveedor Preferente</label>
                                        <input {...register('supplierPrimary')} className={styles.input} placeholder="Ej. Quadpack" />
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label>Target Price Pack Completo (€/ud)</label>
                                    <input type="number" step="0.01" {...register('targetPricePrimary')} className={styles.input} placeholder="Ej. 0.85" />
                                </div>

                                <div className={styles.separator} />

                                <div className={styles.field}>
                                    <label style={{ marginBottom: '1rem', display: 'block' }}>Acondicionamiento Secundario</label>
                                    <CheckboxGroup name="secondaryPackaging" options={SECONDARY_PACK_OPTIONS} />
                                </div>

                                <div className={styles.grid2}>
                                    <div className={styles.field}>
                                        <label>Unidades / Caja (Encajado)</label>
                                        <input type="number" {...register('unitsPerBox')} className={styles.input} placeholder="Ej. 12" />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Tipo de Palet</label>
                                        <select {...register('palletType')} className={styles.input}>
                                            <option value="europalet">Europalet (80x120)</option>
                                            <option value="americano">Americano (100x120)</option>
                                            <option value="chep">CHEP</option>
                                            <option value="other">Otro</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div className={styles.stepContent}>
                                <h2 className={styles.stepTitle}>Resumen del Briefing</h2>
                                <p className={styles.stepSubtitle}>Revisa y guarda. Puedes volver a editar más tarde.</p>

                                <div className={styles.reviewCard}>
                                    <h3>{formData.productName}</h3>
                                    <p><strong>Cliente:</strong> {formData.clientName}</p>

                                    <div className={styles.separator} />

                                    <div className={styles.reviewGrid}>
                                        <div><strong>Target:</strong> {formatCurrency(parseFloat(formData.targetPrice || '0'), 2)} €</div>
                                        <div><strong>Unidades:</strong> {formData.unitsPerYear}</div>
                                        <div><strong>Granel Objetivo:</strong> {formatCurrency(parseFloat(formData.targetBulkCost || '0'), 2)} €/kg</div>
                                        <div><strong>Pack Objetivo:</strong> {formatCurrency(parseFloat(formData.targetPricePrimary || '0'), 2)} €/ud</div>
                                    </div>

                                    <div className={styles.separator} />

                                    <p><strong>Fórmula:</strong> {formData.texture}, {formData.fragrance}</p>
                                    <p><strong>Ingredientes:</strong> {formData.formula?.map((a: FormulaIngredient) => `${a.name} (${a.percentage}%)`).join(', ')}</p>
                                    <p><strong>Tests:</strong> {formData.qualityTests?.join(', ')}</p>

                                    <div className={styles.separator} />

                                    <p><strong>Packaging:</strong> {formData.packagingType} ({formData.capacity})</p>
                                    <p><strong>Secundario:</strong> {formData.secondaryPackaging?.join(', ')}</p>
                                    <p><strong>Logística:</strong> {formData.unitsPerBox} uds/caja - {formData.palletType}</p>
                                </div>
                                <div style={{ marginTop: '2rem', textAlign: 'center', color: '#64748b' }}>
                                    (Utiliza el botón "Guardar Cambios" de la cabecera para finalizar)
                                </div>
                            </div>
                        )}

                        {/* Only keeping Next/Prev helper logic if we want, but removing Save */}
                    </form>
                </div>
            </div>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
