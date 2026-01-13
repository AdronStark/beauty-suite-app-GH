import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const offer = await prisma.offer.findUnique({
            where: { id }
        });

        if (!offer) {
            return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        }

        return NextResponse.json(offer);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Status Logic for PUT (Copied from PATCH)
        const dataToUpdate: any = {
            client: body.client,
            product: body.product,
            status: body.status,
            inputData: typeof body.inputData === 'string' ? body.inputData : JSON.stringify(body.inputData),
            resultsSummary: typeof body.resultsSummary === 'string' ? body.resultsSummary : JSON.stringify(body.resultsSummary),
        };

        if (body.status) {
            const now = new Date();
            // 1. Update Specific Date Fields
            if (body.status === 'Enviada') {
                dataToUpdate.sentAt = now;
            } else if (['Adjudicada', 'Aceptada'].includes(body.status)) {
                dataToUpdate.wonAt = now;
            } else if (['Rechazada', 'Perdida'].includes(body.status)) {
                dataToUpdate.lostAt = now;
            }

            // 2. Append to Status History
            try {
                const current = await prisma.offer.findUnique({
                    where: { id },
                    select: { statusHistory: true }
                });
                const history = current?.statusHistory ? JSON.parse(current.statusHistory) : [];
                history.push({ status: body.status, date: now.toISOString() });
                dataToUpdate.statusHistory = JSON.stringify(history);
            } catch (e) { console.error("History error", e); }
        }

        const updated = await prisma.offer.update({
            where: { id },
            data: dataToUpdate
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Allow updating specific fields
        const allowedFields = [
            'responsableComercial',
            'responsableTecnico',
            'probability',
            'status',
            'client',
            'product'
        ];

        const dataToUpdate: any = {};

        // Handle Status Logic
        if (body.status) {
            dataToUpdate.status = body.status;
            const now = new Date();

            // 1. Update Specific Date Fields
            if (body.status === 'Enviada') {
                dataToUpdate.sentAt = now;
            } else if (['Adjudicada', 'Aceptada'].includes(body.status)) {
                dataToUpdate.wonAt = now;
            } else if (['Rechazada', 'Perdida'].includes(body.status)) {
                dataToUpdate.lostAt = now;
            }

            // 2. Append to Status History
            try {
                // Fetch current history first to append
                const current = await prisma.offer.findUnique({
                    where: { id },
                    select: { statusHistory: true }
                });

                const history = current?.statusHistory ? JSON.parse(current.statusHistory) : [];
                history.push({
                    status: body.status,
                    date: now.toISOString(),
                    // Ideally we'd have the user ID here, but in API route context we might need to fetch session
                    // For now, tracking the event is the priority
                });
                dataToUpdate.statusHistory = JSON.stringify(history);
            } catch (e) {
                console.error("Failed to update status history", e);
            }
        }

        for (const field of allowedFields) {
            // optimized: status is already handled above
            if (field !== 'status' && body[field] !== undefined) {
                dataToUpdate[field] = body[field];
            }
        }

        if (Object.keys(dataToUpdate).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const updated = await prisma.offer.update({
            where: { id },
            data: dataToUpdate
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.offer.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
