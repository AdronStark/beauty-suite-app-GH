import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { isWeekend } from 'date-fns';

export async function GET() {
    try {
        // 1. Fetch all planned blocks
        const plannedBlocks = await prisma.productionBlock.findMany({
            where: {
                status: 'PLANNED',
                plannedDate: { not: null }
            }
        });

        // 2. Fetch all holidays
        const holidays = await prisma.holiday.findMany();
        const holidayDates = new Set(holidays.map((h: any) => h.date.toISOString().split('T')[0]));

        // 3. Identify conflicts
        const conflicts = plannedBlocks.filter((block: any) => {
            const date = new Date(block.plannedDate!);
            const dateStr = date.toISOString().split('T')[0];

            return isWeekend(date) || holidayDates.has(dateStr);
        });

        return NextResponse.json({
            count: conflicts.length,
            conflicts: conflicts.map(c => ({
                id: c.id,
                articleCode: c.articleCode,
                orderNumber: c.orderNumber,
                plannedDate: c.plannedDate,
                reason: isWeekend(new Date(c.plannedDate!)) ? 'Fin de semana' : 'Día festivo'
            }))
        });
    } catch (error) {
        console.error("Error detecting conflicts:", error);
        return NextResponse.json({ error: 'Failed to detect conflicts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { ids } = await request.json();

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Invalid IDs provided' }, { status: 400 });
        }

        // Move blocks back to pending
        await prisma.productionBlock.updateMany({
            where: {
                id: { in: ids }
            },
            data: {
                status: 'PENDING',
                plannedDate: null,
                plannedReactor: null,
                plannedShift: null
            }
        });

        return NextResponse.json({ success: true, resolved: ids.length });
    } catch (error) {
        console.error("Error resolving conflicts:", error);
        return NextResponse.json({ error: 'Failed to resolve conflicts' }, { status: 500 });
    }
}
