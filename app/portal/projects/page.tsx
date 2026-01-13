import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import ProjectsListClient from './ProjectsListClient';

export default async function PortalProjectsPage() {
    const user = await getCurrentUser();
    if (!user || user.role !== 'CLIENT' || !user.connectedClientName) redirect('/login');

    const briefings = await prisma.briefing.findMany({
        where: { clientName: user.connectedClientName },
        include: {
            formulas: {
                include: { samples: true }
            },
            offers: true
        },
        orderBy: { updatedAt: 'desc' }
    });

    return (
        <ProjectsListClient briefings={briefings} />
    );
}


