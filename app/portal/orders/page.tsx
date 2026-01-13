
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import OrdersListClient from './OrdersListClient';

export default async function PortalOrdersPage() {
    const user = await getCurrentUser();
    if (!user || user.role !== 'CLIENT' || !user.connectedClientName) redirect('/login');

    const orders = await prisma.productionBlock.findMany({
        where: {
            clientName: user.connectedClientName,
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <OrdersListClient orders={orders} />
    );
}


