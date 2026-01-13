import { prisma } from '@/lib/db/prisma';
import { Briefing, Formula } from '@prisma/client';
import { Clock, Beaker, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import WorkloadCard from './WorkloadCard';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function WorkloadPage() {
    // 1. Fetch Technicians
    const technicians = await prisma.user.findMany({
        where: { role: 'OPERATOR' }, // Based on seed_users.ts
        select: { username: true, name: true }
    });

    // 2. Fetch Pending Briefings (Assignments)
    const pendingBriefings = await prisma.briefing.findMany({
        where: {
            // status: { not: 'Completed' } // Filter if needed
        },
        include: {
            formulas: true // Include relation to check existing formulas
        },
        orderBy: { updatedAt: 'desc' }
    } as any);

    // 3. Fetch "In Progress" (Briefings with Formulas or specific status)
    // For now, let's treat "In Progress" as briefings that have at least one formula
    const activeBriefings = pendingBriefings.filter((b: any) => b.formulas && b.formulas.length > 0);
    const unstartedBriefings = pendingBriefings.filter((b: any) => !b.formulas || b.formulas.length === 0);

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-text-heading)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Clock className="text-primary" size={32} style={{ color: 'var(--color-primary)' }} />
                        Carga de Trabajo I+D
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Gestión de briefings pendientes y asignación de tareas.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>

                {/* Column 1: Pending Assignment / Start */}
                <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: '12px' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'orange' }}></span>
                        Pendientes de Inicio ({unstartedBriefings.length})
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {unstartedBriefings.map(briefing => (
                            <WorkloadCard key={briefing.id} briefing={briefing} technicians={technicians} />
                        ))}
                        {unstartedBriefings.length === 0 && <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No hay briefings pendientes.</p>}
                    </div>
                </div>

                {/* Column 2: In Progress (Has Formula) */}
                <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: '12px' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }}></span>
                        En Desarrollo ({activeBriefings.length})
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {activeBriefings.map(briefing => (
                            <WorkloadCard key={briefing.id} briefing={briefing} technicians={technicians} />
                        ))}
                        {activeBriefings.length === 0 && <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No hay proyectos en desarrollo.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
