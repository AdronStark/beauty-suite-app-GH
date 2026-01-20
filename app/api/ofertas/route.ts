import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuth, handleApiError } from '@/lib/api-auth';
import { OfferCreateSchema } from '@/lib/schemas';

export const GET = withAuth(async (req, ctx, session) => {
    try {
        const items = await prisma.offer.findMany({
            include: { items: { orderBy: { order: 'asc' } } },
            orderBy: { updatedAt: 'desc' }
        });
        return NextResponse.json(items);
    } catch (error) {
        return handleApiError(error, 'Fetch Offers');
    }
});

export const POST = withAuth(async (req, ctx, session) => {
    try {
        const rawBody = await req.json();

        // Validate input
        const parseResult = OfferCreateSchema.safeParse(rawBody);
        if (!parseResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: parseResult.error.flatten()
            }, { status: 400 });
        }
        const body = parseResult.data;

        // Generate Auto Code (Q + YY + xxxx)
        const year = new Date().getFullYear().toString().slice(-2); // "25"
        const prefix = `Q${year}`; // "Q25"

        // Find last offer for this year
        const lastOffer = await prisma.offer.findFirst({
            where: {
                code: { startsWith: prefix }
            },
            orderBy: { code: 'desc' }
        });

        let newCode = `${prefix}0001`; // Default if none exists
        if (lastOffer && lastOffer.code) {
            const sequenceStr = lastOffer.code.slice(3); // Remove "Q25"
            const sequence = parseInt(sequenceStr);
            if (!isNaN(sequence)) {
                newCode = `${prefix}${(sequence + 1).toString().padStart(4, '0')}`;
            }
        }

        // Create new offer
        const item = await prisma.offer.create({
            data: {
                code: newCode,
                client: body.client || 'Cliente Sin Nombre',
                description: body.description || 'Nueva Oferta',
                status: 'Borrador',
                inputData: '{}', // Legacy: Empty
                resultsSummary: '{}', // Legacy: Empty
                responsableComercial: body.responsableComercial,
                responsableTecnico: body.responsableTecnico,
                fechaEntrega: body.fechaEntrega ? new Date(body.fechaEntrega) : null,
                briefingId: body.briefingId,
                // Create the first item
                items: {
                    create: {
                        productName: 'Producto 1', // Default for first item
                        inputData: typeof body.inputData === 'string' ? body.inputData : JSON.stringify(body.inputData || {}),
                        resultsSummary: typeof body.resultsSummary === 'string' ? body.resultsSummary : JSON.stringify(body.resultsSummary || {}),
                        order: 0
                    }
                }
            },
            include: { items: true }
        });

        console.log(`[AUDIT] Offer ${newCode} created by user: ${session.user?.name || 'unknown'}`);
        return NextResponse.json(item);
    } catch (error) {
        return handleApiError(error, 'Create Offer');
    }
});

