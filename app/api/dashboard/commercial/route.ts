import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const offers = await prisma.offer.findMany({
            where: {
                status: { not: 'Archived' } // Exclude archived if strictly needed
            },
            select: {
                id: true,
                code: true,
                client: true,
                status: true,
                resultsSummary: true,
                probability: true, // Int 0-100
                expectedCloseDate: true,
                createdAt: true,
                wonAt: true,
                // We might need these for margin calc if not in summary
                // inputData: true 
            }
        });

        // 1. Initial Accumulators
        let totalPipelineValue = 0;
        let totalPipelineWeighted = 0;
        let totalWonValue = 0;
        let totalLostValue = 0;
        let totalWonCount = 0;
        let totalLostCount = 0;
        let totalMarginValue = 0; // Sum of (Value * Margin%) to get weighted average

        // Arrays for charts
        const scatterData: any[] = [];
        const monthlyForecast: Record<string, { won: number, pipeline: number }> = {};
        const clientAggregates: Record<string, number> = {};

        // Helper to get Month Key (YYYY-MM)
        const getMonthKey = (date: Date) => {
            return date.toISOString().substring(0, 7); // "2024-01"
        };

        const now = new Date();

        offers.forEach(offer => {
            // Parse Financials
            let value = 0;
            let margin = 0; // percentage 0-100

            try {
                if (offer.resultsSummary) {
                    const summary = JSON.parse(offer.resultsSummary);
                    // Try to get total Value
                    if (summary.totalValue) {
                        value = parseFloat(summary.totalValue);
                    } else if (summary.salePrice && summary.units) {
                        value = parseFloat(summary.salePrice) * parseFloat(summary.units);
                    }

                    // Try to get Margin
                    if (summary.margin) {
                        margin = parseFloat(summary.margin);
                    } else {
                        const price = parseFloat(summary.salePrice || '0');
                        // Prefer directCost, fallback to total_cost_unit, but fail safe if price equals cost (often mislabeled)
                        let cost = parseFloat(summary.directCost || summary.total_cost_unit || '0');

                        // If cost equals price and directCost was missing, it might be a data error where total_cost_unit IS the price.
                        // But if we have directCost, use it.
                        if (summary.directCost) {
                            cost = parseFloat(summary.directCost);
                        }

                        if (price > 0 && cost < price) {
                            margin = ((price - cost) / price) * 100;
                        }
                    }
                }
            } catch (e) {
                // Ignore parsing errors, assume 0
            }

            // Normalize Status
            // Assuming "Adjudicada", "Aceptada" -> WON
            // "Rechazada", "Perdida" -> LOST
            // Others -> PIPELINE (Including Drafts to match CRM logic)
            const statusUpper = offer.status.toUpperCase();
            const isWon = statusUpper === 'ADJUDICADA' || statusUpper === 'ACEPTADA' || statusUpper === 'GANADA';
            const isLost = statusUpper === 'RECHAZADA' || statusUpper === 'PERDIDA';
            const isPipeline = !isWon && !isLost; // CRM includes 'BORRADOR'

            // --- Aggregations ---

            // 1. Conversion Rates (Won vs Lost)
            if (isWon) {
                totalWonValue += value;
                totalWonCount++;
                totalMarginValue += (value * margin); // Weighted margin accumulator
            } else if (isLost) {
                totalLostValue += value;
                totalLostCount++;
            }

            // 2. Pipeline (Active Offers)
            if (isPipeline) {
                totalPipelineValue += value;
                // CRM Logic: Default to 0 if not set (only count if explicitly set)
                const prob = offer.probability || 0;
                totalPipelineWeighted += value * (prob / 100);
            }

            // 3. Scatter Plot (All Active/Won High Value offers?)
            // Let's include all non-draft offers with value > 0
            if (value > 0 && statusUpper !== 'BORRADOR') {
                scatterData.push({
                    x: value,
                    y: margin,
                    name: offer.client,
                    code: offer.code || 'N/A',
                    status: offer.status
                });
            }

            // 4. Monthly Forecast
            // If WON, use wonAt or createdAt if missing (approx)
            // If PIPELINE, use expectedCloseDate or createdAt + 30d
            let dateKey = '';
            if (isWon) {
                const date = offer.wonAt || offer.createdAt; // Fallback
                dateKey = getMonthKey(date);
                if (!monthlyForecast[dateKey]) monthlyForecast[dateKey] = { won: 0, pipeline: 0 };
                monthlyForecast[dateKey].won += value;
            } else if (isPipeline) {
                let date = offer.expectedCloseDate;
                if (!date) {
                    // Default fallback: Created + 1 month
                    const d = new Date(offer.createdAt);
                    d.setMonth(d.getMonth() + 1);
                    date = d;
                }
                dateKey = getMonthKey(date);
                if (!monthlyForecast[dateKey]) monthlyForecast[dateKey] = { won: 0, pipeline: 0 };
                // Add WEIGHTED value to forecast? Or raw? Usually Weighted for realistic forecast
                const prob = offer.probability || 50;
                monthlyForecast[dateKey].pipeline += value * (prob / 100);
            }

            // 5. Client Aggregates (Top Clients)
            // Active pipeline + Won (potential business)
            if (value > 0 && (isWon || isPipeline)) {
                if (!clientAggregates[offer.client]) clientAggregates[offer.client] = 0;
                clientAggregates[offer.client] += value;
            }
        });

        // Final Calculations
        const avgMargin = totalWonValue > 0 ? (totalMarginValue / totalWonValue) : 0;

        const conversionRateValue = (totalWonValue + totalLostValue) > 0
            ? (totalWonValue / (totalWonValue + totalLostValue)) * 100
            : 0;

        const conversionRateCount = (totalWonCount + totalLostCount) > 0
            ? (totalWonCount / (totalWonCount + totalLostCount)) * 100
            : 0;

        // Sort Top Clients
        const topClients = Object.entries(clientAggregates)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5

        // Sort Forecast Keys
        // We only want recent past + future
        const sortedMonths = Object.keys(monthlyForecast).sort().slice(-12); // Last 12 periods active? 
        // Better: Filter for "Current Year" or "Last 3 months + Next 9 months"
        // For simplicity, let's just return the sorted keys
        const forecastChart = sortedMonths.map(key => ({
            month: key,
            won: monthlyForecast[key].won,
            pipeline: monthlyForecast[key].pipeline
        }));

        return NextResponse.json({
            kpis: {
                weightedPipeline: totalPipelineWeighted,
                wonValue: totalWonValue,
                avgMargin: avgMargin,
                conversionRateValue,
                conversionRateCount
            },
            scatterData,
            forecastChart,
            topClients
        });

    } catch (error) {
        console.error('Dashboard API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
