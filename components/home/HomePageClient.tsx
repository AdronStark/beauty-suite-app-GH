'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCompany } from '@/context/CompanyContext';
import styles from '@/app/(main)/page.module.css';
import { User } from 'next-auth';
import { useAppConfig } from '@/context/AppConfigContext';
import {
    Calendar, FileText, BarChart2, Tag,
    Microscope, Users, FlaskConical, LayoutGrid, Package
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
    BarChart2,
    FileText,
    Microscope,
    Tag,
    Users,
    Calendar,
    FlaskConical,
    LayoutGrid,
    Package
};


import RecentActivity from '@/components/home/RecentActivity';
import { animate, stagger } from 'animejs';

export default function HomePageClient({ user }: { user?: User }) {
    const iconSize = 28;
    // Old intro state removed as it is replaced by IntroAnimation.tsx
    // const [introState, setIntroState] = useState<'hidden' | 'zoom' | 'intro' | 'dropping' | 'rippling'>('hidden');
    const { selectedCompanyId: selectedCompany } = useCompany();
    const { apps, checkAccess } = useAppConfig();

    const sortApps = (a: any, b: any) => {
        // Active first
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return 0;
    };

    // AnimeJS Integration
    const [auditRender, setAuditRender] = useState(false);
    const [startAnimation, setStartAnimation] = useState(false);

    useEffect(() => {
        setAuditRender(true);

        // Check if intro is already done or skipped
        if (typeof window !== 'undefined') {
            const hasShown = sessionStorage.getItem('intro_shown');
            if (hasShown) {
                setStartAnimation(true);
            }
        }

        const handleIntroComplete = () => {
            setStartAnimation(true);
        };

        window.addEventListener('intro-complete', handleIntroComplete);
        return () => window.removeEventListener('intro-complete', handleIntroComplete);
    }, []);

    useEffect(() => {
        console.log("AnimeJS useEffect triggered. auditRender:", auditRender, "apps.length:", apps.length);
        if (!auditRender || !startAnimation) return;

        const targets = document.querySelectorAll('.app-card-item');
        console.log("AnimeJS: Triggering animation on", targets.length, "cards");

        if (targets.length === 0) return;

        // Animate cards entry
        animate('.app-card-item', {
            translateY: [20, 0],
            opacity: [0, 1],
            delay: stagger(100),
            ease: 'outExpo',
            duration: 800
        });

    }, [auditRender, startAnimation, apps]); // Run when apps or render readiness changes

    return (
        <div className={styles.homeContainer}>

            {/* INTRO OVERLAY */}
            {/* INTRO OVERLAY REMOVED - Handled by IntroAnimation.tsx */}

            {/* MAIN CONTENT WRAPPER */}
            <div className={styles.dashboardWrapper} style={{ opacity: 1 }}>

                {/* LEFT COLUMN: APPS */}
                <div className={styles.mainContent}>

                    {/* DIRECCIÓN Section */}
                    {apps.filter(a => a.group === 'direction' && checkAccess(a.id, user?.role, selectedCompany)).length > 0 && (
                        <section className={styles.categorySection}>
                            <h2 className={styles.categoryTitle}>Dirección</h2>
                            <div className={styles.categoryGrid}>
                                {apps
                                    .filter(a => a.group === 'direction' && checkAccess(a.id, user?.role, selectedCompany))
                                    .sort(sortApps)
                                    .map(app => {
                                        const Icon = ICON_MAP[app.iconName] || FileText;
                                        return (
                                            <Link key={app.id} href={app.path} className={`${styles.cardLink} app-card-item`} style={{ opacity: 0 }}>
                                                <div className={styles.appCard} style={{ border: '2px solid var(--color-primary)', background: 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)' }}>
                                                    <Icon size={iconSize} className={styles.icon} style={{ color: 'var(--color-primary)' }} />
                                                    <h3>{app.title}</h3>
                                                    <p>{app.description}</p>
                                                </div>
                                            </Link>
                                        );
                                    })
                                }
                            </div>
                        </section>
                    )}

                    {/* I+D Section */}
                    {apps.filter(a => a.group === 'rd' && checkAccess(a.id, user?.role, selectedCompany)).length > 0 && (
                        <section className={styles.categorySection}>
                            <h2 className={styles.categoryTitle}>I+D</h2>
                            <div className={styles.categoryGrid}>
                                {apps
                                    .filter(a => a.group === 'rd' && checkAccess(a.id, user?.role, selectedCompany))
                                    .sort(sortApps)
                                    .map(app => {
                                        const Icon = ICON_MAP[app.iconName] || FileText;
                                        return (
                                            app.status === 'active' ? (
                                                <Link key={app.id} href={app.path} className={`${styles.cardLink} app-card-item`} style={{ opacity: 0 }}>
                                                    <div className={styles.appCard}>
                                                        <Icon size={iconSize} className={styles.icon} />
                                                        <h3>{app.title}</h3>
                                                        <p>{app.description}</p>
                                                    </div>
                                                </Link>
                                            ) : (
                                                <div key={app.id} className={`${styles.appCard} ${styles.comingSoonCard} app-card-item`} style={{ opacity: 0 }}>
                                                    <div className={styles.badge}>PRÓXIMAMENTE</div>
                                                    <Icon size={iconSize} className={styles.icon} />
                                                    <h3>{app.title}</h3>
                                                    <p>{app.description}</p>
                                                </div>
                                            )
                                        );
                                    })
                                }
                            </div>
                        </section>
                    )}

                    {/* COMERCIAL Section */}
                    {apps.filter(a => a.group === 'commercial' && checkAccess(a.id, user?.role, selectedCompany)).length > 0 && (
                        <section className={styles.categorySection}>
                            <h2 className={styles.categoryTitle}>Comercial / Negocio</h2>
                            <div className={styles.categoryGrid}>
                                {apps
                                    .filter(a => a.group === 'commercial' && checkAccess(a.id, user?.role, selectedCompany))
                                    .sort(sortApps)
                                    .map(app => {
                                        const Icon = ICON_MAP[app.iconName] || FileText;
                                        return (
                                            app.status === 'active' ? (
                                                <Link key={app.id} href={app.path} className={`${styles.cardLink} app-card-item`} style={{ opacity: 0 }}>
                                                    <div className={styles.appCard}>
                                                        <Icon size={iconSize} className={styles.icon} />
                                                        <h3>{app.title}</h3>
                                                        <p>{app.description}</p>
                                                    </div>
                                                </Link>
                                            ) : (
                                                <div key={app.id} className={`${styles.appCard} ${styles.comingSoonCard} app-card-item`} style={{ opacity: 0 }}>
                                                    <div className={styles.badge}>PRÓXIMAMENTE</div>
                                                    <Icon size={iconSize} className={styles.icon} />
                                                    <h3>{app.title}</h3>
                                                    <p>{app.description}</p>
                                                </div>
                                            )
                                        );
                                    })
                                }
                            </div>
                        </section>
                    )}

                    {/* PRODUCCIÓN Section */}
                    {apps.filter(a => a.group === 'production' && checkAccess(a.id, user?.role, selectedCompany)).length > 0 && (
                        <section className={styles.categorySection}>
                            <h2 className={styles.categoryTitle}>Gestión de la Producción</h2>
                            <div className={styles.categoryGrid}>
                                {apps
                                    .filter(a => a.group === 'production' && checkAccess(a.id, user?.role, selectedCompany))
                                    .sort(sortApps)
                                    .map(app => {
                                        const Icon = ICON_MAP[app.iconName] || FileText;
                                        return (
                                            app.status === 'active' ? (
                                                <Link key={app.id} href={app.path} className={`${styles.cardLink} app-card-item`} style={{ opacity: 0 }}>
                                                    <div className={styles.appCard}>
                                                        <div className={styles.iconContainer}>
                                                            <Icon size={iconSize} className={styles.icon} />
                                                            {/* Add Initial Letter Overlay if it's Planner */}
                                                            {app.id.includes('planner') && (
                                                                <span className={styles.iconLabel}>{app.title.includes('Coper') ? 'C' : 'J'}</span>
                                                            )}
                                                        </div>
                                                        <h3>{app.title}</h3>
                                                        <p>{app.description}</p>
                                                    </div>
                                                </Link>
                                            ) : (
                                                <div key={app.id} className={`${styles.appCard} ${styles.comingSoonCard} app-card-item`} style={{ opacity: 0 }}>
                                                    <div className={styles.badge}>PRÓXIMAMENTE</div>
                                                    <div className={styles.iconContainer}>
                                                        <Icon size={iconSize} className={styles.icon} />
                                                        {app.id.includes('planner') && (
                                                            <span className={styles.iconLabel}>{app.title.includes('Coper') ? 'C' : 'J'}</span>
                                                        )}
                                                    </div>
                                                    <h3>{app.title}</h3>
                                                    <p>{app.description}</p>
                                                </div>
                                            )
                                        );
                                    })
                                }
                            </div>
                        </section>
                    )}
                </div>

                {/* RIGHT COLUMN: RECENT ACTIVITY */}
                <div className={styles.sidebar}>
                    <RecentActivity />
                </div>

            </div>

            <div style={{ marginTop: '4rem', color: '#94a3b8', fontSize: '0.9rem', letterSpacing: '0.05em', fontFamily: 'var(--font-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <span>Labery by Mirai</span>
                <button
                    onClick={() => {
                        localStorage.removeItem('lastIntroDate');
                        window.location.reload();
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#cbd5e1',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                    }}
                >
                    (Debug: Reset Intro)
                </button>
            </div>
        </div>
    );
}
