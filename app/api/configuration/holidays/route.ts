import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
    try {
        const holidays = await prisma.holiday.findMany();
        return NextResponse.json(holidays);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch holidays' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { dates } = await request.json(); // Array of ISO strings

        // Transaction: Delete all and Create new
        await prisma.$transaction([
            prisma.holiday.deleteMany(),
            prisma.holiday.createMany({
                data: dates.map((d: string) => ({
                    date: new Date(d),
                    description: 'Festivo' // Default desc
                }))
            })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving holidays", error);
        return NextResponse.json({ error: 'Failed to save holidays' }, { status: 500 });
    }
}
