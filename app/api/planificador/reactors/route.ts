import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
    try {
        const reactors = await prisma.reactor.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(reactors);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch reactors' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, capacity, dailyTarget, plant } = body;

        const exists = await prisma.reactor.findUnique({ where: { name } });
        if (exists) {
            return NextResponse.json({ error: 'Reactor name already exists' }, { status: 400 });
        }

        const reactor = await prisma.reactor.create({
            data: {
                name,
                description,
                capacity: Number(capacity),
                dailyTarget: Number(dailyTarget),
                plant: plant || 'Coper'
            }
        });

        return NextResponse.json(reactor);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create reactor' }, { status: 500 });
    }
}
