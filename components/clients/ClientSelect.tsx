'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Store } from 'lucide-react';

interface Client {
    id: string;
    name: string;
    erpId: string | null;
    source: string;
}

interface ClientSelectProps {
    value: string; // The client name (as string, for compatibility with legacy string field)
    onChange: (name: string) => void;
    placeholder?: string;
    disabled?: boolean;
    allowCustom?: boolean;
}

export default function ClientSelect({ value, onChange, placeholder = 'Seleccionar Cliente', disabled = false, allowCustom = false }: ClientSelectProps) {
    const [clients, setClients] = useState<Client[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Initial value syncing
    useEffect(() => {
        if (value && !searchTerm) {
            // Don't overwrite search term if user is typing, but maybe sync initial
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Load clients on open or search
    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const url = searchTerm ? `/api/clients?search=${encodeURIComponent(searchTerm)}` : '/api/clients';
                const res = await fetch(url);
                const data = await res.json();
                if (Array.isArray(data)) setClients(data);
            } catch (e) {
                console.error("Failed to load clients", e);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [isOpen, searchTerm]);

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%', opacity: disabled ? 0.6 : 1 }}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{
                    border: 'none',
                    borderBottom: '1px solid #e2e8f0',
                    padding: '0.25rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: 'transparent'
                }}
            >
                <span style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: value ? '#1e293b' : '#94a3b8',
                    flex: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {value || placeholder}
                </span>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '300px', // Wider than input often
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                    zIndex: 50,
                    marginTop: '4px',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Search size={14} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder={allowCustom ? "Buscar o escribir nuevo..." : "Buscar..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontSize: '0.85rem', width: '100%' }}
                            autoFocus
                        />
                    </div>

                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {/* Custom Option */}
                        {allowCustom && searchTerm && (
                            <div
                                onClick={() => {
                                    onChange(searchTerm);
                                    setIsOpen(false);
                                }}
                                style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    color: '#0f172a',
                                    borderBottom: '1px dashed #e2e8f0',
                                    background: '#f8fafc',
                                    fontWeight: 500
                                }}
                            >
                                <span style={{ marginRight: '6px' }}>✏️</span> Usar "{searchTerm}"
                            </div>
                        )}

                        {loading && <div style={{ padding: '8px', color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center' }}>Cargando...</div>}

                        {!loading && clients.length === 0 && (
                            <div style={{ padding: '8px', color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center' }}>
                                No encontrados. <br />
                                <button
                                    style={{ marginTop: '4px', color: '#3E6AD8', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}
                                    onClick={() => {
                                        // Allow setting custom value if not found?
                                        onChange(searchTerm);
                                        setIsOpen(false);
                                    }}
                                >
                                    Usar "{searchTerm}"
                                </button>
                            </div>
                        )}

                        {!loading && clients.map(client => (
                            <div
                                key={client.id}
                                onClick={() => {
                                    onChange(client.name);
                                    setIsOpen(false);
                                }}
                                style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    color: '#1e293b',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            >
                                <span>{client.name}</span>
                                {client.source === 'ERP' && <span style={{ fontSize: '0.7em', background: '#e0e7ff', color: '#4338ca', padding: '1px 4px', borderRadius: '4px' }}>ERP</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
