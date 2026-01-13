import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
    try {
        const companies = await prisma.company.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(companies);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }
}
