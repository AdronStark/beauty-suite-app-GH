'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function IntroAnimation() {
    const { data: session } = useSession();
    const [show, setShow] = useState(false);
    const [step, setStep] = useState(0); // 0: Init, 1: LogoIn, 2: TextIn, 3: FadeOut

    useEffect(() => {
        // Only run if user is logged in
        if (!session?.user) return;

        // Check if intro has been shown this session
        const hasShown = sessionStorage.getItem('intro_shown');
        if (hasShown) return;

        // Start Animation Sequence
        setShow(true);

        // Step 1: Logo Zoom In (Immediate)
        setTimeout(() => setStep(1), 100);

        // Step 2: Text Fade In
        setTimeout(() => setStep(2), 800);

        // Step 3: Fade Out All
        setTimeout(() => setStep(3), 2500);

        // Step 4: Remove from DOM and Mark as Shown
        setTimeout(() => {
            setShow(false);
            sessionStorage.setItem('intro_shown', 'true');
        }, 3200); // 2500 + 700ms transition

    }, [session]);

    if (!show) return null;

    // Get user name for greeting
    // @ts-ignore
    const firstName = session?.user?.firstName || session?.user?.name?.split(' ')[0] || 'Usuario';

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.7s ease-in-out',
                opacity: step === 3 ? 0 : 1,
                pointerEvents: step === 3 ? 'none' : 'auto'
            }}
        >
            {/* Logo Container */}
            <div style={{
                width: '180px',
                height: '180px',
                marginBottom: '24px',
                transition: 'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: step >= 1 ? 'scale(1)' : 'scale(0.5)',
                opacity: step >= 1 ? 1 : 0
            }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/labery-full-logo.png"
                    alt="Labery Beauty App Suite"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                    }}
                />
            </div>

            {/* Greeting */}
            <div style={{
                textAlign: 'center',
                transition: 'all 0.8s ease-out',
                transform: step >= 2 ? 'translateY(0)' : 'translateY(20px)',
                opacity: step >= 2 ? 1 : 0
            }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 300,
                    color: '#334155',
                    fontFamily: 'var(--font-heading, sans-serif)',
                    margin: 0
                }}>
                    Hola, <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{firstName}</span>
                </h1>
                <p style={{
                    marginTop: '8px',
                    color: '#64748b',
                    fontSize: '1rem',
                    fontWeight: 400
                }}>
                    Bienvenido a Labery Beauty App Suite
                </p>
            </div>
        </div>
    );
}
