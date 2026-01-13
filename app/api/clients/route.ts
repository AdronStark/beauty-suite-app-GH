import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        const where: any = { isActive: true };

        if (search) {
            where.OR = [
                { name: { contains: search } }, // SQLite is usually case-insensitive by default in simple queries, but prisma normalization helps
                { erpId: { contains: search } },
                { businessName: { contains: search } }
            ];
        }

        const clients = await prisma.client.findMany({
            where,
            orderBy: { name: 'asc' },
            take: 100 // Limit for performance dropdowns
        });

        return NextResponse.json(clients);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, businessName, erpId, contactInfo, address, notes } = body;

        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        // Check duplicates? (Constraint will handle erpId unique)
        // If Manual, erpId might be empty.

        const newClient = await prisma.client.create({
            data: {
                name,
                businessName,
                erpId,
                address,
                contactInfo, // Expecting string or stringified JSON
                notes,
                source: 'MANUAL'
            }
        });

        return NextResponse.json(newClient);
    } catch (e: any) {
        console.error(e);
        // Handle unique constraint error P2002
        if (e.code === 'P2002') return NextResponse.json({ error: 'Client code (ERP ID) already exists' }, { status: 409 });
        return NextResponse.json({ error: e.message || 'Failed to create client' }, { status: 500 });
    }
}
