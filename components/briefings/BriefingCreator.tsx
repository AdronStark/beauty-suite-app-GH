'use client';

import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { ChevronRight, Sparkles, Plus } from 'lucide-react';
import styles from '@/app/(main)/briefings/page.module.css';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { useState, useEffect } from 'react';
import ClientSelect from '@/components/clients/ClientSelect';

type InitialFormData = {
    clientName: string;
    productName: string;
    category: string;
    responsableComercial: string;
    responsableTecnico: string;
    targetDate: string;
};

export default function BriefingCreator() {
    const router = useRouter();
    const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<InitialFormData>();
    const { trackActivity } = useRecentActivity();

    const [commercialUsers, setCommercialUsers] = useState<any[]>([]);
    const [technicalUsers, setTechnicalUsers] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/users')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCommercialUsers(data.filter((u: any) => u.isCommercial));
                    setTechnicalUsers(data.filter((u: any) => u.isTechnical));
                }
            })
            .catch(err => console.error("Error loading users:", err));
    }, []);

    const processSubmit = async (data: InitialFormData, mode: 'manual' | 'smart') => {
        try {
            const res = await fetch('/api/briefings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                const newItem = await res.json();

                // Track activity
                trackActivity('briefing', newItem.id, data.productName, newItem.code);

                // Redirect to Wizard with the new ID AND mode
                router.push(`/briefings/wizard?id=${newItem.id}&mode=${mode}`);
            } else {
                alert("Error al crear el briefing.");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        }
    };

    return (
        <div className={styles.container} style={{ maxWidth: '800px', marginTop: '4rem', paddingBottom: '4rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>Nuevo Proyecto</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Comencemos definiendo los datos básicos del nuevo desarrollo.</p>
            </div>

            <form className={styles.formCard}>
                <div className={styles.stepContent}>
                    <div className={styles.grid2}>
                        <div className={styles.field}>
                            <label>Cliente *</label>
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
                            {errors.clientName && <span className={styles.error}>Requerido</span>}
                        </div>
                        <div className={styles.field}>
                            <label>Nombre del Proyecto / Producto *</label>
                            <input {...register('productName', { required: true })} className={styles.input} placeholder="Ej. Crema Anti-edad Noche" />
                            {errors.productName && <span className={styles.error}>Requerido</span>}
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label>Categoría</label>
                        <select {...register('category')} className={styles.input}>
                            <option value="Facial">Facial</option>
                            <option value="Corporal">Corporal</option>
                            <option value="Capilar">Capilar</option>
                            <option value="Solar">Solar</option>
                            <option value="Higiene">Higiene</option>
                            <option value="Perfumería">Perfumería</option>
                            <option value="General">General / Otro</option>
                        </select>
                    </div>

                    <div className={styles.separator} />

                    <div className={styles.grid2}>
                        <div className={styles.field}>
                            <label>Responsable Comercial</label>
                            <select {...register('responsableComercial')} className={styles.input}>
                                <option value="">Seleccionar...</option>
                                {commercialUsers.map(user => (
                                    <option key={user.id} value={`${user.firstName || user.username} ${user.lastName1 || ''}`.trim()}>
                                        {user.firstName || user.username} {user.lastName1 || ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>Responsable Técnico</label>
                            <select {...register('responsableTecnico')} className={styles.input}>
                                <option value="">Seleccionar...</option>
                                {technicalUsers.map(user => (
                                    <option key={user.id} value={`${user.firstName || user.username} ${user.lastName1 || ''}`.trim()}>
                                        {user.firstName || user.username} {user.lastName1 || ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label>Fecha Estimada de Entrega</label>
                        <input type="date" {...register('targetDate')} className={styles.input} />
                    </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#475569', marginBottom: '1rem', textAlign: 'center' }}>¿Cómo quieres continuar?</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                        {/* Manual Option */}
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleSubmit((data) => processSubmit(data, 'manual'))}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem',
                                border: '2px solid #e2e8f0', borderRadius: '0.75rem', background: 'white', cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.background = '#f8fafc'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; }}
                        >
                            <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '50%', marginBottom: '1rem', color: '#64748b' }}>
                                <Plus size={24} />
                            </div>
                            <span style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>Rellenar Manualmente</span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Paso a paso tradicional</span>
                        </button>

                        {/* Smart Option */}
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleSubmit((data) => processSubmit(data, 'smart'))}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem',
                                border: '2px solid #bfdbfe', borderRadius: '0.75rem', background: '#eff6ff', cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.transform = 'none'; }}
                        >
                            <div style={{ background: 'white', padding: '1rem', borderRadius: '50%', marginBottom: '1rem', color: '#2563eb', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1)' }}>
                                <Sparkles size={24} />
                            </div>
                            <span style={{ fontWeight: 600, color: '#1e3a8a', marginBottom: '0.25rem' }}>Smart Briefing AI</span>
                            <span style={{ fontSize: '0.8rem', color: '#3b82f6' }}>Relleno automático con IA</span>
                        </button>

                    </div>
                </div>
            </form>
        </div>
    );
}
