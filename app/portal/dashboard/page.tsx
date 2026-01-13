
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Clock, Package, TrendingUp, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import ProjectTimeline from './ProjectTimeline';
import InnovationShowcase from './InnovationShowcase';

import styles from './dashboard.module.css';

export default async function PortalDashboard() {
    const user = await getCurrentUser();

    if (!user || user.role !== 'CLIENT' || !user.connectedClientName) {
        // Safety fallback if middleware fails or direct access
        redirect('/login');
    }

    const clientName = user.connectedClientName;

    // Fetch metrics
    const activeBriefings = await prisma.briefing.count({
        where: {
            clientName: clientName,
            status: { not: 'Completado' } // Assume 'Completado' is final
        }
    });

    const activeOrders = await prisma.productionBlock.count({
        where: {
            clientName: clientName,
            status: { not: 'PRODUCED' } // Pending or Planned
        }
    });

    // Fetch recent Briefings (Projects)
    const recentBriefings = await prisma.briefing.findMany({
        where: { clientName: clientName },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        include: {
            formulas: {
                include: { samples: true }
            },
            offers: true
        }
    });

    return (
        <div>
            {/* WELCOME SECTION */}
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b', letterSpacing: '-0.025em' }}>
                    Buenos días, {user.name || 'Cliente'}.
                </h1>
                <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
                    Aquí tienes el estado actual de tus desarrollos y pedidos.
                </p>
            </div>

            {/* MAIN CONTENT GRID - Using Exact CSS Module from Main App */}
            <div className={styles.dashboardWrapper}>

                {/* LEFT COLUMN */}
                <div className={styles.mainContent}>
                    {/* METRICS GRID */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                        <MetricCard
                            label="Proyectos en Curso"
                            value={activeBriefings.toString()}
                            icon={<Clock size={24} color="#3E6AD8" />} // Primary Blue
                            trend="+2 este mes"
                        />
                        <MetricCard
                            label="Pedidos en Producción"
                            value={activeOrders.toString()}
                            icon={<FactoryIcon size={24} color="#82B2A8" />} // Brand Complementary
                            trend="En planta"
                        />
                        <MetricCard
                            label="Muestras Enviadas"
                            value="-"
                            icon={<Package size={24} color="#3E6AD8" />}
                            trend="Pendientes revisión"
                        />
                    </div>

                    {/* INNOVATION SHOWCASE */}
                    <InnovationShowcase />
                </div>


            </div>
        </div>
    );
}

function MetricCard({ label, value, icon, trend }: { label: string, value: string, icon: React.ReactNode, trend?: string }) {
    return (
        <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
            padding: '2rem',
            borderRadius: '16px',
            display: 'flex', flexDirection: 'column', gap: '1rem'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>{label}</span>
                <div style={{ padding: '8px', background: '#F8FAFC', borderRadius: '10px' }}>
                    {icon}
                </div>
            </div>
            <div>
                <div style={{ fontSize: '3rem', fontWeight: 600, color: '#1e293b', lineHeight: 1 }}>
                    {value}
                </div>
                {trend && <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#82B2A8', fontWeight: 500 }}>
                    {trend}
                </div>}
            </div>
        </div>
    )
}

function FactoryIcon({ size, color }: { size: number, color: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M17 18h1" />
            <path d="M12 18h1" />
            <path d="M7 18h1" />
        </svg>
    )
}
