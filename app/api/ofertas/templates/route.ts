import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
    try {
        const templates = await prisma.offerTemplate.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(templates);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validation
        if (!body.name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const template = await prisma.offerTemplate.create({
            data: {
                name: body.name,
                category: body.category,
                inputData: typeof body.inputData === 'string' ? body.inputData : JSON.stringify(body.inputData || {})
            }
        });

        return NextResponse.json(template);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Template with this name already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }
}
