import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';
import { handleApiError } from '@/lib/api-auth';

export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Role check - only ADMIN or MANAGER can clear all data
        // @ts-ignore
        const userRole = session.user.role;
        if (!['ADMIN', 'MANAGER'].includes(userRole)) {
            return NextResponse.json({ error: 'Forbidden: Only ADMIN or MANAGER can clear data' }, { status: 403 });
        }

        // Deletes all records from the RawMaterialOrder table
        await prisma.rawMaterialOrder.deleteMany({});

        console.log(`[AUDIT] All raw material orders cleared by user: ${session.user.name}`);
        return NextResponse.json({ success: true, message: 'All data cleared' });
    } catch (e) {
        return handleApiError(e, 'Clear Raw Materials');
    }
}

