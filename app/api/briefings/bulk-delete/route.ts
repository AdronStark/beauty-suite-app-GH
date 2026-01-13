import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { ids } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        // Delete multiple briefings
        // Note: The schema change to SetNull on delete handles the relations to Offer/Formula
        const result = await prisma.briefing.deleteMany({
            where: {
                id: { in: ids }
            }
        });

        return NextResponse.json({
            success: true,
            count: result.count
        });

    } catch (error) {
        console.error('Error deleting briefings:', error);
        return NextResponse.json({ error: 'Failed to delete briefings' }, { status: 500 });
    }
}
