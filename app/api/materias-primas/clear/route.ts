import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();
        // Ideally add stricter role checking here (e.g. only Admin or specific roles)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Deletes all records from the RawMaterialOrder table
        await prisma.rawMaterialOrder.deleteMany({});

        return NextResponse.json({ success: true, message: 'All data cleared' });
    } catch (e) {
        console.error("Error clearing raw materials:", e);
        return NextResponse.json({ error: 'Failed to clear data' }, { status: 500 });
    }
}
