'use client';

import { useState } from 'react';
import { Package, Settings, List } from 'lucide-react';
import RawMaterialsTable from './RawMaterialsTable';
import ConfigTabs from './ConfigTabs';
import styles from '@/app/(main)/materias-primas/page.module.css';

interface RawMaterialsLayoutProps {
    initialOrders: any[];
}

export default function RawMaterialsLayout({ initialOrders }: RawMaterialsLayoutProps) {
    const [activeTab, setActiveTab] = useState<'list' | 'config'>('list');

    return (
        <div className={styles.container}>
            {/* Header Toolbar */}
            <div style={{
                background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0.5rem 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)', zIndex: 10, gap: '1rem',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                        Gestión Materias Primas
                    </h1>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '2px', background: '#f1f5f9', borderRadius: '6px', padding: '2px' }}>
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`${styles.tabButton} ${activeTab === 'list' ? styles.tabButtonActive : styles.tabButtonInactive}`}
                        >
                            <Package size={16} /> Listado
                        </button>
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`${styles.tabButton} ${activeTab === 'config' ? styles.tabButtonActive : styles.tabButtonInactive}`}
                        >
                            <Settings size={16} /> Configuración
                        </button>
                    </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {/* Right side info or actions can go here */}
                    Coper
                </div>
            </div>

            {/* Content Area */}
            <div className={styles.content}>
                {activeTab === 'list' && (
                    <div className={styles.scrollableContent}>
                        <RawMaterialsTable data={initialOrders} />
                    </div>
                )}

                {activeTab === 'config' && (
                    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', height: '100%', overflowY: 'auto', paddingRight: '8px' }}>
                        <ConfigTabs />
                    </div>
                )}
            </div>
        </div>
    );
}
