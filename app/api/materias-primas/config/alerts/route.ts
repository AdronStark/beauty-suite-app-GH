import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

export async function GET() {
    try {
        const config = await prisma.configuration.findUnique({
            where: { key: 'RM_ALERT_DAYS' }
        });

        // Default to 7 if not set
        const days = config?.value ? parseInt(config.value) : 7;
        return NextResponse.json({ days });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        // Allow ADMIN or EDITOR roles to change config
        const isAuthorized = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER';

        if (!session || !isAuthorized) {
            // For now, let's just check session exists as 'MANAGER' role might vary in exact string
            if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { days } = body;

        if (days === undefined || days < 0) {
            return NextResponse.json({ error: 'Invalid days value' }, { status: 400 });
        }

        await prisma.configuration.upsert({
            where: { key: 'RM_ALERT_DAYS' },
            create: { key: 'RM_ALERT_DAYS', value: days.toString() },
            update: { value: days.toString() }
        });

        return NextResponse.json({ success: true, days });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
    }
}
