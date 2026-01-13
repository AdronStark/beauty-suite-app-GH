import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
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
    try {
        const body = await req.json();
        const { year, companyId, client, amount, id } = body;

        if (!year || !client || !companyId) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // If ID provided, it's an EDIT
        if (id) {
            const budget = await prisma.salesBudget.update({
                where: { id },
                data: {
                    year: parseInt(year),
                    companyId,
                    client,
                    amount: parseFloat(amount)
                }
            });
            return NextResponse.json(budget);
        }

        // Otherwise, it's a NEW entry
        const budget = await prisma.salesBudget.upsert({
            where: {
                year_client_companyId: {
                    year: parseInt(year),
                    client,
                    companyId
                }
            },
            update: { amount: parseFloat(amount) },
            create: {
                year: parseInt(year),
                companyId,
                client,
                amount: parseFloat(amount)
            }
        });

        return NextResponse.json(budget);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Error saving budget' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
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
