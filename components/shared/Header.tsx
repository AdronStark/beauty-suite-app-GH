'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Moon, Sun, LogOut, User as UserIcon, Shield, Settings, ChevronDown } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import NotificationCenter from './NotificationCenter';
import GlobalSearch from './GlobalSearch';
import { useCompany } from '@/context/CompanyContext';
import { useAppConfig } from '@/context/AppConfigContext';
import styles from './Header.module.css';


import { useSession, signOut } from 'next-auth/react';

export default function Header() {
    const { data: session } = useSession();
    const user = session?.user;
    const pathname = usePathname();
    const { selectedCompanyId, activeCompany, setCompany, availableCompanies } = useCompany();
    const { checkAccess } = useAppConfig(); // Added hook usage
    const [openCategory, setOpenCategory] = useState<string | null>(null);
    const navRef = useRef<HTMLDivElement>(null);

    // Close nav dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setOpenCategory(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navStructure = [
        {
            category: "I+D",
            items: [
                { label: "Carga de Trabajo", href: "/workload" },
                { label: "Briefings", href: "/briefings" },
                { label: "Biblioteca Fórmulas", href: "/formulas" }
            ]
        },
        {
            category: "Comercial",
            items: [
                { label: "Dashboard CRM", href: "/crm" }, // Changed to CRM
                { label: "Ofertas", href: "/ofertas" }
            ]
        },
        {
            category: "Gestión Producción",
            items: [
                { label: "Planificador", href: "/planificador" },
                { label: "Materias Primas", href: "/materias-primas" }
            ]
        }
    ];

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname.startsWith(path)) return true;
        return false;
    };

    const isCategoryActive = (items: { href: string }[]) => {
        return items.some(item => isActive(item.href));
    };

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const saved = localStorage.getItem('theme') || 'light';
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
    }, []);

    const profileRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };

        if (isProfileOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileOpen]);

    const toggleTheme = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        localStorage.setItem('theme', next);
        document.documentElement.setAttribute('data-theme', next);
    };

    const getInitials = (userObj: any) => {
        if (userObj?.firstName && userObj?.lastName1) {
            return (userObj.firstName[0] + userObj.lastName1[0]).toUpperCase();
        }
        if (userObj?.name) {
            const parts = userObj.name.trim().split(' ');
            if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
            }
            return userObj.name.substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.brand}>
                    <div style={{ position: 'relative', width: '32px', height: '32px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/labery-icon.png" alt="Labery Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 300, color: 'var(--color-primary)' }}>
                        Labery Beauty App Suite
                    </span>
                </Link>

                <nav className={styles.nav} ref={navRef} style={{ display: 'flex', gap: '1.5rem' }}>
                    {navStructure.map((group) => {
                        // Filter items based on access using permissionKey or href
                        const authorizedItems = group.items.filter(item => {
                            // @ts-ignore
                            const key = item.permissionKey || item.href;
                            return checkAccess(key, user?.role, selectedCompanyId);
                        });

                        if (authorizedItems.length === 0) return null;

                        const active = isCategoryActive(authorizedItems);
                        const isOpen = openCategory === group.category;

                        return (
                            <div key={group.category} style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setOpenCategory(isOpen ? null : group.category)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '0.5rem 0',
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        color: active ? 'var(--color-primary)' : 'var(--color-text)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    {group.category}
                                    <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                </button>

                                {isOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        background: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        minWidth: '180px',
                                        zIndex: 50,
                                        marginTop: '0.5rem',
                                        padding: '0.5rem 0'
                                    }}>
                                        {authorizedItems.map(item => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setOpenCategory(null)}
                                                style={{
                                                    display: 'block',
                                                    padding: '0.75rem 1rem',
                                                    textDecoration: 'none',
                                                    color: isActive(item.href) ? 'var(--color-primary)' : 'var(--color-text)',
                                                    fontSize: '0.9rem',
                                                    background: isActive(item.href) ? '#f0f9ff' : 'transparent',
                                                    fontWeight: isActive(item.href) ? 500 : 400
                                                }}
                                                className={styles.dropdownItemHover} // Assuming specific hover class needed or use inline hover logic which is hard in inline styles.
                                            // I'll stick to simple inline for now, maybe add a class if I could.
                                            >
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <GlobalSearch />

                    {user && <NotificationCenter />}

                    <button
                        onClick={toggleTheme}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem'
                        }}
                        title={theme === 'light' ? 'Activar Modo Oscuro' : 'Activar Modo Claro'}
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>

                    {user ? (
                        <div className={styles.profileContainer} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {/* Active Company Indicator */}
                            {activeCompany && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9 }}>
                                    <div style={{ width: '24px', height: '24px', background: 'white', padding: '2px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={activeCompany.logoPath} alt={activeCompany.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }} className={styles.hideMobile}>
                                        {activeCompany.name}
                                    </span>
                                </div>
                            )}

                            <div style={{ position: 'relative' }} ref={profileRef}>
                                <button
                                    className={styles.profileButton}
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    title={user.name || 'Usuario'}
                                >
                                    {getInitials(user)}
                                </button>

                                {isProfileOpen && (
                                    <div className={styles.dropdown} style={{ zIndex: 100 }}>
                                        <div className={styles.userInfo}>
                                            <div className={styles.userName}>{user.name}</div>
                                            {/* @ts-ignore */}
                                            {user.role && user.role !== 'VIEWER' && (
                                                <div className={styles.userRole}>{user.role}</div>
                                            )}
                                        </div>
                                        <button className={styles.dropdownItem} onClick={() => console.log('Profile')}>
                                            <UserIcon size={16} /> Mi Perfil
                                        </button>

                                        {availableCompanies.length > 1 && (
                                            <Link href="/select-company" className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>
                                                <LayoutGrid size={16} /> Cambiar Empresa
                                            </Link>
                                        )}

                                        {/* @ts-ignore */}
                                        {user.role === 'ADMIN' && (
                                            <>
                                                <Link href="/admin/apps" className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>
                                                    <Settings size={16} /> Gestión Aplicaciones
                                                </Link>
                                                <Link href="/admin/users" className={styles.dropdownItem}>
                                                    <Shield size={16} /> Usuarios
                                                </Link>
                                            </>
                                        )}
                                        <div className={styles.dropdownDivider} />
                                        <button className={styles.dropdownItem} onClick={() => {
                                            sessionStorage.removeItem('intro_shown');
                                            signOut({ callbackUrl: '/login' });
                                        }}>
                                            <LogOut size={16} /> Cerrar Sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            style={{
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: 'white',
                                background: 'var(--color-primary)',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                textDecoration: 'none'
                            }}
                        >
                            Entrar
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
