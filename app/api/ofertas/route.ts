import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
    try {
        const items = await prisma.offer.findMany({
            orderBy: { updatedAt: 'desc' }
        });
        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

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
                product: body.product || 'Nuevo Producto',
                status: 'Borrador',
                inputData: typeof body.inputData === 'string' ? body.inputData : JSON.stringify(body.inputData || {}),
                resultsSummary: typeof body.resultsSummary === 'string' ? body.resultsSummary : JSON.stringify(body.resultsSummary || {}),
                responsableComercial: body.responsableComercial,
                responsableTecnico: body.responsableTecnico,
                fechaEntrega: body.fechaEntrega ? new Date(body.fechaEntrega) : null,
                briefingId: body.briefingId
            }
        });
        return NextResponse.json(item);
    } catch (error: any) {
        console.error("Create Offer Error:", error);
        return NextResponse.json({ error: 'Failed to create offer', details: error.message }, { status: 500 });
    }
}
