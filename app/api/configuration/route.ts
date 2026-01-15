import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

export async function GET() {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const configs = await prisma.configuration.findMany();
        // Convert array [{key: 'k', value: 'v'}] to object {k: v}
        const configMap = configs.reduce((acc: any, curr) => ({
            ...acc,
            [curr.key]: curr.value
        }), {});

        return NextResponse.json(configMap);
    } catch (error) {
        console.error('Error fetching config:', error);
        return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await request.json();
        // Body should be an object { key: value, key2: value2 }

        // Upsert each key
        const operations = Object.entries(body).map(([key, value]) =>
            prisma.configuration.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) }
            })
        );

        await prisma.$transaction(operations);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving config:', error);
        return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
    }
}
