import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { sourceBriefingId } = body;

        if (!sourceBriefingId) {
            return NextResponse.json({ error: 'sourceBriefingId is required' }, { status: 400 });
        }

        // 1. Find the source briefing
        const source: any = await prisma.briefing.findUnique({
            where: { id: sourceBriefingId }
        });

        if (!source) {
            return NextResponse.json({ error: 'Source briefing not found' }, { status: 404 });
        }

        // 2. Find the maximum revision for this code using count of existing revisions
        const existingRevisions = await prisma.briefing.count({
            where: { code: source.code }
        });

        // Next revision = count of existing (since revision 0 is first)
        const nextRevision = existingRevisions;

        // 3. Create the new revision
        const newBriefing = await (prisma.briefing.create as any)({
            data: {
                code: source.code,
                revision: nextRevision,
                clientName: source.clientName,
                productName: source.productName,
                category: source.category,
                status: 'Borrador',
                responsableComercial: source.responsableComercial,
                responsableTecnico: source.responsableTecnico,
                targetDate: source.targetDate,
                formData: source.formData,
                imagePaths: source.imagePaths,
            }
        });

        return NextResponse.json(newBriefing);
    } catch (error: any) {
        console.error('[BRIEFING_REVISION_ERROR]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
