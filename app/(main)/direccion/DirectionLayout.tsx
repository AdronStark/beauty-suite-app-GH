'use client';

import { useState } from 'react';
import {
    BarChart3,
    TrendingUp,
    Users,
    Package,
    ArrowLeft,
    LayoutDashboard,
    Target,
    Factory,
    UserCheck,
    ArrowUpRight // Added for the new DashboardHome design
} from 'lucide-react';
import Link from 'next/link';
import { COMPANIES, Company, getCompanyById } from '@/lib/companies';
import { useCompany } from '@/context/CompanyContext';
import { useEffect } from 'react';
import CommercialKPIs from '@/components/direccion/CommercialKPIs';
import ProductionKPIs from '@/components/direccion/ProductionKPIs';
import HRKPIs from '@/components/direccion/HRKPIs';
import QualityKPIs from '@/components/direccion/QualityKPIs';
import InnovationKPIs from '@/components/direccion/InnovationKPIs';
import FinanceKPIs from '@/components/direccion/FinanceKPIs';
import StrategyKPIs from '@/components/direccion/StrategyKPIs';
import {
    ShieldCheck,
    Beaker,
    Euro,
    Compass,
    Zap,
    CheckCircle,
    Activity,
    BarChart
} from 'lucide-react';

// Summary component for the Home tab
const DashboardHome = ({ onNavigate }: { onNavigate: (tab: any) => void }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
            padding: '40px',
            borderRadius: '24px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(62, 106, 216, 0.25)'
        }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>Bienvenido al Portal de Dirección</h2>
                <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px' }}>Visión global estratégica de Labery Beauty App Suite. Monitoriza el rendimiento de todas las áreas en tiempo real.</p>
            </div>
            <BarChart3 size={300} style={{ position: 'absolute', right: '-40px', bottom: '-80px', opacity: 0.15, transform: 'rotate(-10deg)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {[
                { title: 'Finanzas', subtitle: 'Rentabilidad', value: '1.2M €', detail: 'EBITDA YTD', icon: <Euro size={24} />, tab: 'finanzas' },
                { title: 'Comercial', subtitle: 'Funnel y Ofertas', value: '74%', detail: 'Tasa adjudicación', icon: <TrendingUp size={24} />, tab: 'comercial' },
                { title: 'Producción', subtitle: 'Eficiencia Global', value: '98.2%', detail: 'vs Planificación', icon: <Factory size={24} />, tab: 'produccion' },
                { title: 'RRHH', subtitle: 'Estado Plantilla', value: '3.4%', detail: 'Absentismo medio', icon: <Users size={24} />, tab: 'rrhh' },
                { title: 'Calidad', subtitle: 'Cumplimiento', value: '96/100', detail: 'Score Auditoría', icon: <ShieldCheck size={24} />, tab: 'calidad' },
                { title: 'I+D', subtitle: 'Innovación', value: '28', detail: 'Proyectos activos', icon: <Beaker size={24} />, tab: 'id' },
                { title: 'Estrategia', subtitle: 'Plan 2026', value: '42%', detail: 'Grado de avance', icon: <Compass size={24} />, tab: 'estrategia' }
            ].map((section, i) => (
                <div
                    key={i}
                    onClick={() => onNavigate(section.tab)}
                    style={{
                        background: 'var(--color-surface)',
                        padding: '24px',
                        borderRadius: '20px',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div style={{
                            background: 'var(--color-secondary)',
                            color: 'var(--color-primary)',
                            padding: '12px',
                            borderRadius: 'var(--border-radius-drop)', // Used Brand Drop Shape
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '48px', height: '48px'
                        }}>
                            {section.icon}
                        </div>
                        <ArrowUpRight size={20} style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{section.subtitle}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-heading)', marginTop: '4px', fontFamily: 'var(--font-display)' }}>{section.title}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-divider)' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>{section.value}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{section.detail}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default function DirectionLayout() {
    const [activeTab, setActiveTab] = useState<'home' | 'comercial' | 'produccion' | 'rrhh' | 'calidad' | 'id' | 'finanzas' | 'estrategia'>('home');
    const { selectedCompanyId: selectedCompany, activeCompany: company, setCompany } = useCompany();

    const tabs = [
        { id: 'home', label: 'Resumen', icon: <LayoutDashboard size={18} /> },
        { id: 'finanzas', label: 'Finanzas', icon: <Euro size={18} /> },
        { id: 'comercial', label: 'Comercial', icon: <TrendingUp size={18} /> },
        { id: 'produccion', label: 'Producción', icon: <Factory size={18} /> },
        { id: 'rrhh', label: 'RRHH', icon: <Users size={18} /> },
        { id: 'calidad', label: 'Calidad', icon: <ShieldCheck size={18} /> },
        { id: 'id', label: 'I+D', icon: <Beaker size={18} /> },
        { id: 'estrategia', label: 'Estrategia', icon: <Compass size={18} /> },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                padding: '0.75rem 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 40
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Link href="/" style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
                        <ArrowLeft size={16} /> Volver
                    </Link>
                    <div style={{ height: '24px', width: '1px', background: 'var(--color-border)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {company ? (
                            <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '2px' }}>
                                <img src={company.logoPath} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                        ) : (
                            <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px', border: '1px solid var(--color-border)' }}>
                                <img src="/icon.png" alt="Grupo Labery" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-heading)', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)' }}>
                                DIRECCIÓN <span style={{ color: company?.color || 'var(--color-primary)' }}>{company?.name.toUpperCase() || 'GRUPO LABERY'}</span>
                            </h1>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {selectedCompany ? 'Visión Corporativa' : 'Control Divisional / Consolidado'}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <nav style={{ display: 'flex', gap: '4px', background: 'var(--color-bg)', padding: '3px', borderRadius: '8px' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '6px 16px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    transition: 'all 0.2s',
                                    background: activeTab === tab.id ? 'var(--color-surface)' : 'transparent',
                                    color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
                                    fontFamily: 'var(--font-body)'
                                }}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            {/* Main Content Area */}
            <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {activeTab === 'home' && <DashboardHome onNavigate={setActiveTab} />}
                    {activeTab === 'comercial' && <CommercialKPIs />}
                    {activeTab === 'produccion' && <ProductionKPIs />}
                    {activeTab === 'rrhh' && <HRKPIs />}
                    {activeTab === 'calidad' && <QualityKPIs />}
                    {activeTab === 'id' && <InnovationKPIs />}
                    {activeTab === 'finanzas' && <FinanceKPIs />}
                    {activeTab === 'estrategia' && <StrategyKPIs />}
                </div>
            </main>
        </div>
    );
}
