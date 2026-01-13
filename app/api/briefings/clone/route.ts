
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
    try {
        const { sourceId } = await request.json();

        if (!sourceId) {
            return NextResponse.json({ error: 'Missing sourceId' }, { status: 400 });
        }

        // 1. Get Source
        const source = await prisma.briefing.findUnique({
            where: { id: sourceId }
        });

        if (!source) {
            return NextResponse.json({ error: 'Source briefing not found' }, { status: 404 });
        }

        // 2. Generate New Code
        const year = new Date().getFullYear().toString().slice(-2); // "25"
        const prefix = `B${year}`; // "B25"

        const lastBriefing = await prisma.briefing.findFirst({
            where: {
                // @ts-ignore
                code: { startsWith: prefix }
            },
            // @ts-ignore
            orderBy: { code: 'desc' }
        });

        let newCode = `${prefix}0001`;
        // @ts-ignore
        if (lastBriefing && lastBriefing.code) {
            // @ts-ignore
            const sequenceStr = lastBriefing.code.slice(3);
            const sequence = parseInt(sequenceStr);
            if (!isNaN(sequence)) {
                newCode = `${prefix}${(sequence + 1).toString().padStart(4, '0')}`;
            }
        }

        // 3. Clone Data
        // Parse current form data to update product name internally if needed
        let formDataObj = {};
        try {
            formDataObj = JSON.parse(source.formData);
        } catch (e) { }

        const newProductName = `${source.productName} (Copia)`;

        // Update product name in formData as well
        const newFormData = {
            ...formDataObj,
            productName: newProductName
        };

        const newItem = await prisma.briefing.create({
            data: {
                // @ts-ignore
                code: newCode,
                clientName: source.clientName,
                productName: newProductName,
                category: source.category,
                status: 'Draft', // Always reset to Draft
                formData: JSON.stringify(newFormData),
                imagePaths: source.imagePaths // Keep references if any
            }
        });

        return NextResponse.json(newItem);

    } catch (error) {
        console.error("Clone error:", error);
        return NextResponse.json({ error: 'Failed to clone briefing' }, { status: 500 });
    }
}
