
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'Block ID is required' }, { status: 400 });
        }

        // 1. Fetch the block
        const block = await prisma.productionBlock.findUnique({ where: { id } });
        if (!block) {
            return NextResponse.json({ error: 'Block not found' }, { status: 404 });
        }

        // 2. Fetch Config for Batch Limit (optional, default 2000)
        const configItem = await prisma.configuration.findUnique({ where: { key: 'ap_batchLimit' } });
        const BATCH_LIMIT = configItem ? parseFloat(configItem.value) : 2000;

        if (block.units <= BATCH_LIMIT) {
            return NextResponse.json({ error: `Block units (${block.units}) are within limit (${BATCH_LIMIT}). No split needed.` }, { status: 400 });
        }

        // 3. Calculate Splits
        const subBatches = [];
        const parts = Math.ceil(block.units / BATCH_LIMIT);

        for (let i = 1; i <= parts; i++) {
            subBatches.push({
                units: Math.min(block.units - ((i - 1) * BATCH_LIMIT), BATCH_LIMIT),
                label: `T${i}`
            });
        }

        // 4. Transaction: Create New + Delete Old
        await prisma.$transaction(async (tx) => {
            // Create sub-batches
            for (const batch of subBatches) {
                await tx.productionBlock.create({
                    data: {
                        articleCode: block.articleCode,
                        articleDesc: block.articleDesc,
                        clientName: block.clientName,
                        orderNumber: block.orderNumber,
                        units: batch.units,
                        status: 'PENDING', // Send to pending
                        deadline: block.deadline,
                        orderDate: block.orderDate,
                        batchLabel: batch.label,
                        unitsOrdered: block.unitsOrdered,
                        unitsServed: block.unitsServed,
                        unitsPending: block.unitsPending,
                        erpId: block.erpId ? `${block.erpId}-${batch.label}` : undefined // Append suffix to avoid unique constraint if erpId exists
                    }
                });
            }
            // Delete original
            await tx.productionBlock.delete({ where: { id: block.id } });
        });

        return NextResponse.json({ success: true, parts });

    } catch (error: any) {
        console.error('Split Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to split block' }, { status: 500 });
    }
}
