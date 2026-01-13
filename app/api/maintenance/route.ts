
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
    try {
        const maintenance = await prisma.reactorMaintenance.findMany({
            orderBy: { startDate: 'asc' }
        });
        return NextResponse.json(maintenance);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch maintenance' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { reactorId, startDate, endDate, reason } = body;

        const newMaintenance = await prisma.reactorMaintenance.create({
            data: {
                reactorId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason
            }
        });

        return NextResponse.json(newMaintenance);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create maintenance' }, { status: 500 });
    }
}
