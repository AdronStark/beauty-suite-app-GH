'use server';

import { prisma } from '@/lib/db/prisma';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, startOfDay, endOfDay, isSameDay, subDays, subWeeks, subMonths, startOfMonth, endOfMonth, getISOWeek } from 'date-fns';
import { es } from 'date-fns/locale';


const START_OF_WEEK = 1; // Monday

export async function getProductionDashboardData(period: 'week' | 'month' = 'week') {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Determine Date Range based on Period
    let rangeStart: Date;
    let rangeEnd: Date;


    if (period === 'month') {
        rangeStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
        rangeEnd = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    } else {
        rangeStart = startOfWeek(now, { weekStartsOn: START_OF_WEEK });
        rangeEnd = endOfWeek(now, { weekStartsOn: START_OF_WEEK });
    }

    const weekStart = startOfWeek(now, { weekStartsOn: START_OF_WEEK });
    const weekEnd = endOfWeek(now, { weekStartsOn: START_OF_WEEK });


    // Fetch relevant production blocks
    const blocks = await prisma.productionBlock.findMany({});

    // 1. KPIS GLOBAL
    // Active Blocks Today
    const activeBlocksToday = blocks.filter(b =>
        b.plannedDate &&
        b.plannedDate >= todayStart &&
        b.plannedDate <= todayEnd
    );
    const kgActivityToday = activeBlocksToday.reduce((acc, b) => acc + b.units, 0);

    // OEE Global (Mocked)
    const oeeGlobal = 84.2;

    // Plan Compliance (Weekly)
    // Measure adherence to the internal schedule (Calendar), not just deadlines.
    // Include blocks planned up to TODAY.
    const activeWeekBlocks = blocks.filter(b =>
        b.plannedDate && b.plannedDate >= weekStart && b.plannedDate <= todayEnd
    );
    const producedWeek = activeWeekBlocks.filter(b => b.status === 'PRODUCED').length;
    const totalWeek = activeWeekBlocks.length;
    const compliance = totalWeek > 0 ? (producedWeek / totalWeek) * 100 : 100;

    // Rejects (Mocked)
    const rejects = 1.2;

    // 1.5 NEW KPI: Monthly Manufacturing Forecast
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Define logic barrier: Real until TODAY (inclusive of today's closed blocks?), Planned from TOMORROW? 
    // User said: "desde el dia de hoy hasta el ultimo dia de mes se debe de basar en lo planificado"
    // Interpretation: 
    // - Real MTD: Completed blocks updated within [MonthStart, TodayEnd] (or Now).
    // - Planned Future: Planned date within [TomorrowStart, MonthEnd].
    // - What about pending blocks for TODAY? They are technically "Planned" but not "Real" yet.
    // - Let's count "Real" as strictly status=PRODUCED.
    // - Let's count "Planned Remaining" as All Pending blocks with date >= TodayStart?
    // - User said "Real from day 1 to today... From today to end of month based on planned".
    // - Let's treat today as partial. 
    // - Real MTD = Sum(RealKg) of all completed blocks in month.
    // - Planned Remainder = Sum(Units) of all blocks with plannedDate >= TodayStart AND Status != PRODUCED (to avoid double count if re-planned?)
    // - Simpler approach usually accepted: 
    // - Real = Completed blocks in month.
    // - Future Plan = Blocks with plannedDate > Today.

    // We will use:
    // Real MTD: All blocks with status=PRODUCED/FINALIZED and updatedAt inside current month.
    const monthlyProducedBlocks = blocks.filter(b =>
        (b.status === 'PRODUCED' || b.status === 'FINALIZED') &&
        b.updatedAt >= monthStart &&
        b.updatedAt <= monthEnd
    );
    const monthlyProducedKg = monthlyProducedBlocks.reduce((acc, b) => acc + (b.realKg || 0), 0);

    // Future Plan: All blocks planned for this month that are NOT yet produced.
    // This includes blocks scheduled for "Today" or "Yesterday" that are still pending (Overdue).
    // Logic: If it's in the month and not done, it contributes to the Forecast as "Pending Work".
    const remainingPlannedBlocks = blocks.filter(b =>
        b.plannedDate &&
        b.plannedDate >= monthStart &&
        b.plannedDate <= monthEnd &&
        b.status !== 'PRODUCED' && b.status !== 'FINALIZED'
    );
    const remainingPlannedKg = remainingPlannedBlocks.reduce((acc, b) => acc + b.units, 0);

    // Total Forecast = Real Already Done + What is left to do
    const forecastTotalKg = monthlyProducedKg + remainingPlannedKg;

    // Purely Original Plan (for reference, widely used to see deviation from original budget)
    const monthlyPlannedBlocks = blocks.filter(b => b.plannedDate && b.plannedDate >= monthStart && b.plannedDate <= monthEnd);
    const monthlyPlannedKg = monthlyPlannedBlocks.reduce((acc, b) => acc + b.units, 0);

    const monthlyProgress = forecastTotalKg > 0 ? (monthlyProducedKg / forecastTotalKg) * 100 : 0;


    // 2. PLANT EFFICIENCY
    const reactors = await prisma.reactor.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
    });

    const shiftsConfig = await prisma.configuration.findUnique({
        where: { key: 'shifts_count' }
    });
    const shiftsPerDay = shiftsConfig ? parseInt(shiftsConfig.value) : 2;

    // Calculate Total Plant Capacity (Daily)
    const totalPlantCapacity = reactors.reduce((acc, r) => acc + (r.capacity * shiftsPerDay), 0);

    const plantStats = await Promise.all(reactors.map(async (reactor: any) => {
        const producedTodayBlocks = blocks.filter(b =>
            b.plannedReactor === reactor.name &&
            (b.status === 'PRODUCED' || b.status === 'FINALIZED') &&
            b.updatedAt >= todayStart && b.updatedAt <= todayEnd
        );

        const producedKg = producedTodayBlocks.reduce((acc, b) => acc + (b.realKg || b.units), 0);

        const plannedTodayBlocks = blocks.filter(b =>
            b.plannedReactor === reactor.name &&
            b.plannedDate &&
            b.plannedDate >= todayStart &&
            b.plannedDate <= todayEnd
        );
        const plannedTodayKg = plannedTodayBlocks.reduce((acc, b) => acc + b.units, 0);

        const dynamicDailyTarget = reactor.capacity * shiftsPerDay;
        const efficiency = dynamicDailyTarget > 0 ? (producedKg / dynamicDailyTarget) * 100 : 0;

        return {
            plant: `${reactor.description || reactor.name}`,
            produced: producedKg,
            plannedLoad: plannedTodayKg,
            planned: dynamicDailyTarget,
            efficiency: Math.round(efficiency)
        };
    }));

    // 3. PRODUCTION TREND (Weekly or Monthly)
    const debugLogs: string[] = [];
    debugLogs.push(`Period: ${period}, Interval: ${rangeStart.toISOString()} - ${rangeEnd.toISOString()}`);
    debugLogs.push(`Total Plant Capacity: ${totalPlantCapacity} kg/day`);

    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

    // Filter out weekends (0 = Sunday, 6 = Saturday)
    const workDays = days.filter(d => d.getDay() !== 0 && d.getDay() !== 6);

    const trendData = workDays.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const dayBlocks = blocks.filter(b =>
            b.plannedDate &&
            b.plannedDate >= dayStart &&
            b.plannedDate <= dayEnd
        );

        const total = dayBlocks.reduce((acc, b) => acc + (b.realKg || b.units), 0);

        // Label logic
        let label = '';
        if (period === 'week') {
            const dayLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
            label = dayLabels[day.getDay()];
        } else {
            label = format(day, 'd'); // 1, 2, 3...
        }

        return {
            day: format(day, 'yyyy-MM-dd'),
            label: label,
            total: total,
            capacity: totalPlantCapacity
        };
    });

    // 4. COMPLIANCE TREND



    // 4. COMPLIANCE HISTORY (Daily, Weekly, Monthly)
    // Helper to calculate compliance for a specific range
    const calculateCompliance = (start: Date, end: Date, blocks: any[]) => {
        const relevantBlocks = blocks.filter(b =>
            b.plannedDate &&
            b.plannedDate >= start &&
            b.plannedDate <= end
        );
        const total = relevantBlocks.length;
        const produced = relevantBlocks.filter(b => b.status === 'PRODUCED').length;
        // Default to null or 0 if no blocks? If 0 blocks, it's N/A, but we chart it as 100 or 0.
        // Let's use 100% as "No Failures" logic, or better, keep it 0 if strictly nothing to do.
        // However, previous logic was (total > 0 ? ... : 100).
        return total > 0 ? Math.round((produced / total) * 100) : 100;
    };

    const calculateComplianceDetails = (start: Date, end: Date, blocks: any[]) => {
        const relevantBlocks = blocks.filter(b =>
            b.plannedDate &&
            b.plannedDate >= start &&
            b.plannedDate <= end
        );
        const total = relevantBlocks.length;
        const produced = relevantBlocks.filter(b => b.status === 'PRODUCED').length;
        const value = total > 0 ? Math.round((produced / total) * 100) : 0;
        return { value, total, produced };
    }

    // Daily Trend (Last 14 Days)
    const holidays = await prisma.holiday.findMany({
        where: {
            date: {
                gte: subDays(todayStart, 20), // Fetch enough history
                lte: todayEnd
            }
        }
    });

    const dailyCompliance = eachDayOfInterval({
        start: subDays(todayStart, 13),
        end: todayEnd
    })
        .filter(d => d.getDay() !== 0 && d.getDay() !== 6) // Exclude Weekends
        .map(day => {
            const details = calculateComplianceDetails(startOfDay(day), endOfDay(day), blocks);
            const isHoliday = holidays.some(h => isSameDay(h.date, day));

            return {
                label: format(day, 'dd/MM'),
                fullLabel: format(day, "d 'de' MMMM", { locale: es }),
                isHoliday,
                ...details
            };
        });

    // Weekly Trend (Last 12 Weeks)
    // We want discrete weeks ending or surrounding today? Let's take last 12 full weeks + current.
    // Simpler: iterate back 11 weeks from current week.
    const weeklyCompliance = [];
    for (let i = 11; i >= 0; i--) {
        const d = subWeeks(now, i);
        const s = startOfWeek(d, { weekStartsOn: START_OF_WEEK });
        const e = endOfWeek(d, { weekStartsOn: START_OF_WEEK });
        const details = calculateComplianceDetails(s, e, blocks);
        weeklyCompliance.push({
            label: `S${getISOWeek(d)}`,
            fullLabel: `Semana ${getISOWeek(d)} (${format(s, 'dd/MM')} - ${format(e, 'dd/MM')})`,
            ...details
        });
    }

    // Monthly Trend (Last 6 Months)
    const monthlyCompliance = [];
    for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        const s = startOfMonth(d);
        const e = endOfMonth(d);
        const details = calculateComplianceDetails(s, e, blocks);
        monthlyCompliance.push({
            label: format(d, 'MMM', { locale: es }),
            fullLabel: format(d, 'MMMM yyyy', { locale: es }),
            ...details
        });
    }



    // Generate Period Label
    let periodLabel = '';
    if (period === 'month') {
        periodLabel = format(rangeStart, 'MMMM yyyy', { locale: es });
        // Capitalize first letter
        periodLabel = periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1);
    } else {
        const startStr = format(rangeStart, "d 'de' MMMM", { locale: es });
        const endStr = format(rangeEnd, "d 'de' MMMM", { locale: es });
        periodLabel = `${startStr} - ${endStr}`;
    }

    // Generate Period Label for the Card Header
    const monthLabel = format(monthStart, 'MMMM yyyy', { locale: es });
    const capitalizedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    return {
        kpis: [
            {
                label: `Producción Mensual (${capitalizedMonthLabel})`,
                value: `${(monthlyProducedKg / 1000).toFixed(1)}k`,
                unit: 'kg Acumulados',
                footer: `Previsión Cierre: ${(forecastTotalKg / 1000).toFixed(1)}k kg`,
                color: '#3b82f6',
                icon: 'Factory'
            },
            { label: 'KG Planificados (Hoy)', value: kgActivityToday.toLocaleString(), unit: 'kg', color: '#8b5cf6' },
            { label: 'OEE Global', value: `${oeeGlobal}%`, unit: '', color: '#10b981' },
            { label: 'Cumplimiento Plan', value: `${Math.round(compliance)}%`, unit: '', color: '#6366f1' },
            { label: 'Rechazos / Merma', value: `${rejects}%`, unit: '', color: '#ef4444' },
        ],
        periodLabel,
        plantStats,
        weeklyTrend: trendData,
        complianceData: {
            daily: dailyCompliance,
            weekly: weeklyCompliance,
            monthly: monthlyCompliance
        },
        debug: debugLogs
    };
}
