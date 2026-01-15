import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { addDays, subDays, isWeekend, isSameDay } from 'date-fns';
import { SHIFTS, PLANNING_CONFIG } from '@/lib/planner-constants';

const { BATCH_LIMIT, MIN_DAYS_AFTER_ORDER, MAX_WINDOW_DAYS, BUFFER_DAYS_BEFORE_DEADLINE } = PLANNING_CONFIG;

// Helper to check if a slot is free
// In a real optimized system, we would fetch existing plan for the window ONCE and build a map.
// For now, we'll fetch all planned future blocks? Or just fetch all relevant blocks?
// FETCHING INSIDE LOOP IS BAD.
// We will fetch ALL future blocks once at the start.

import { auth } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

const limiter = rateLimit({ uniqueTokenPerInterval: 50, interval: 60000 });

export async function POST(request: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // @ts-ignore
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    if (limiter.check(NextResponse.next(), 5, ip)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    try {
        const body = await request.json().catch(() => ({})); // Handle empty body safely
        const { targetIds } = body;

        // 1. Fetch Configuration (only if other configs are needed, otherwise this block can be removed)
        // The constants BATCH_LIMIT, MIN_DAYS_AFTER_ORDER, BUFFER_DAYS_BEFORE_DEADLINE, MAX_WINDOW_DAYS
        // are now imported from '@/lib/planner-constants'.
        // If other configurations are still fetched from the DB, keep this.
        // For now, keeping the config fetching as there might be other configs.
        const configs = await prisma.configuration.findMany();
        const configMap = configs.reduce((acc: Record<string, string>, curr: { key: string; value: string }) => ({ ...acc, [curr.key]: curr.value }), {});

        const BUFFER_DAYS_BEFORE_DEADLINE = parseInt(configMap['ap_bufferDaysBeforeDeadline']) || 15;
        const MAX_WINDOW_DAYS = parseInt(configMap['ap_maxWindowDays']) || 35;

        // 2. Fetch Reactors (Dynamic)
        const reactors = await prisma.reactor.findMany({
            where: { isActive: true },
            orderBy: { capacity: 'asc' } // Sort by capacity for "best fit" logic
        });

        // 3. Fetch Pending Blocks
        // We only plan PENDING blocks that have a deadline and orderDate
        // If targetIds are provided, only pick those
        const where: any = {
            status: 'PENDING',
            deadline: { not: null }
        };

        if (targetIds && Array.isArray(targetIds) && targetIds.length > 0) {
            where.id = { in: targetIds };
        }

        const pendingBlocks = await prisma.productionBlock.findMany({ where });

        // Fetch existing holidays
        const holidays = await prisma.holiday.findMany();
        const holidayDates = new Set(holidays.map((h: { date: Date }) => h.date.toISOString().split('T')[0]));

        // FIX: Ensure searchDate is not in the past (Relative to Madrid)
        // We want "Today 00:00 Madrid time"
        const todayMadridStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
        const [ty, tm, td] = todayMadridStr.split('-').map(Number);
        const todayMadrid = new Date(ty, tm - 1, td); // Local time object representing 00:00 Madrid

        // Fetch already planned blocks to check collisions
        const plannedBlocks = await prisma.productionBlock.findMany({
            where: { status: 'PLANNED' }
        });

        // Helper to check availability
        const isSlotFree = (date: Date, reactor: string, shift: string) => {
            return !plannedBlocks.some((b: any) =>
                b.plannedDate &&
                isSameDay(b.plannedDate, date) &&
                b.plannedReactor === reactor &&
                b.plannedShift === shift
            );
        };

        let plannedCount = 0;
        let splitCount = 0;
        let results: any[] = [];

        // 4. Process Blocks
        // Sort by Deadline ASC (Fixing lint 'a' implicit any)
        pendingBlocks.sort((a: any, b: any) => (a.deadline!.getTime() - b.deadline!.getTime()));

        for (const block of pendingBlocks) {
            // A. Calculate Sub-Batches (Planned & Unplanned)
            let subBatches = [];
            if (block.units > BATCH_LIMIT) {
                const parts = Math.ceil(block.units / BATCH_LIMIT);
                for (let i = 1; i <= parts; i++) {
                    subBatches.push({
                        originalId: block.id,
                        units: Math.min(block.units - ((i - 1) * BATCH_LIMIT), BATCH_LIMIT),
                        label: `T${i}`
                    });
                }
                splitCount += parts - 1;
            } else {
                subBatches.push({ originalId: block.id, units: block.units, label: null });
            }

            // B. Determine Plan for Each Sub-Batch (In Memory)
            const planOperations: { type: 'PLANNED' | 'PENDING', data: any }[] = [];

            for (const batch of subBatches) {
                // Window Calculation
                const earliestStart = block.orderDate ? addDays(block.orderDate, MIN_DAYS_AFTER_ORDER) : todayMadrid;
                // Normalize start to NOON to avoid timezone shift issues (00:00 Madrid -> 23:00 UTC Prev Day)
                earliestStart.setHours(12, 0, 0, 0);

                const maxWindowStart = subDays(block.deadline!, MAX_WINDOW_DAYS); // Use ! as we filtered for not null
                maxWindowStart.setHours(12, 0, 0, 0);

                let searchDate = earliestStart.getTime() > maxWindowStart.getTime() ? earliestStart : maxWindowStart;
                if (searchDate < todayMadrid) {
                    searchDate = new Date(todayMadrid);
                    searchDate.setHours(12, 0, 0, 0);
                }

                const endDate = subDays(block.deadline!, BUFFER_DAYS_BEFORE_DEADLINE);
                endDate.setHours(23, 59, 59, 999); // End of day check is fine

                let foundSlot = null;

                if (searchDate <= endDate) {
                    // Dynamic Reactor Selection: Find first reactor with enough capacity, or fallback to largest
                    const targetReactor = reactors.find(r => r.capacity >= batch.units) || reactors[reactors.length - 1];
                    // Skip if no reactors defined
                    if (!targetReactor) continue;

                    let currentd = new Date(searchDate);
                    let attempts = 0;

                    while (currentd <= endDate && !foundSlot && attempts < 100) {
                        attempts++;
                        // Normalize to YYYY-MM-DD for comparison (Madrid time)
                        const currentYMD = currentd.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });

                        // Check Holiday (Compare YYYY-MM-DD in Madrid)
                        const isHoliday = holidays.some((h: any) => {
                            const hDate = new Date(h.date);
                            const hYMD = hDate.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
                            return hYMD === currentYMD;
                        });

                        // Check Weekend
                        const [y, m, d] = currentYMD.split('-').map(Number);
                        const noonDate = new Date(y, m - 1, d, 12, 0, 0);
                        const dayOfWeek = noonDate.getDay();
                        const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;

                        if (isWeekendDay || isHoliday) {
                            currentd = addDays(currentd, 1);
                            continue;
                        }

                        // Use name or id depending on convention. Using 'name' as it's the unique identifier in other places
                        const reactorId = targetReactor.name;

                        for (const shift of SHIFTS) {
                            if (isSlotFree(currentd, reactorId, shift)) {
                                foundSlot = { date: currentd, reactor: reactorId, shift };
                                break;
                            }
                        }
                        if (!foundSlot) currentd = addDays(currentd, 1);
                    }
                }

                // Prepare Operation Data
                if (foundSlot) {
                    // Update local plannedBlocks to reflect occupation for next iterations in this request
                    const newPlannedItem = {
                        plannedDate: foundSlot.date,
                        plannedReactor: foundSlot.reactor,
                        plannedShift: foundSlot.shift
                    };
                    plannedBlocks.push(newPlannedItem as any);

                    planOperations.push({
                        type: 'PLANNED',
                        data: {
                            articleCode: block.articleCode,
                            articleDesc: block.articleDesc,
                            clientName: block.clientName,
                            orderNumber: block.orderNumber,
                            units: batch.units,
                            status: 'PLANNED',
                            deadline: block.deadline,
                            orderDate: block.orderDate,
                            plannedDate: foundSlot.date,
                            plannedReactor: foundSlot.reactor,
                            plannedShift: foundSlot.shift,
                            batchLabel: batch.label,
                            unitsOrdered: block.unitsOrdered,
                            unitsServed: block.unitsServed,
                            unitsPending: block.unitsPending,
                            erpId: block.erpId // Keep original erpId if split? ideally suffix, but keeping null safe
                        }
                    });
                    plannedCount++;
                } else {
                    // Critical Fix: Even if not planned, we must create a PENDING block if it was part of a split
                    // If it wasn't a split (length=1), we effectively "leave it alone" or update it.
                    // But to be atomic, we treat 'single block not planned' as 'no op'.
                    // If 'single block PLANNED', we update or create+delete. 
                    // To simplify: We ALWAYS create new blocks and delete old one if subBatches > 1.
                    // If subBatches == 1 and NOT planned, we do nothing.

                    if (subBatches.length > 1) {
                        planOperations.push({
                            type: 'PENDING',
                            data: {
                                articleCode: block.articleCode,
                                articleDesc: block.articleDesc,
                                clientName: block.clientName,
                                orderNumber: block.orderNumber,
                                units: batch.units,
                                status: 'PENDING', // Remains pending
                                deadline: block.deadline,
                                orderDate: block.orderDate,
                                batchLabel: batch.label,
                                unitsOrdered: block.unitsOrdered,
                                unitsServed: block.unitsServed,
                                unitsPending: block.unitsPending,
                                erpId: block.erpId
                            }
                        });
                    }
                }
            }

            // C. Execute Transaction
            // Only proceed if at least one operation is PLANNED (to avoid churning IDs) OR if it was a split
            const hasPlanned = planOperations.some(op => op.type === 'PLANNED');
            const isSplit = subBatches.length > 1;

            if (hasPlanned || isSplit) {
                try {
                    await prisma.$transaction(async (tx) => {
                        // 1. Verify Original Still Exists (Anti-Race Condition)
                        // Delete returns count, or throws? delete calls usually throw if not found? 
                        // deleteMany returns count. delete requires unique.
                        // Use delete: will fail if not found.
                        await tx.productionBlock.delete({ where: { id: block.id } });

                        // 2. Create New Blocks
                        for (const op of planOperations) {
                            const created = await tx.productionBlock.create({ data: op.data as any });
                            if (op.type === 'PLANNED') {
                                results.push(created);
                            }
                        }
                    });
                } catch (e: any) {
                    // If delete fails (record gone), transaction rolls back everything.
                    // "Ghost T2" is prevented.
                    console.warn(`Skipped block ${block.id} (likely modified/deleted concurrently):`, e);
                    // Decrement counts if failed
                    plannedCount -= planOperations.filter(op => op.type === 'PLANNED').length;
                }
            }
        }

        return NextResponse.json({ success: true, planned: plannedCount, splits: splitCount, results });

    } catch (error) {
        console.error('Auto-plan error:', error);
        return NextResponse.json({ error: 'Auto-planning failed' }, { status: 500 });
    }
}
