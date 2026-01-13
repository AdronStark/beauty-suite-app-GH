import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
    try {
        const result = await prisma.productionBlock.deleteMany({
            where: {
                status: 'PENDING'
            }
        });

        return NextResponse.json({ success: true, count: result.count });

    } catch (error: any) {
        console.error('Clear Pending Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to clear pending tasks' }, { status: 500 });
    }
}
