
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await auth();
    if (!session || !session.user || !session.user.name) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = session.user;

    try {
        // Find offers where:
        // 1. Status is NOT Adjudicada, Aceptada, Rechazada (Active Pipeline)
        // 2. ResponsableComercial matches current user name
        // 3. Probability is NULL or 0
        const pendingProbabilityOffers = await prisma.offer.findMany({
            where: {
                responsableComercial: name,
                status: {
                    notIn: ['Adjudicada', 'Aceptada', 'Rechazada', 'Ganada', 'Perdida'] // Adjust based on your status logic
                },
                // @ts-ignore
                probability: null
            },
            select: {
                id: true,
                client: true,
                product: true,
                code: true,
                revision: true,
                status: true,
            }
        });

        const notifications = pendingProbabilityOffers.map(offer => ({
            type: 'missing_probability',
            title: 'Falta Probabilidad',
            message: `${offer.client} - ${offer.product} (${offer.code || 'Sin Código'})`,
            link: `/crm/pipeline?highlight=${offer.id}`, // navigate to pipeline
            id: offer.id
        }));

        return NextResponse.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}
