import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';
import { handleApiError } from '@/lib/api-auth';

// DELETE with manual cascade - Requires ADMIN or MANAGER
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check
    // @ts-ignore
    const userRole = session.user.role;
    if (!['ADMIN', 'MANAGER'].includes(userRole)) {
        return NextResponse.json({ error: 'Forbidden: Only ADMIN or MANAGER can delete formulas' }, { status: 403 });
    }

    const { id } = await params;

    try {
        // Get formula info for audit log
        const formula = await prisma.formula.findUnique({ where: { id }, select: { name: true, code: true } });

        // Use transaction to ensure all related records are deleted
        await prisma.$transaction(async (tx) => {
            await tx.stabilityTest.deleteMany({ where: { formulaId: id } });
            await tx.sample.deleteMany({ where: { formulaId: id } });
            await tx.formula.delete({ where: { id } });
        });

        console.log(`[AUDIT] Formula ${formula?.code || formula?.name || id} deleted by user: ${session.user.name}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error, 'Delete Formula');
    }
}

