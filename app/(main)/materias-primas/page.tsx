import { prisma } from '@/lib/db/prisma';
import RawMaterialsLayout from '@/components/materias-primas/RawMaterialsLayout';

export const dynamic = 'force-dynamic';

export default async function RawMaterialsPage() {

    const openOrders = await prisma.rawMaterialOrder.findMany({
        where: {
            isCompleted: false
        },
        orderBy: {
            orderDate: 'desc'
        }
    });

    return <RawMaterialsLayout initialOrders={openOrders} />;
}
