import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuth, handleApiError } from '@/lib/api-auth';

export const POST = withAuth(async (req, ctx, session) => {
    try {
        const result = await prisma.productionBlock.deleteMany({
            where: { status: 'PENDING' }
        });

        console.log(`[AUDIT] ${result.count} pending blocks deleted by user: ${session.user?.name || 'unknown'}`);
        return NextResponse.json({ success: true, count: result.count });

    } catch (error) {
        return handleApiError(error, 'Clear Pending Blocks');
    }
}, { roles: ['ADMIN', 'MANAGER'] });

