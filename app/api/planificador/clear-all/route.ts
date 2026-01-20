
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuth, handleApiError } from '@/lib/api-auth';

export const POST = withAuth(async (req, ctx, session) => {
    try {
        await prisma.productionBlock.deleteMany({});
        console.log(`[AUDIT] All production blocks deleted by user: ${session.user?.name || 'unknown'}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error, 'Clear All Blocks');
    }
}, { roles: ['ADMIN', 'MANAGER'] });
