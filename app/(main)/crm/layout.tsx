'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Kanban, Users, Settings } from 'lucide-react';

export default function CRMLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const tabs = [
        { name: 'Resumen', href: '/crm', icon: LayoutDashboard, exact: true },
        { name: 'Pipeline', href: '/crm/pipeline', icon: Kanban, exact: false },
        { name: 'Clientes', href: '/crm/clients', icon: Users, exact: false },
        { name: 'Configuración', href: '/crm/settings', icon: Settings, exact: true },
    ];

    const isActive = (tab: typeof tabs[0]) => {
        if (tab.exact) {
            return pathname === tab.href;
        }
        return pathname.startsWith(tab.href);
    };

    return (
        <div style={{ minHeight: '100%' }}>
            {/* Sub-Navigation Bar */}
            <div style={{
                background: 'white',
                borderBottom: '1px solid #e2e8f0',
                padding: '0 2rem',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div style={{
                    maxWidth: '1600px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2rem',
                    overflowX: 'auto'
                }}>
                    {tabs.map((tab) => {
                        const active = isActive(tab);
                        const Icon = tab.icon;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '1rem 0',
                                    textDecoration: 'none',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    color: active ? 'var(--color-primary)' : '#64748b',
                                    borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Icon size={18} />
                                {tab.name}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Page Content */}
            <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 120px)' }}>
                {children}
            </div>
        </div>
    );
}
