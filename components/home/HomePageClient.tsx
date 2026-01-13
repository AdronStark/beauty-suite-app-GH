'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCompany } from '@/context/CompanyContext';
import styles from '@/app/(main)/page.module.css';
import { User } from 'next-auth';
import { useAppConfig } from '@/context/AppConfigContext';
import {
    Calendar, FileText, BarChart2, Tag,
    Microscope, Users, FlaskConical, LayoutGrid
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
    BarChart2,
    FileText,
    Microscope,
    Tag,
    Users,
    Calendar,
    FlaskConical,
    LayoutGrid
};


import RecentActivity from '@/components/home/RecentActivity';

export default function HomePageClient({ user }: { user?: User }) {
    const iconSize = 28;
    const [introState, setIntroState] = useState<'hidden' | 'zoom' | 'intro' | 'dropping' | 'rippling'>('hidden');
    const { selectedCompanyId: selectedCompany } = useCompany();
    const { apps, checkAccess } = useAppConfig();

    useEffect(() => {
        // Animation disabled by user request
        setIntroState('hidden');
    }, []);

    const startIntro = () => {
        setIntroState('zoom');

        setTimeout(() => {
            setIntroState('intro');
        }, 1500);

        setTimeout(() => {
            setIntroState('dropping');
        }, 2000);

        setTimeout(() => {
            setIntroState('rippling');

            try {
                const audio = new Audio('/intro.mp3');
                audio.volume = 0.5;
                audio.play().catch(e => {
                    // Auto-play might be blocked, which is fine
                    console.log("Audio auto-play blocked");
                });
            } catch (e) {
                console.error("Audio setup failed:", e);
            }
        }, 2500);

        setTimeout(() => {
            setIntroState('hidden');
        }, 4500);
    };

    const sortApps = (a: any, b: any) => {
        // Active first
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        // Then by original order (implicitly stable sort usually, but let's rely on array order)
        return 0;
    };

    return (
        <div className={styles.homeContainer}>

            {/* INTRO OVERLAY */}
            {introState !== 'hidden' && (
                <>
                    <div
                        className={`${styles.introOverlay} ${introState === 'rippling' ? styles.bgFadeOut : ''}`}
                        style={{ background: 'white', display: 'flex' }}
                    />

                    {introState === 'dropping' && <div className={styles.dropPerspective} />}

                    {introState === 'rippling' && (
                        <>
                            <div className={styles.rippleRing} style={{ animationDelay: '0s' }} />
                            <div className={styles.rippleRing} style={{ animationDelay: '0.2s' }} />
                            <div className={styles.rippleRing} style={{ animationDelay: '0.4s' }} />
                        </>
                    )}

                    <div
                        className={`
              ${styles.introTextContainer}
              ${introState === 'zoom' ? styles.zoomingIn : ''}
              ${introState === 'rippling' ? styles.textRippleExit : ''}
            `}
                        style={{ zIndex: 10000 }}
                    >
                        <h1 className={styles.titleAnimated} style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                            Labery Beauty App Suite
                        </h1>
                        <p className={styles.subtitle} style={{ fontSize: '1.2rem', opacity: 0.8 }}>
                            Innovación y Excelencia en Cosmética
                        </p>
                    </div>
                </>
            )}

            {/* MAIN CONTENT WRAPPER */}
            <div className={styles.dashboardWrapper} style={{ opacity: introState === 'hidden' ? 1 : 0, transition: 'opacity 1s ease-in-out', transitionDelay: '0.2s' }}>

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
                                            <Link key={app.id} href={app.path} className={styles.cardLink}>
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
                                                <Link key={app.id} href={app.path} className={styles.cardLink}>
                                                    <div className={styles.appCard}>
                                                        <Icon size={iconSize} className={styles.icon} />
                                                        <h3>{app.title}</h3>
                                                        <p>{app.description}</p>
                                                    </div>
                                                </Link>
                                            ) : (
                                                <div key={app.id} className={`${styles.appCard} ${styles.comingSoonCard}`}>
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
                                                <Link key={app.id} href={app.path} className={styles.cardLink}>
                                                    <div className={styles.appCard}>
                                                        <Icon size={iconSize} className={styles.icon} />
                                                        <h3>{app.title}</h3>
                                                        <p>{app.description}</p>
                                                    </div>
                                                </Link>
                                            ) : (
                                                <div key={app.id} className={`${styles.appCard} ${styles.comingSoonCard}`}>
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
                                                <Link key={app.id} href={app.path} className={styles.cardLink}>
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
                                                <div key={app.id} className={`${styles.appCard} ${styles.comingSoonCard}`}>
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
