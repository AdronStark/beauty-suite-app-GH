import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// One-time migration endpoint to convert Draft -> Borrador
export async function POST() {
    try {
        const result = await prisma.briefing.updateMany({
            where: { status: 'Draft' },
            data: { status: 'Borrador' }
        });

        return NextResponse.json({
            success: true,
            message: `Updated ${result.count} briefings from "Draft" to "Borrador"`
        });
    } catch (error: any) {
        console.error('[MIGRATION_ERROR]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
