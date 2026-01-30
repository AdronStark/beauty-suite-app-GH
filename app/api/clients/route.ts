import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuth, handleApiError } from '@/lib/api-auth';

export const GET = withAuth(async (req, ctx, session) => {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');

        const where: any = { isActive: true };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { erpId: { contains: search, mode: 'insensitive' } },
                { businessName: { contains: search, mode: 'insensitive' } }
            ];
        }

        const clients = await prisma.client.findMany({
            where,
            orderBy: { name: 'asc' },
            take: 100
        });

        return NextResponse.json(clients);
    } catch (e) {
        return handleApiError(e, 'Fetch Clients');
    }
});

export const POST = withAuth(async (req, ctx, session) => {
    try {
        const body = await req.json();
        const { name, businessName, erpId, contactInfo, address, notes } = body;

        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const newClient = await prisma.client.create({
            data: {
                name,
                businessName,
                erpId,
                address,
                contactInfo,
                notes,
                source: 'MANUAL'
            }
        });

        console.log(`[AUDIT] Client ${name} created by user: ${session.user?.name || 'unknown'}`);
        return NextResponse.json(newClient);
    } catch (e: any) {
        if (e.code === 'P2002') return NextResponse.json({ error: 'Client code (ERP ID) already exists' }, { status: 409 });
        return handleApiError(e, 'Create Client');
    }
});

