
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const offers = await prisma.offer.findMany({
        select: {
            id: true,
            status: true,
            resultsSummary: true,
            probability: true
        }
    });

    console.log(`Total Offers: ${offers.length}`);

    // --- CRM Logic ---
    let crmWeighted = 0;
    offers.forEach(o => {
        let val = 0;
        try {
            const summary = JSON.parse(o.resultsSummary || '{}');
            val = parseFloat(summary.totalValue || '0');
        } catch (e) { }

        // CRM: Borrador, Pendiente de validar, Validada, Enviada
        if (['Borrador', 'Pendiente de validar', 'Validada', 'Enviada'].includes(o.status)) {
            const prob = o.probability || 0;
            crmWeighted += val * (prob / 100);
        }
    });

    // --- Dashboard Logic (Current) ---
    let dashWeighted = 0;
    offers.forEach(o => {
        let val = 0;
        try {
            const summary = JSON.parse(o.resultsSummary || '{}');
            val = parseFloat(summary.totalValue || '0');
        } catch (e) { }

        const statusUpper = o.status.toUpperCase();
        const isWon = statusUpper === 'ADJUDICADA' || statusUpper === 'ACEPTADA' || statusUpper === 'GANADA';
        const isLost = statusUpper === 'RECHAZADA' || statusUpper === 'PERDIDA';
        // Current Dashboard: Excludes Borrador
        const isPipeline = !isWon && !isLost && statusUpper !== 'BORRADOR';

        if (isPipeline) {
            const prob = o.probability || 50; // Current Default 50
            dashWeighted += val * (prob / 100);
        }
    });

    // --- Dashboard Logic (Proposed Match) ---
    let proposedWeighted = 0;
    offers.forEach(o => {
        let val = 0;
        try {
            const summary = JSON.parse(o.resultsSummary || '{}');
            val = parseFloat(summary.totalValue || '0');
        } catch (e) { }

        // Include Borrador?
        const statusUpper = o.status.toUpperCase();
        const isWon = statusUpper === 'ADJUDICADA' || statusUpper === 'ACEPTADA' || statusUpper === 'GANADA';
        const isLost = statusUpper === 'RECHAZADA' || statusUpper === 'PERDIDA';

        // Logic: Not Won/Lost (Includes Borrador)
        const isPipeline = !isWon && !isLost;

        if (isPipeline) {
            // Use Probability 0 default to match CRM?
            const prob = o.probability || 0;
            proposedWeighted += val * (prob / 100);
        }
    });

    const output = `
CRM Value: ${crmWeighted.toLocaleString('es-ES')} €
Dashboard Current: ${dashWeighted.toLocaleString('es-ES')} €
Proposed Match: ${proposedWeighted.toLocaleString('es-ES')} €
`;

    fs.writeFileSync('pipeline_comparison.txt', output, 'utf-8');
    console.log('Comparison written to pipeline_comparison.txt');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
