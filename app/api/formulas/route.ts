import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { briefingId } = body;

        if (!briefingId) {
            return NextResponse.json({ error: 'Missing briefingId' }, { status: 400 });
        }

        const briefing = await prisma.briefing.findUnique({
            where: { id: briefingId }
        });

        if (!briefing) {
            return NextResponse.json({ error: 'Briefing not found' }, { status: 404 });
        }

        // Parse form data to get ingredients/formula
        let ingredients = "[]";
        let formulaName = briefing.productName;

        try {
            const formData = JSON.parse(briefing.formData || "{}");
            const rawIngredients = formData.formula || formData.actives || [];
            ingredients = JSON.stringify(rawIngredients);
        } catch (e) {
            console.warn("Error parsing briefing formData", e);
        }

        // Generate a Global Unique Code (FXXXXXX)
        // Order by code desc to get the highest number
        // We filter by code starting with F to avoid legacy data issues? 
        // Assuming strict Fxxxxxx format.
        const lastFormula = await prisma.formula.findFirst({
            where: {
                code: { startsWith: 'F' }
            },
            orderBy: { code: 'desc' }
        });

        let nextNumber = 1;
        if (lastFormula && lastFormula.code) {
            // Extract number from Fxxxxxx
            const match = lastFormula.code.match(/F(\d+)/);
            if (match && match[1]) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }

        // Format: F + 6 digits (e.g., F000001)
        const code = `F${nextNumber.toString().padStart(6, '0')}`;

        const newFormula = await prisma.formula.create({
            data: {
                name: formulaName,
                code: code,
                revision: 0, // Always 0 for a new Formula code
                briefingId: briefing.id,
                ingredients: ingredients,
                status: 'Active',
                description: `Generada desde Briefing ${briefing.code}`
            }
        });

        return NextResponse.json(newFormula);

    } catch (error) {
        console.error("Create Formula Error:", error);
        return NextResponse.json(
            { error: 'Failed to create formula' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const whereClause: any = {};
        if (status) {
            whereClause.status = status;
        }

        const formulas = await prisma.formula.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc'
            },
            // Include related fields if needed, e.g. client
            include: { clients: true }
        });

        return NextResponse.json(formulas);
    } catch (error) {
        console.error("Fetch Formulas Error:", error);
        return NextResponse.json(
            { error: 'Failed to fetch formulas' },
            { status: 500 }
        );
    }
}
