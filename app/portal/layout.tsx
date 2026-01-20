
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { signOutAction } from '@/app/lib/actions';
import { LogOut } from 'lucide-react';
import { auth } from '@/auth';
import ClientAssistant from '@/components/portal/ClientAssistant';
import styles from './portal.module.css';

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const clientName = session?.user?.connectedClientName || 'Cliente';
    const userName = session?.user?.name || session?.user?.email || 'Usuario';
    const userInitial = clientName.charAt(0).toUpperCase();

    // Check if client is Niche (for raw materials section)
    const isNicheClient = clientName.toUpperCase().includes('NICHE');

    return (
        <div className={styles.portalContainer}>
            {/* --- TOP BAR --- */}
            <nav className={styles.nav}>
                {/* LOGO */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Using the Primary Blue from brand for the logo placeholder or text */}
                    <span style={{
                        fontSize: '1.8rem',
                        fontWeight: 600,
                        letterSpacing: '-0.02em',
                        color: '#3E6AD8', // Labery Blue
                        fontFamily: 'sans-serif' // Should ideally match the logo font
                    }}>
                        Labery
                    </span>
                    <span style={{
                        borderLeft: '1px solid #cbd5e1',
                        paddingLeft: '1rem',
                        fontSize: '0.8rem',
                        color: '#82B2A8', // Brand Complementary
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        Customer Portal
                    </span>
                </div>

                {/* NAVIGATION */}
                <div style={{ display: 'flex', gap: '2.5rem' }}>
                    <NavLink href="/portal/dashboard" label="Inicio" />
                    <NavLink href="/portal/projects" label="Proyectos" />
                    <NavLink href="/portal/orders" label="Producción" />
                    {isNicheClient && <NavLink href="/portal/raw-materials" label="Materias Primas" />}
                </div>

                {/* PROFILE */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right', lineHeight: '1.2' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{clientName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{userName}</div>
                    </div>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: '#3E6AD8', // Primary Blue
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 600
                    }}>
                        {userInitial}
                    </div>
                    {/* LOGOUT */}
                    <form action={signOutAction}>
                        <button type="submit" style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex', alignItems: 'center',
                            transition: 'color 0.2s'
                        }} title="Cerrar Sesión">
                            <LogOut size={18} />
                        </button>
                    </form>
                </div>
            </nav>

            {/* --- CONTENT --- */}
            <main style={{ padding: '3rem', maxWidth: '1400px', margin: '0 auto', paddingTop: '120px' }}>
                {children}
            </main>

            <ClientAssistant />
        </div>
    );
}

function NavLink({ href, label }: { href: string, label: string }) {
    return (
        <Link href={href} style={{
            color: '#64748b', // Muted text
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: 500,
            transition: 'all 0.2s',
            // Note: Active state logic would ideally go here, simplified for now
        }}
        // Hover effect handled via CSS module or global if possible, manually adding style here is tricky for hover
        // We can rely on a simpler hover color
        >
            <span style={{ position: 'relative' }}>{label}</span>
        </Link>
    )
}
