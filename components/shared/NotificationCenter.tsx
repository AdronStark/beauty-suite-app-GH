
'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Notification {
    id: string;
    type: 'missing_probability' | 'other';
    title: string;
    message: string;
    link: string;
}

export default function NotificationCenter() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const count = notifications.length;


    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    const containerRef = useRef<HTMLDivElement>(null);

    // Initial fetch, polling, and fetch on open
    useEffect(() => {
        if (session?.user?.name) {
            fetchNotifications();

            // Poll every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [session?.user?.name]);

    // Fetch when opening
    useEffect(() => {
        if (isOpen && session?.user?.name) {
            fetchNotifications();
        }
    }, [isOpen, session?.user?.name]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div style={{ position: 'relative' }} ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.5rem',
                    position: 'relative',
                }}
                title="Notificaciones"
            >
                <Bell size={20} />
                {count > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        minWidth: '16px',
                        height: '16px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                        border: '2px solid var(--color-background-card, #fff)'
                    }}>
                        {count}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    width: '320px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    zIndex: 100,
                    marginTop: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '400px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--color-border)',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>Notificaciones</span>
                        <button
                            onClick={fetchNotifications}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--color-primary)' }}
                        >
                            Actualizar
                        </button>
                    </div>

                    <div style={{ overflowY: 'auto' }}>
                        {loading && notifications.length === 0 ? (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando...</div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                No tienes notificaciones pendientes.
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <Link
                                    key={notif.id}
                                    href={notif.link}
                                    onClick={() => setIsOpen(false)}
                                    style={{
                                        display: 'block',
                                        padding: '0.75rem 1rem',
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        borderBottom: '1px solid var(--color-border)',
                                        transition: 'background 0.2s'
                                    }}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem', color: '#ef4444' }}>
                                        {notif.title}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        {notif.message}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
