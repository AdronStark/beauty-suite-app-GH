
import { NextRequest, NextResponse } from 'next/server';
import { getAppConfig, saveAppConfig } from '@/lib/app-config-server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    // Public read or verified?
    // Let's allow read for authenticated users
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = getAppConfig();
    return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        // Basic validation?
        if (!Array.isArray(body)) {
            return NextResponse.json({ error: 'Invalid config format' }, { status: 400 });
        }

        const success = saveAppConfig(body);
        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
        }
    } catch (e) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
