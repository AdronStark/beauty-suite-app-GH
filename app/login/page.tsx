'use client';

import { useState } from 'react';
import { authenticate } from '@/app/lib/actions';
import { useRouter } from 'next/navigation';
import { User, Sparkles, ArrowLeft, Factory, Briefcase } from 'lucide-react';

type LoginMode = 'SELECTION' | 'WORKER' | 'CLIENT';

export default function LoginPage() {
    const [mode, setMode] = useState<LoginMode>('SELECTION');
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsPending(true);
        setErrorMessage(undefined);

        const formData = new FormData(event.currentTarget);

        try {
            const errorMsg = await authenticate(undefined, formData);
            if (errorMsg) {
                setErrorMessage(errorMsg);
                setIsPending(false);
                return;
            }
        } catch (error) {
            if ((error as Error).message === 'NEXT_REDIRECT') {
                window.location.href = '/';
                return;
            }
            setErrorMessage('Error de conexión.');
            setIsPending(false);
        }
    };

    // --- STYLES ---
    const isClient = mode === 'CLIENT';

    // Background
    const bgStyle: React.CSSProperties = isClient
        ? { background: 'var(--color-bg)', color: 'var(--color-text)' }
        : { background: 'var(--color-bg)', color: 'var(--color-text)' };

    // Card
    const cardStyle: React.CSSProperties = isClient
        ? {
            background: 'white',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-xl)',
            color: 'var(--color-text)'
        }
        : {
            background: 'white',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)'
        };

    // Primary Color (Button / Accents)
    const accentColor = 'var(--color-primary)';
    const textColor = 'var(--color-text-muted)';

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: isClient ? '"Outfit", sans-serif' : 'var(--font-primary)',
            transition: 'background 0.5s ease',
            ...bgStyle
        }}>
            <div style={{
                padding: '3rem',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '420px',
                position: 'relative',
                transition: 'all 0.5s ease',
                ...cardStyle
            }}>
                {/* Back Button */}
                {mode !== 'SELECTION' && (
                    <button
                        onClick={() => { setMode('SELECTION'); setErrorMessage(undefined); }}
                        style={{
                            position: 'absolute', top: '20px', left: '20px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            display: 'flex', alignItems: 'center', gap: '5px'
                        }}
                    >
                        <ArrowLeft size={18} /> <span style={{ fontSize: '0.8rem' }}>Volver</span>
                    </button>
                )}

                {/* --- MODE: SELECTION --- */}
                {mode === 'SELECTION' && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', margin: '0 auto 1.5rem', background: '#f1f5f9', borderRadius: '16px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src="/icon.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#1e293b' }}>Bienvenido</h1>
                        <p style={{ color: '#64748b', marginBottom: '2rem' }}>Selecciona tu tipo de acceso</p>

                        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                            <button
                                onClick={() => setMode('CLIENT')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                                    background: 'var(--color-secondary)',
                                    border: '1px solid var(--color-secondary)', borderRadius: '16px', cursor: 'pointer',
                                    color: 'var(--color-text-heading)', textAlign: 'left', transition: 'transform 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ background: 'white', padding: '10px', borderRadius: '10px', color: 'var(--color-primary)' }}><Briefcase size={20} /></div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary)' }}>Soy Cliente</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 500, color: 'var(--color-text-muted)' }}>Acceso a The Beauty Concierge</div>
                                </div>
                            </button>

                            <button
                                onClick={() => setMode('WORKER')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', cursor: 'pointer',
                                    color: '#1e293b', textAlign: 'left', transition: 'transform 0.2s',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '10px' }}><Factory size={20} color="#475569" /></div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>Equipo Interno</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Acceso a Gestión y Fábrica</div>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* --- MODE: LOGIN FORM --- */}
                {mode !== 'SELECTION' && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '2rem', paddingTop: '1rem' }}>
                            {isClient ? (
                                <>
                                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>The Beauty Concierge</h1>
                                    <p style={{ color: textColor, fontSize: '0.9rem' }}>Tu portal exclusivo</p>
                                </>
                            ) : (
                                <>
                                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Gestión Interna</h1>
                                    <p style={{ color: textColor, fontSize: '0.95rem' }}>Identifícate con tu usuario corporativo</p>
                                </>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuario</label>
                                <input
                                    type="text"
                                    name="username"
                                    required
                                    style={{
                                        width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
                                        border: '1px solid var(--color-border)',
                                        background: 'white',
                                        color: 'var(--color-text)',
                                        fontSize: '1rem', outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contraseña</label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    style={{
                                        width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
                                        border: '1px solid var(--color-border)',
                                        background: 'white',
                                        color: 'var(--color-text)',
                                        fontSize: '1rem', outline: 'none'
                                    }}
                                />
                            </div>

                            {errorMessage && (
                                <div style={{
                                    color: 'var(--color-error)',
                                    background: 'var(--color-error-bg)',
                                    padding: '0.5rem', borderRadius: '8px',
                                    textAlign: 'center', fontSize: '0.9rem',
                                    border: '1px solid #fee2e2'
                                }}>
                                    {errorMessage}
                                </div>
                            )}

                            <button
                                disabled={isPending}
                                style={{
                                    marginTop: '1rem', width: '100%', padding: '0.85rem',
                                    borderRadius: '12px', border: 'none',
                                    background: accentColor,
                                    color: 'white',
                                    fontSize: '1rem', fontWeight: 700,
                                    cursor: isPending ? 'wait' : 'pointer', opacity: isPending ? 0.7 : 1,
                                    boxShadow: 'var(--shadow-md)'
                                }}
                            >
                                {isPending ? 'Accediendo...' : (isClient ? 'Entrar al Portal' : 'Entrar')}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
