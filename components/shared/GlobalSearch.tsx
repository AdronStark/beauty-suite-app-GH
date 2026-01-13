
'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, X, FileText, Package, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 2) {
                performSearch(query);
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const performSearch = async (q: string) => {
        setLoading(true);
        setIsOpen(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (result: any) => {
        setIsOpen(false);
        setQuery('');

        switch (result.type) {
            case 'BRIEFING':
                router.push(`/briefings`); // Ideally scroll to item or open detail
                break;
            case 'OFFER':
                router.push(`/ofertas/editor/${result.id}`);
                break;
            case 'BLOCK':
                // navigate to planner and maybe open modal??
                // For now, just go to planner
                router.push(`/planificador?date=${result.data?.date}`);
                break;
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'BRIEFING': return <FileText size={16} color="#3b82f6" />;
            case 'OFFER': return <Package size={16} color="#8b5cf6" />;
            case 'BLOCK': return <Calendar size={16} color="#10b981" />;
            default: return <Search size={16} />;
        }
    };

    return (
        <div ref={searchRef} style={{ position: 'relative', width: '300px' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f1f5f9',
                borderRadius: '8px',
                padding: '0.4rem 0.8rem',
                border: '1px solid transparent',
                transition: 'all 0.2s'
            }}>
                <Search size={18} style={{ color: '#94a3b8', marginRight: '0.5rem' }} />
                <input
                    type="text"
                    placeholder="Buscar..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length > 2 && setIsOpen(true)}
                    style={{
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        width: '100%',
                        fontSize: '0.9rem',
                        color: '#334155'
                    }}
                />
                {query && (
                    <button onClick={() => { setQuery(''); setIsOpen(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <X size={14} style={{ color: '#94a3b8' }} />
                    </button>
                )}
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '120%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0',
                    zIndex: 100,
                    maxHeight: '400px',
                    overflowY: 'auto'
                }}>
                    {loading ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>
                            <Loader2 className="spin" size={20} style={{ margin: '0 auto' }} />
                        </div>
                    ) : results.length > 0 ? (
                        <div style={{ padding: '0.5rem' }}>
                            {results.map((result, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleSelect(result)}
                                    style={{
                                        padding: '0.6rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.8rem',
                                        transition: 'background 0.1s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ background: '#f1f5f9', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {getIcon(result.type)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {result.title}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                            {result.subtitle}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 600 }}>
                                        {result.type}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                            No se encontraron resultados
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
