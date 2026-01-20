import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuth, handleApiError } from '@/lib/api-auth';

export const GET = withAuth(async (req, ctx, session) => {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 });

    const config = await prisma.configuration.findUnique({
        where: { key }
    });

    return NextResponse.json(config || { key, value: null });
});

// Only ADMIN can modify configuration
export const POST = withAuth(async (req, ctx, session) => {
    try {
        const body = await req.json();
        const { key, value } = body;

        if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 });

        const config = await prisma.configuration.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });

        console.log(`[AUDIT] Config ${key} updated by user: ${session.user?.name || 'unknown'}`);
        return NextResponse.json(config);
    } catch (e) {
        return handleApiError(e, 'Save Config');
    }
}, { roles: ['ADMIN'] });

