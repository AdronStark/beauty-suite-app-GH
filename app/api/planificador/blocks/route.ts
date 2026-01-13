
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, realKg, realDuration, operatorNotes, status } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing block ID' }, { status: 400 });
        }

        const updatedBlock = await prisma.productionBlock.update({
            where: { id },
            data: {
                realKg: realKg ? parseFloat(realKg) : undefined,
                realDuration: realDuration ? parseInt(realDuration) : undefined,
                operatorNotes: operatorNotes || undefined,
                status: status || undefined
            }
        });

        return NextResponse.json(updatedBlock);
    } catch (error) {
        console.error("Error updating production block:", error);
        return NextResponse.json(
            { error: 'Failed to update block' },
            { status: 500 }
        );
    }
}
