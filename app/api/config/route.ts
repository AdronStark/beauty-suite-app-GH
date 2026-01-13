
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 });

    const config = await prisma.configuration.findUnique({
        where: { key }
    });

    return NextResponse.json(config || { key, value: null });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { key, value } = body;

        const config = await prisma.configuration.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });

        return NextResponse.json(config);
    } catch (e) {
        return NextResponse.json({ error: 'Error saving config' }, { status: 500 });
    }
}
