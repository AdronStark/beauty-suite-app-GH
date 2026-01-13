import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { Plus } from 'lucide-react';
import styles from './page.module.css';
import BriefingTable from '@/components/briefings/BriefingTable';

export const dynamic = 'force-dynamic';

export default async function BriefingsPage() {
    const briefings = await prisma.briefing.findMany({
        orderBy: { updatedAt: 'desc' }
    });

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div className={styles.header}>
                <h1 className={styles.title}>Briefings</h1>
                <Link href="/briefings/wizard" className={styles.newButton}>
                    <Plus size={20} />
                    Nuevo Briefing
                </Link>
                <Link href="/briefings/calendar" className={styles.newButton} style={{ backgroundColor: 'white', color: '#2563eb', border: '1px solid #e2e8f0', marginLeft: '1rem' }}>
                    📅 Carga de Trabajo
                </Link>
            </div>

            <BriefingTable briefings={briefings} />
        </div>
    );
}
