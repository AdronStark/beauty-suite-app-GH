
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';
import { Plus, Settings } from 'lucide-react';
import styles from './page.module.css';
import OfferTable from '@/components/ofertas/OfferTable';

export const dynamic = 'force-dynamic';

export default async function OfertasPage() {
    const session = await auth();
    const isAdmin = session?.user?.role === 'ADMIN';

    const offers = await prisma.offer.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            briefing: {
                select: {
                    id: true,
                    code: true
                }
            }
        }
    });

    // Serialize dates for Client Component
    // Prisma Date objects might need to be converted to strings or numbers if passed to Client Comps?
    // Next.js Server Components -> Client Components serialization:
    // "Warning: Dates cannot be passed to Client Components..."
    // Yes, we need to map them to strings or rely on the fact that sometimes it works but strict mode failing.
    // Better to serialize.

    const serializedOffers = offers.map(o => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        // ensure decimal/float/int are simple types (they are)
    }));

    // Stats
    const total = offers.length;
    const drafts = offers.filter(o => o.status === 'Borrador').length;
    const sent = offers.filter(o => o.status === 'Enviada').length;
    const approved = offers.filter(o => o.status === 'Aprobada').length;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.scrollableContent}>
                <div className={`${styles.contentWrapper} container`} style={{ padding: '2rem', paddingBottom: '4rem' }}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Ofertas Beauty</h1>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {isAdmin && (
                                <Link href="/ofertas/config" className={styles.newButton} style={{ background: 'white', color: '#64748b', border: '1px solid #cbd5e1' }}>
                                    <Settings size={20} />
                                    Configuración
                                </Link>
                            )}
                            <Link href="/ofertas/new" className={styles.newButton}>
                                <Plus size={20} />
                                Nueva Oferta
                            </Link>
                        </div>
                    </div>

                    <div className={styles.statsRow}>
                        <div className={styles.statCard}>
                            <h3>Total</h3>
                            <p>{total}</p>
                        </div>
                        <div className={styles.statCard}>
                            <h3>Borradores</h3>
                            <p>{drafts}</p>
                        </div>
                        <div className={styles.statCard}>
                            <h3>Enviadas</h3>
                            <p>{sent}</p>
                        </div>
                        <div className={styles.statCard}>
                            <h3>Aprobadas</h3>
                            <p>{approved}</p>
                        </div>
                    </div>

                    <OfferTable offers={serializedOffers} />
                </div>
            </div>
        </div>
    );
}

