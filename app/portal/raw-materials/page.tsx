import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import PortalRawMaterialsTable from '@/components/portal/PortalRawMaterialsTable';

export const dynamic = 'force-dynamic';

export default async function PortalRawMaterialsPage() {
    const session = await auth();
    const user = session?.user;

    // Must be CLIENT role with connected client name containing "NICHE"
    if (!user || user.role !== 'CLIENT' || !user.connectedClientName) {
        redirect('/login');
    }

    // Check if this is Niche client
    if (!user.connectedClientName.toUpperCase().includes('NICHE')) {
        redirect('/portal/dashboard');
    }

    // Fetch orders where this client is the supplier
    const orders = await prisma.rawMaterialOrder.findMany({
        where: {
            supplierName: {
                contains: 'NICHE BEAUTY LAB'
            },
            isCompleted: false
        },
        orderBy: {
            estimatedDate: 'asc'
        }
    });

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    marginBottom: '0.5rem'
                }}>
                    Gestión de Materias Primas
                </h1>
                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                    Pedidos de compra donde {user.connectedClientName} es proveedor
                </p>
            </div>
            <PortalRawMaterialsTable data={orders} />
        </div>
    );
}
