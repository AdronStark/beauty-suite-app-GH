'use client';

import { useState } from 'react';
import { LayoutGrid, Database } from 'lucide-react';
import ClientsTable from './ClientsTable';
import DatabaseClientsView from './DatabaseClientsView';

interface ClientTabsProps {
    commercialClients: any[];
}

export default function ClientTabs({ commercialClients }: ClientTabsProps) {
    const [activeTab, setActiveTab] = useState<'commercial' | 'database'>('commercial');

    return (
        <div>
            {/* Tabs Navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                <button
                    onClick={() => setActiveTab('commercial')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'commercial' ? '2px solid #3E6AD8' : '2px solid transparent',
                        color: activeTab === 'commercial' ? '#3E6AD8' : '#64748b',
                        fontWeight: activeTab === 'commercial' ? 700 : 500,
                        cursor: 'pointer',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                >
                    <LayoutGrid size={20} />
                    Resumen Comercial
                </button>
                <button
                    onClick={() => setActiveTab('database')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'database' ? '2px solid #3E6AD8' : '2px solid transparent',
                        color: activeTab === 'database' ? '#3E6AD8' : '#64748b',
                        fontWeight: activeTab === 'database' ? 700 : 500,
                        cursor: 'pointer',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                >
                    <Database size={20} />
                    Base de Datos
                </button>
            </div>

            {/* Tab Content */}
            <div style={{ animation: 'fadeIn 0.3s' }}>
                {activeTab === 'commercial' && (
                    <div>
                        <div style={{ marginBottom: '2rem' }}>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                                Directorio Comercial
                            </h1>
                            <p style={{ color: '#64748b' }}>
                                {commercialClients.length} clientes activos con historial de ofertas y actividad.
                            </p>
                        </div>
                        <ClientsTable clients={commercialClients} />
                    </div>
                )}

                {activeTab === 'database' && (
                    <DatabaseClientsView />
                )}
            </div>

            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
