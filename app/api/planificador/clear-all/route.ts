
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST() {
    try {
        await prisma.productionBlock.deleteMany({});
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error clearing all blocks:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
