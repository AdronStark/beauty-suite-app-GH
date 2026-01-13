'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft, Save, Rocket } from 'lucide-react';
import ClientSelect from '@/components/clients/ClientSelect';

function NewOfferContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const briefingId = searchParams.get('briefingId');

    const { register, handleSubmit, setValue, control, formState: { errors } } = useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingBriefing, setIsLoadingBriefing] = useState(false);
    const [briefingData, setBriefingData] = useState<any>(null);
    const [commercialUsers, setCommercialUsers] = useState<any[]>([]);
    const [technicalUsers, setTechnicalUsers] = useState<any[]>([]);

    useEffect(() => {
        // Fetch Users
        fetch('/api/users')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Filter by explicit flags, fallback to previous role logic for backward compatibility if needed, 
                    // but user requested specific flags.
                    setCommercialUsers(data.filter((u: any) => u.isCommercial));
                    setTechnicalUsers(data.filter((u: any) => u.isTechnical));
                }
            })
            .catch(err => console.error("Error loading users:", err));
    }, []);

    useEffect(() => {
        if (briefingId) {
            setIsLoadingBriefing(true);
            fetch(`/api/briefings/${briefingId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && !data.error) {
                        setBriefingData(data); // Store full object
                        setValue('client', data.clientName);
                        setValue('product', data.productName);

                        // Try to parse launch date if available
                        if (data.formData) {
                            try {
                                const parsed = JSON.parse(data.formData);
                                if (parsed.launchDate) {
                                    setValue('fechaEntrega', parsed.launchDate);
                                }
                            } catch (e) { }
                        }
                    }
                })
                .catch(err => console.error("Error loading briefing:", err))
                .finally(() => setIsLoadingBriefing(false));
        }
    }, [briefingId, setValue]);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            const payload: any = {
                ...data,
                status: 'Borrador'
            };

            if (briefingId) {
                payload.briefingId = briefingId;

                // Smart Mapping of Breifing Data to Offer Input Data
                if (briefingData && briefingData.formData) {
                    try {
                        const bForm = JSON.parse(briefingData.formData);

                        // Construct inputData
                        const inputData: any = {
                            units: bForm.unitsPerYear || 0,
                            containerType: bForm.packagingType,
                            capacity: bForm.capacity,
                            formula: [],
                            packaging: []
                        };

                        // Map Formula/Actives to Offer Formula
                        const formulaData = bForm.formula || bForm.actives;
                        if (Array.isArray(formulaData)) {
                            inputData.formula = formulaData.map((a: any) => ({
                                name: a.name,
                                percentage: a.percentage,
                                costPerKg: a.cost ? parseFloat(a.cost) : 0
                            }));
                        }

                        // Map Packaging (Basic)
                        if (bForm.packagingType) {
                            // Add a placeholder component for the primary container
                            inputData.packaging.push({
                                name: bForm.packagingType,
                                costPerUnit: bForm.targetPricePrimary || 0,
                                wastePercent: 0,
                                clientSupplied: false
                            });
                        }

                        payload.inputData = JSON.stringify(inputData);

                    } catch (e) {
                        console.warn("Failed to map briefing data", e);
                    }
                }
            }

            const res = await fetch('/api/ofertas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const newOffer = await res.json();
                router.push(`/ofertas/editor/${newOffer.id}`);
            } else {
                alert("Error creando oferta: " + await res.text());
            }
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <ArrowLeft size={20} /> Volver
            </button>

            <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ background: 'var(--color-primary-light)', padding: '0.8rem', borderRadius: 'var(--radius-md)', color: 'var(--color-primary)' }}>
                        <Rocket size={32} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Nueva Oferta</h1>
                        <p style={{ color: 'var(--color-text-secondary)', margin: '0.2rem 0 0 0' }}>Define los datos básicos para iniciar el expediente.</p>
                        {briefingId && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#059669', background: '#ecfdf5', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block' }}>
                                ✨ Vinculada al Briefing
                            </div>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                    <div style={{ gridColumn: 'span 2' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-tertiary)', marginBottom: '1rem' }}>Datos del Proyecto</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>Cliente *</label>
                        <Controller
                            control={control}
                            name="client"
                            rules={{ required: true }}
                            render={({ field }) => (
                                <ClientSelect
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Seleccionar Cliente"
                                />
                            )}
                        />
                        {errors.client && <span style={{ color: 'var(--color-error)', fontSize: '0.8rem' }}>Requerido</span>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>Nombre del Producto *</label>
                        <input
                            {...register('product', { required: true })}
                            placeholder="Ej. Crema Solar 50SPF"
                            style={{ padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '1rem' }}
                        />
                        {errors.product && <span style={{ color: 'var(--color-error)', fontSize: '0.8rem' }}>Requerido</span>}
                    </div>

                    <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-tertiary)', marginBottom: '1rem' }}>Gestión de la Oferta</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>Responsable Comercial</label>
                        <select
                            {...register('responsableComercial')}
                            style={{ padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '1rem', background: 'white' }}
                        >
                            <option value="">Seleccionar...</option>
                            {commercialUsers.map(user => (
                                <option key={user.id} value={`${user.firstName} ${user.lastName1}`}>
                                    {user.firstName} {user.lastName1}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>Responsable Técnico</label>
                        <select
                            {...register('responsableTecnico')}
                            style={{ padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '1rem', background: 'white' }}
                        >
                            <option value="">Seleccionar...</option>
                            {technicalUsers.map(user => (
                                <option key={user.id} value={`${user.firstName} ${user.lastName1}`}>
                                    {user.firstName} {user.lastName1}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>Fecha Entrega Estimada</label>
                        <input
                            type="date"
                            {...register('fechaEntrega')}
                            style={{ padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '1rem' }}
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2', marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            type="submit"
                            disabled={isSubmitting || isLoadingBriefing}
                            style={{
                                background: 'var(--color-primary)',
                                color: 'white',
                                padding: '0.75rem 1.5rem',
                                borderRadius: 'var(--radius-full)',
                                border: 'none',
                                fontWeight: 600,
                                cursor: (isSubmitting || isLoadingBriefing) ? 'wait' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: 'var(--shadow-sm)',
                                opacity: (isSubmitting || isLoadingBriefing) ? 0.7 : 1
                            }}
                        >
                            <Save size={20} />
                            {isSubmitting ? 'Creando...' : 'Crear e Iniciar Oferta'}
                        </button>
                    </div>

                </form>
            </div>

            <p style={{ textAlign: 'center', marginTop: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                Al crear la oferta se generará automáticamente un número de expediente único.
            </p>
        </div>
    );
}

export default function NewOfferPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <NewOfferContent />
        </Suspense>
    );
}
