'use client';

import { ActivityItem, useRecentActivity } from '@/hooks/useRecentActivity';
import Link from 'next/link';
import { Tag, FileText, Clock, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

// Relative time formatter
function timeAgo(timestamp: number) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const intervals = {
        año: 31536000,
        mes: 2592000,
        sem: 604800,
        día: 86400,
        h: 3600,
        min: 60
    };

    for (const [key, value] of Object.entries(intervals)) {
        const count = Math.floor(seconds / value);
        if (count >= 1) {
            return `Hace ${count} ${key}${count > 1 && key !== 'mes' ? 's' : ''}`; // Simple pluralization
        }
    }
    return 'Hace un momento';
}

export default function RecentActivity() {
    const { activities } = useRecentActivity();
    // Use client-side only rendering to avoid hydration mismatch with localStorage
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null; // Avoid hydration mismatch

    if (activities.length === 0) return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.5,
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <Clock size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Tu actividad reciente aparecerá aquí</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', overflowY: 'auto' }}>
            <h3 style={{
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-text-muted)',
                marginBottom: '0.5rem',
                paddingLeft: '0.25rem'
            }}>
                Actividad Reciente
            </h3>

            {activities.slice(0, 7).map((item) => (
                <Link key={item.id} href={item.path} style={{ textDecoration: 'none' }}>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
                        }}
                    >
                        {/* Status Stripe */}
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '4px',
                            background: item.type === 'offer' ? '#14b8a6' : '#6366f1' // Teal for Offer, Indigo for Briefing
                        }} />

                        <div style={{
                            background: item.type === 'offer' ? '#f0fdfa' : '#eef2ff',
                            color: item.type === 'offer' ? '#0d9488' : '#4f46e5',
                            padding: '0.6rem',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {item.type === 'offer' ? <Tag size={20} /> : <FileText size={20} />}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                color: 'var(--color-text)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {item.title}
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                marginTop: '2px'
                            }}>
                                {item.code && <span style={{ background: '#f1f5f9', padding: '0 4px', borderRadius: '4px', fontWeight: 500 }}>#{item.code}</span>}
                                {item.type === 'offer' ? 'Oferta' : 'Briefing'} • {timeAgo(item.timestamp)}
                            </div>
                        </div>

                        <ChevronRight size={16} style={{ color: '#cbd5e1' }} />
                    </div>
                </Link>
            ))}
        </div>
    );
}
