import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();

        // Must be authenticated and be a CLIENT user
        if (!session?.user || session.user.role !== 'CLIENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const clientName = session.user.connectedClientName;
        if (!clientName) {
            return NextResponse.json({ error: 'No client connected' }, { status: 403 });
        }

        // Get raw material orders where this client is the supplier
        // For Niche, supplierName will be "NICHE BEAUTY LAB, S.L." 
        const orders = await prisma.rawMaterialOrder.findMany({
            where: {
                supplierName: {
                    contains: clientName.split(',')[0].trim(), // Match "NICHE BEAUTY LAB" part
                },
                isCompleted: false
            },
            orderBy: {
                estimatedDate: 'asc'
            }
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error('Error fetching portal raw materials:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
