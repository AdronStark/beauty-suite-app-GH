import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';
import { handleApiError } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check - only ADMIN or MANAGER can bulk delete
    // @ts-ignore
    const userRole = session.user.role;
    if (!['ADMIN', 'MANAGER'].includes(userRole)) {
        return NextResponse.json({ error: 'Forbidden: Only ADMIN or MANAGER can delete briefings' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { ids } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        // Delete multiple briefings
        const result = await prisma.briefing.deleteMany({
            where: {
                id: { in: ids }
            }
        });

        console.log(`[AUDIT] ${result.count} briefings deleted by user: ${session.user.name}`);
        return NextResponse.json({
            success: true,
            count: result.count
        });

    } catch (error) {
        return handleApiError(error, 'Bulk Delete Briefings');
    }
}

