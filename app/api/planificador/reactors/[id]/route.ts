import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const body = await request.json();
        const { name, description, capacity, dailyTarget, plant } = body;

        const updated = await prisma.reactor.update({
            where: { id: params.id },
            data: {
                name,
                description,
                capacity: Number(capacity),
                dailyTarget: Number(dailyTarget),
                plant
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update reactor' }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        await prisma.reactor.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete reactor' }, { status: 500 });
    }
}
