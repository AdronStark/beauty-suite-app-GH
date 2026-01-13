
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        await prisma.reactorMaintenance.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete maintenance' }, { status: 500 });
    }
}
