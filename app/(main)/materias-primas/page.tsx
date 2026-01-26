import { prisma } from '@/lib/db/prisma';
import RawMaterialsLayout from '@/components/materias-primas/RawMaterialsLayout';

export const dynamic = 'force-dynamic';

export default async function RawMaterialsPage() {

    const config = await prisma.configuration.findUnique({
        where: { key: 'RM_ALERT_DAYS' }
    });
    const alertDays = config?.value ? parseInt(config.value) : 7;

    const openOrders = await prisma.rawMaterialOrder.findMany({
        where: {
            isCompleted: false
        },
        orderBy: {
            orderDate: 'desc'
        }
    });



    return <RawMaterialsLayout initialOrders={openOrders} alertDays={alertDays} />;
}
