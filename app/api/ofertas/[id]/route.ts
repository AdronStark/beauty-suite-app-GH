import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuth, handleApiError } from '@/lib/api-auth';
import { auth } from '@/auth';

// GET - Any authenticated user
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const offer = await prisma.offer.findUnique({
            where: { id },
            include: { items: { orderBy: { order: 'asc' } } }
        });

        if (!offer) {
            return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        }

        return NextResponse.json(offer);
    } catch (error) {
        return handleApiError(error, 'Get Offer');
    }
}

// PUT - Any authenticated user
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();

        // Status Logic for PUT
        const dataToUpdate: any = {
            client: body.client,
            description: body.description,
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
                history.push({ status: body.status, date: now.toISOString(), user: session.user.name });
                dataToUpdate.statusHistory = JSON.stringify(history);
            } catch (e) { console.error("History error", e); }
        }

        // Multi-product Upsert Logic
        if (body.items && Array.isArray(body.items)) {
            // Transaction to ensure data consistency
            await prisma.$transaction(async (tx) => {
                // 1. Update main offer fields
                await tx.offer.update({
                    where: { id },
                    data: dataToUpdate
                });

                // 2. Delete missing items FIRST
                const keepIds = body.items
                    .filter((i: any) => i.id && !i.id.startsWith('temp_'))
                    .map((i: any) => i.id);

                await tx.offerItem.deleteMany({
                    where: {
                        offerId: id,
                        id: { notIn: keepIds }
                    }
                });

                // 3. Handle Items Upsert
                for (const item of body.items) {
                    if (item.id && !item.id.startsWith('temp_')) {
                        // Update existing
                        await tx.offerItem.update({
                            where: { id: item.id },
                            data: {
                                productName: item.productName,
                                inputData: typeof item.inputData === 'string' ? item.inputData : JSON.stringify(item.inputData),
                                resultsSummary: typeof item.resultsSummary === 'string' ? item.resultsSummary : JSON.stringify(item.resultsSummary),
                                order: item.order
                            }
                        });
                    } else {
                        // Create new
                        await tx.offerItem.create({
                            data: {
                                offerId: id,
                                productName: item.productName || 'Nuevo',
                                inputData: typeof item.inputData === 'string' ? item.inputData : JSON.stringify(item.inputData || {}),
                                resultsSummary: typeof item.resultsSummary === 'string' ? item.resultsSummary : JSON.stringify(item.resultsSummary || {}),
                                order: item.order
                            }
                        });
                    }
                }
            });

            // Return fresh data
            const final = await prisma.offer.findUnique({
                where: { id },
                include: { items: { orderBy: { order: 'asc' } } }
            });
            return NextResponse.json(final);

        } else {
            // Legacy or partial update (just status etc)
            const updated = await prisma.offer.update({
                where: { id },
                data: dataToUpdate,
                include: { items: { orderBy: { order: 'asc' } } }
            });
            return NextResponse.json(updated);
        }
    } catch (error) {
        return handleApiError(error, 'Update Offer');
    }
}

// PATCH - Any authenticated user
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
            'description'
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
                const current = await prisma.offer.findUnique({
                    where: { id },
                    select: { statusHistory: true }
                });

                const history = current?.statusHistory ? JSON.parse(current.statusHistory) : [];
                history.push({
                    status: body.status,
                    date: now.toISOString(),
                    user: session.user.name
                });
                dataToUpdate.statusHistory = JSON.stringify(history);
            } catch (e) {
                console.error("Failed to update status history", e);
            }
        }

        for (const field of allowedFields) {
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
        return handleApiError(error, 'Patch Offer');
    }
}

// DELETE - Requires ADMIN or MANAGER role
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // @ts-ignore
    const userRole = session.user.role;
    if (!['ADMIN', 'MANAGER'].includes(userRole)) {
        return NextResponse.json({ error: 'Forbidden: Only ADMIN or MANAGER can delete offers' }, { status: 403 });
    }

    try {
        const { id } = await params;

        // Get offer info for audit log before deletion
        const offer = await prisma.offer.findUnique({ where: { id }, select: { code: true } });

        await prisma.offer.delete({
            where: { id }
        });

        console.log(`[AUDIT] Offer ${offer?.code || id} deleted by user: ${session.user.name}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error, 'Delete Offer');
    }
}

