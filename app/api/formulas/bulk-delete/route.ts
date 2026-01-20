import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';
import { handleApiError } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check - only ADMIN or MANAGER can bulk delete
    // @ts-ignore
    const userRole = session.user.role;
    if (!['ADMIN', 'MANAGER'].includes(userRole)) {
        return NextResponse.json({ error: 'Forbidden: Only ADMIN or MANAGER can delete formulas' }, { status: 403 });
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

        console.log(`[AUDIT] ${ids.length} formulas deleted by user: ${session.user.name}`);
        return NextResponse.json({ success: true });

    } catch (error) {
        return handleApiError(error, 'Bulk Delete Formulas');
    }
}

