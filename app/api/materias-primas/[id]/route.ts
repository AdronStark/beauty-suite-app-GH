import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Await params first (Next.js 15+ async params)
        const { id } = await params;
        const body = await req.json();

        // Whitelist fields efficiently
        const { manualReceptionDate, notes, associatedOE, estimatedDate } = body;
        const dataToUpdate: any = {};

        if (manualReceptionDate !== undefined) {
            // If null/empty string passed, set to null, otherwise parse date
            dataToUpdate.manualReceptionDate = manualReceptionDate ? new Date(manualReceptionDate) : null;
        }
        if (estimatedDate !== undefined) {
            dataToUpdate.estimatedDate = estimatedDate ? new Date(estimatedDate) : null;
        }
        if (notes !== undefined) dataToUpdate.notes = notes;
        if (associatedOE !== undefined) dataToUpdate.associatedOE = associatedOE;

        const updated = await prisma.rawMaterialOrder.update({
            where: { id },
            data: dataToUpdate
        });

        return NextResponse.json(updated);

    } catch (e) {
        console.error("Error updating raw material order:", e);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
