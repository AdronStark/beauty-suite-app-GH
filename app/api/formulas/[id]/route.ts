import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

// DELETE with manual cascade
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Use transaction to ensure all related records are deleted or nothing is
        await prisma.$transaction(async (tx) => {
            // 1. Delete dependent Stability Tests
            await tx.stabilityTest.deleteMany({
                where: { formulaId: id }
            });

            // 2. Delete dependent Samples
            await tx.sample.deleteMany({
                where: { formulaId: id }
            });

            // 3. Delete dependent records in relations (if any other implicit ones exist, check schema)
            // Currently only StabilityTest and Sample have FK to Formula.
            // Note: Briefing relation is Formula -> Briefing (optional), so deleting Formula is fine.

            // 4. Finally delete the Formula
            await tx.formula.delete({
                where: { id }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting formula:', error);
        return NextResponse.json({ error: 'Failed to delete formula. It might being used by other resources.' }, { status: 500 });
    }
}
