'use client';

import { useEffect, useState, useRef } from 'react';
import { createTimeline } from 'animejs';
import { useSession } from 'next-auth/react';

export default function IntroAnimation() {
    const { data: session } = useSession();
    const [visible, setVisible] = useState(true);

    // Refs for animation targets
    const containerRef = useRef<HTMLDivElement>(null);
    const logoRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Quick check for session storage to avoid flash if possible (though visible=true handles the initial block)
        const hasShown = sessionStorage.getItem('intro_shown');
        if (hasShown) {
            setVisible(false);
            return;
        }

        if (!session?.user) return;

        // Ensure elements are ready
        if (!containerRef.current || !logoRef.current || !textRef.current) return;

        // Init Sequence
        const tl = createTimeline({
            defaults: { ease: 'outExpo' },
            onComplete: () => {
                setVisible(false);
                sessionStorage.setItem('intro_shown', 'true');
                window.dispatchEvent(new Event('intro-complete'));
            }
        });

        tl
            .add(logoRef.current!, {
                scale: [0.5, 1],
                opacity: [0, 1],
                duration: 1000,
                delay: 100
            })
            .add(textRef.current!, {
                translateY: [20, 0],
                opacity: [0, 1],
                duration: 800,
            }, '-=600') // Overlap
            .add(containerRef.current!, {
                opacity: [1, 0],
                duration: 800,
                delay: 1500, // Wait time before exit
                ease: 'inOutQuad'
            });

    }, [session]);

    if (!visible) return null;

    // Get user name for greeting
    // @ts-ignore
    const firstName = session?.user?.firstName || session?.user?.name?.split(' ')[0] || 'Usuario';

    return (
        <div
            ref={containerRef}
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
                opacity: 1,
                overflow: 'hidden'
            }}
        >
            {/* Logo Container */}
            <div
                ref={logoRef}
                style={{
                    width: '180px',
                    height: '180px',
                    marginBottom: '24px',
                    opacity: 0, // Handled by anime
                    transform: 'scale(0.5)' // Handled by anime
                }}
            >
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
            <div
                ref={textRef}
                style={{
                    textAlign: 'center',
                    opacity: 0, // Handled by anime
                    transform: 'translateY(20px)' // Handled by anime
                }}
            >
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
