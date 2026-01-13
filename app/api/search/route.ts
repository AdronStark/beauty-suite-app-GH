
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query || query.length < 3) {
            return NextResponse.json([]);
        }

        const q = query.toLowerCase();

        // 1. Search Briefings
        const briefings = await prisma.briefing.findMany({
            where: {
                OR: [
                    { productName: { contains: q } },
                    { clientName: { contains: q } },
                    // @ts-ignore
                    { code: { contains: q } }
                ]
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            // @ts-ignore
            select: { id: true, code: true, productName: true, clientName: true }
        });

        // 2. Search Offers
        const offers = await prisma.offer.findMany({
            where: {
                OR: [
                    { product: { contains: q } },
                    { client: { contains: q } },
                    { code: { contains: q } }
                ]
            },
            take: 5,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, code: true, product: true, client: true, status: true }
        });

        // 3. Search Production Blocks (Planner)
        const blocks = await prisma.productionBlock.findMany({
            where: {
                OR: [
                    { articleDesc: { contains: q } },
                    { articleCode: { contains: q } },
                    { orderNumber: { contains: q } }
                ]
            },
            take: 5,
            orderBy: { plannedDate: 'desc' },
            select: { id: true, articleDesc: true, articleCode: true, plannedDate: true, orderNumber: true }
        });

        // Format results
        const results = [
            ...briefings.map(b => ({
                type: 'BRIEFING',
                id: b.id,
                title: b.productName,
                // @ts-ignore
                subtitle: `${b.code} - ${b.clientName}`,
                data: b
            })),
            ...offers.map(o => ({
                type: 'OFFER',
                id: o.id,
                title: o.product,
                subtitle: `${o.code || 'Borrador'} - ${o.client} (${o.status})`,
                data: o
            })),
            ...blocks.map(b => ({
                type: 'BLOCK',
                id: b.id,
                title: b.articleDesc,
                subtitle: `OF: ${b.orderNumber} - ${b.plannedDate ? new Date(b.plannedDate).toLocaleDateString() : 'Sin Fecha'}`,
                data: b
            }))
        ];

        return NextResponse.json(results);

    } catch (error: any) {
        console.error("Search API Error:", error);
        return NextResponse.json({ error: "Failed to search" }, { status: 500 });
    }
}
