import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
    try {
        const items = await prisma.briefing.findMany({
            orderBy: { updatedAt: 'desc' }
        });
        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch briefings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Minimal validation
        if (!body.clientName || !body.productName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Generate Auto Code (B + YY + xxxx)
        const year = new Date().getFullYear().toString().slice(-2); // "25"
        const prefix = `B${year}`; // "B25"

        // Find last briefing for this year
        const lastBriefing = await prisma.briefing.findFirst({
            where: {
                code: { startsWith: prefix }
            },
            orderBy: { code: 'desc' }
        });

        let newCode = `${prefix}0001`; // Default
        if (lastBriefing && lastBriefing.code) {
            const sequenceStr = lastBriefing.code.slice(3); // Remove "B25"
            const sequence = parseInt(sequenceStr);
            if (!isNaN(sequence)) {
                newCode = `${prefix}${(sequence + 1).toString().padStart(4, '0')}`;
            }
        }

        const item = await (prisma.briefing.create as any)({
            data: {
                code: newCode,
                revision: 0,
                clientName: body.clientName,
                productName: body.productName,
                category: body.category || 'General',
                responsableComercial: body.responsableComercial || null,
                responsableTecnico: body.responsableTecnico || null,
                targetDate: body.targetDate ? new Date(body.targetDate) : null,
                status: 'Borrador',
                formData: JSON.stringify(body)
            }
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("Create Briefing Error:", error);
        return NextResponse.json(
            { error: 'Failed to create briefing' },
            { status: 500 }
        );
    }
}
