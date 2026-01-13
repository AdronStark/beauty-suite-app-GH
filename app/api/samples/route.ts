import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { formulaId, recipient, notes } = body;

        if (!formulaId || !recipient) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const sample = await prisma.sample.create({
            data: {
                formulaId,
                recipient,
                status: 'Pending',
                feedback: notes, // Initial notes/feedback
                dateSent: new Date()
            }
        });

        return NextResponse.json(sample);
    } catch (error) {
        console.error("Create Sample Error:", error);
        return NextResponse.json(
            { error: 'Failed to create sample' },
            { status: 500 }
        );
    }
}
