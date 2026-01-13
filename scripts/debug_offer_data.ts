
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const offers = await prisma.offer.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            code: true,
            status: true,
            resultsSummary: true
        }
    });

    const output = offers.map(offer => {
        let summary: any = {};
        try {
            summary = JSON.parse(offer.resultsSummary || '{}');
        } catch (e) {
            summary = { error: 'Invalid JSON' };
        }

        return {
            id: offer.id,
            code: offer.code,
            status: offer.status,
            summaryFields: {
                margin: summary.margin,
                salePrice: summary.salePrice,
                totalValue: summary.totalValue,
                total_cost_unit: summary.total_cost_unit,
                totalCost: summary.totalCost, // Checking alternative names
                units: summary.units
            },
            rawSummary: offer.resultsSummary
        };
    });

    fs.writeFileSync('debug_output_clean.json', JSON.stringify(output, null, 2), 'utf-8');
    console.log('Wrote debug data to debug_output_clean.json');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
