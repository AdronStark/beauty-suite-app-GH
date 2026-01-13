
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
    try {
        const { sourceOfferId } = await request.json();

        if (!sourceOfferId) {
            return new NextResponse("Missing sourceOfferId", { status: 400 });
        }

        // 1. Fetch Source Offer
        const sourceOffer = await prisma.offer.findUnique({
            where: { id: sourceOfferId }
        });

        if (!sourceOffer) {
            return new NextResponse("Offer not found", { status: 404 });
        }

        if (!sourceOffer.code) {
            return new NextResponse("Source offer has no code, cannot revise", { status: 400 });
        }

        // 2. Find max revision for this code
        // We look for all offers with this code to find the highest revision
        const existingRevisions = await prisma.offer.findMany({
            where: { code: sourceOffer.code },
            orderBy: { revision: 'desc' },
            take: 1,
            select: { revision: true }
        });

        const currentMaxRev = existingRevisions[0]?.revision || 0;
        const nextRev = currentMaxRev + 1;

        // 3. Prepare Input Data
        // We clone inputData but REMOVE 'snapshotConfig' to force using live rates
        const clonedInput = JSON.parse(sourceOffer.inputData || '{}');
        delete clonedInput.snapshotConfig;

        // 4. Create New Revision
        const newOffer = await prisma.offer.create({
            data: {
                client: sourceOffer.client,
                product: sourceOffer.product,
                status: 'Borrador', // Always start as Draft
                code: sourceOffer.code, // Same code
                revision: nextRev,      // Increment revision
                inputData: JSON.stringify(clonedInput),
                resultsSummary: '{}' // Reset results, force recalc on load
            }
        });

        return NextResponse.json(newOffer);

    } catch (error: any) {
        console.error("Error creating revision:", error);
        return new NextResponse(error.message || "Internal Error", { status: 500 });
    }
}
