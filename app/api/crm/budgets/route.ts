import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

import { rateLimit } from '@/lib/rate-limit';
import { SalesBudgetSchema } from '@/lib/schemas';

const limiter = rateLimit({
    interval: 60 * 1000, // 60 seconds
    uniqueTokenPerInterval: 500, // Max 500 users per second
});

export async function GET(req: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // Rate Limit Check
    // @ts-ignore
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const isRateLimited = limiter.check(NextResponse.next(), 20, ip); // 20 requests per minute per IP

    if (isRateLimited) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const companyId = searchParams.get('companyId');

    if (!companyId) {
        return NextResponse.json({ error: 'companyId required' }, { status: 400 });
    }

    try {
        const budgets = await prisma.salesBudget.findMany({
            where: { year, companyId },
            orderBy: { amount: 'desc' }
        });
        return NextResponse.json(budgets);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
    }
}



export async function POST(req: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();

        // VALIDATION STEP (The "Torno")
        // safeParse returns success (boolean) and data/error
        const result = SalesBudgetSchema.safeParse(body);

        if (!result.success) {
            // Return detailed errors from Zod
            return NextResponse.json({
                error: 'Validation failed',
                details: result.error.flatten()
            }, { status: 400 });
        }

        // Use CLEAN data from Zod
        const { year, companyId, client, amount, id } = result.data;

        // If ID provided, it's an EDIT
        if (id) {
            const budget = await prisma.salesBudget.update({
                where: { id },
                data: {
                    year,
                    companyId,
                    client,
                    amount
                }
            });
            return NextResponse.json(budget);
        }

        // Otherwise, it's a NEW entry
        const budget = await prisma.salesBudget.upsert({
            where: {
                year_client_companyId: {
                    year,
                    client,
                    companyId
                }
            },
            update: { amount },
            create: {
                year,
                companyId,
                client,
                amount
            }
        });

        return NextResponse.json(budget);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Error saving budget' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.salesBudget.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Error deleting budget' }, { status: 500 });
    }
}
