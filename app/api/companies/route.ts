import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuth, handleApiError } from '@/lib/api-auth';

export const GET = withAuth(async (req, ctx, session) => {
    try {
        const companies = await prisma.company.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(companies);
    } catch (e) {
        return handleApiError(e, 'Fetch Companies');
    }
});

