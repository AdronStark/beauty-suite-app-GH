import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { ids } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        // Manual Cascade Delete in Transaction
        await prisma.$transaction(async (tx) => {
            // 1. Delete dependent Stability Tests
            await tx.stabilityTest.deleteMany({
                where: { formulaId: { in: ids } }
            });

            // 2. Delete dependent Samples
            await tx.sample.deleteMany({
                where: { formulaId: { in: ids } }
            });

            // 3. Delete Formulas
            await tx.formula.deleteMany({
                where: { id: { in: ids } }
            });
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting formulas:', error);
        return NextResponse.json({ error: 'Failed to delete formulas' }, { status: 500 });
    }
}
