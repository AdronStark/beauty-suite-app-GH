'use client';

import { ArrowRight, ArrowLeft, Send } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const INNOVATIONS = [
    {
        id: 1,
        title: 'Sérum Bifásico Hydra-Glow',
        category: 'Skin Care',
        description: 'Nueva fórmula con tecnología de micro-burbujas para una hidratación profunda y luminosidad instantánea.',
        image: '/images/innovations/serum.png',
        color: 'from-pink-500 to-rose-500'
    },
    {
        id: 2,
        title: 'Stick Solar Invisible SPF 50',
        category: 'Sun Care',
        description: 'Protección alta en formato on-the-go. Acabado totalmente transparente y textura no grasa.',
        image: '/images/innovations/sun_stick.png',
        color: 'from-orange-400 to-amber-500'
    },
    {
        id: 3,
        title: 'Eco-Refill System',
        category: 'Packaging',
        description: 'Sistema de recarga inteligente compatible con toda nuestra línea premium. Reduce el plástico un 85%.',
        image: '/images/innovations/eco_refill.png',
        color: 'from-emerald-400 to-green-600'
    },
    {
        id: 4,
        title: 'Night Repair Ampoules',
        category: 'Skin Care',
        description: 'Tratamiento intensivo nocturno con retinol encapsulado.',
        image: '/images/innovations/night_repair_ampoules_1768210447257.png',
        color: 'from-violet-500 to-purple-600'
    },
    {
        id: 5,
        title: 'Bio-Cellulose Mask',
        category: 'Treatment',
        description: 'Mascarilla de bio-celulosa fermentada que se adhiere como una segunda piel.',
        image: '/images/innovations/bio_cellulose_mask_1768210463330.png',
        color: 'from-teal-400 to-cyan-500'
    }
];

export default function InnovationShowcase() {
    const [requested, setRequested] = useState<number[]>([]);

    // --- INFINITE CAROUSEL LOGIC ---
    const items = INNOVATIONS;
    const CLONE_COUNT = 3;
    const extendedItems = [
        ...items.slice(-CLONE_COUNT),
        ...items,
        ...items.slice(0, CLONE_COUNT)
    ];

    const [currentIndex, setCurrentIndex] = useState(CLONE_COUNT);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    // Layout Constants
    // 3 items visible + 2 gaps = 3*26 + 2*2 = 82%
    // Margins = (100 - 82) / 2 = 9% on each side.
    const GAP_PERCENT = 2;
    const ITEM_WIDTH_PERCENT = 26;
    const CENTER_OFFSET = 9;

    // Auto-play
    useEffect(() => {
        if (isHovering) return;
        const timer = setInterval(() => {
            handleNext();
        }, 5000);
        return () => clearInterval(timer);
    }, [isHovering]);

    const handleNext = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex(prev => prev - 1);
    };

    const handleTransitionEnd = () => {
        setIsTransitioning(false);
        if (currentIndex >= items.length + CLONE_COUNT) {
            const offset = currentIndex - (items.length + CLONE_COUNT);
            setCurrentIndex(CLONE_COUNT + offset);
        } else if (currentIndex < CLONE_COUNT) {
            const offset = CLONE_COUNT - currentIndex;
            setCurrentIndex(items.length + CLONE_COUNT - offset);
        }
    };

    const handleRequest = (id: number) => {
        setRequested(prev => [...prev, id]);
        console.log(`Info requested for innovation ID: ${id}`);
    };

    const singleStep = ITEM_WIDTH_PERCENT + GAP_PERCENT;
    const translateValue = -(currentIndex * singleStep) + CENTER_OFFSET;

    return (
        <div style={{ marginBottom: '3rem', position: 'relative' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em' }}>
                    Novedades Lavery
                </h2>
            </div>

            {/* Carousel Container */}
            <div
                style={{ position: 'relative', margin: '0 -2rem', padding: '1rem 0', height: '420px' }}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >

                {/* BLUR OVERLAYS (PEEKING ZONES) */}
                {/* 
                   We want the blur to cover the exact "peeking" area (9%).
                   This overlays the content that is physically there.
                */}
                <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: `${CENTER_OFFSET}%`,
                    backdropFilter: 'blur(3px)',
                    WebkitBackdropFilter: 'blur(3px)',
                    zIndex: 20, pointerEvents: 'none',
                    // Optional: Fade the blur itself near the inner edge to avoid hard line
                    maskImage: 'linear-gradient(to right, black 60%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, black 60%, transparent 100%)'
                }} />
                <div style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0, width: `${CENTER_OFFSET}%`,
                    backdropFilter: 'blur(3px)',
                    WebkitBackdropFilter: 'blur(3px)',
                    zIndex: 20, pointerEvents: 'none',
                    maskImage: 'linear-gradient(to left, black 60%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to left, black 60%, transparent 100%)'
                }} />

                {/* HOVER NAVIGATION ARROWS */}
                <div style={{
                    position: 'absolute', left: '2rem', top: '50%', transform: 'translateY(-50%)',
                    zIndex: 30, opacity: isHovering ? 1 : 0, transition: 'opacity 0.3s ease', pointerEvents: isHovering ? 'auto' : 'none'
                }}>
                    <button
                        onClick={handlePrev}
                        style={{
                            width: '48px', height: '48px', borderRadius: '50%',
                            background: 'white', border: '1px solid #e2e8f0',
                            color: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                </div>

                <div style={{
                    position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)',
                    zIndex: 30, opacity: isHovering ? 1 : 0, transition: 'opacity 0.3s ease', pointerEvents: isHovering ? 'auto' : 'none'
                }}>
                    <button
                        onClick={handleNext}
                        style={{
                            width: '48px', height: '48px', borderRadius: '50%',
                            background: 'white', border: '1px solid #e2e8f0',
                            color: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <ArrowRight size={24} />
                    </button>
                </div>


                {/* SLIDING TRACK WITH *MINIMAL* FADE MASK */}
                {/* 
                   We mask only 0% to 4% (less than half of the peeking zone) 
                   to hide the hard edge but keep the card visible under the blur. 
                */}
                {/* TRACK WRAPPER -> STATIC MASK WINDOW */}
                <div style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    // MASK: The window is static, so the mask stays put while items move.
                    maskImage: `linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)`,
                    WebkitMaskImage: `linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)`
                }}>
                    <div
                        onTransitionEnd={handleTransitionEnd}
                        style={{
                            display: 'flex',
                            gap: `${GAP_PERCENT}%`,
                            transform: `translateX(${translateValue}%)`,
                            transition: isTransitioning ? 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        {extendedItems.map((item, index) => {
                            const isRequested = requested.includes(item.id);
                            const uniqueKey = `${item.id}-${index}`;

                            return (
                                <div key={uniqueKey} style={{
                                    flex: `0 0 ${ITEM_WIDTH_PERCENT}%`,
                                    height: '100%'
                                }}>
                                    <div style={{
                                        background: 'white',
                                        borderRadius: '16px',
                                        border: '1px solid #e2e8f0',
                                        overflow: 'hidden',
                                        display: 'flex', flexDirection: 'column',
                                        height: '100%',
                                        transition: 'transform 0.3s',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        {/* Image Area */}
                                        <div style={{
                                            height: '50%',
                                            position: 'relative',
                                            background: '#f8fafc'
                                        }}>
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const colors = item.color.split(' ');
                                                    e.currentTarget.parentElement!.classList.add('bg-gradient-to-br', ...colors);
                                                }}
                                            />
                                            <div style={{
                                                position: 'absolute', top: '12px', left: '12px'
                                            }}>
                                                <span style={{
                                                    fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                                                    background: 'rgba(255,255,255,0.95)', color: '#0f172a',
                                                    padding: '4px 8px', borderRadius: '6px',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                }}>
                                                    {item.category}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content Area */}
                                        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1, paddingBottom: '1.5rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                                                {item.title}
                                            </h3>
                                            <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.25rem', flexGrow: 1 }}>
                                                {item.description}
                                            </p>

                                            <button
                                                onClick={() => !isRequested && handleRequest(item.id)}
                                                disabled={isRequested}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.65rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid',
                                                    borderColor: isRequested ? '#bbf7d0' : '#e2e8f0',
                                                    background: isRequested ? '#f0fdf4' : 'transparent',
                                                    color: isRequested ? '#166534' : '#334155',
                                                    fontWeight: 600,
                                                    fontSize: '0.8rem',
                                                    cursor: isRequested ? 'default' : 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => {
                                                    if (!isRequested) {
                                                        e.currentTarget.style.background = '#f8fafc';
                                                        e.currentTarget.style.borderColor = '#cbd5e1';
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    if (!isRequested) {
                                                        e.currentTarget.style.background = 'transparent';
                                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                                    }
                                                }}
                                            >
                                                {isRequested ? (
                                                    <>Enviado <Send size={12} /></>
                                                ) : (
                                                    <>Me interesa <ArrowRight size={12} /></>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
