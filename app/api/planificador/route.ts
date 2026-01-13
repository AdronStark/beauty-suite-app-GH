import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ProductionBlockSchema } from '@/lib/planner-validation';

export async function GET() {
    const blocks = await prisma.productionBlock.findMany();
    return NextResponse.json(blocks);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Manual coercion to ensure numbers if they come as strings
        // (Alternatively, update Zod schema to z.coerce.number())
        if (typeof body.units === 'string') body.units = parseFloat(body.units);
        if (typeof body.unitsOrdered === 'string') body.unitsOrdered = parseFloat(body.unitsOrdered);
        if (typeof body.unitsServed === 'string') body.unitsServed = parseFloat(body.unitsServed);
        if (typeof body.unitsPending === 'string') body.unitsPending = parseFloat(body.unitsPending);

        let validation;
        if (body.id) {
            // Partial update
            validation = ProductionBlockSchema.partial().safeParse(body);
        } else {
            // Creation requires full fields
            validation = ProductionBlockSchema.safeParse(body);
        }

        if (!validation.success) {
            console.error("Validation failed:", validation.error.format());
            return NextResponse.json({ error: 'Validation Error', details: validation.error.format() }, { status: 400 });
        }

        const data = validation.data;
        const { id, ...dataToSave } = data; // id is in data, need to separate for update/create logic check

        // Ensure status is valid string for Prisma (Enums match?)
        // Prisma schema might use string. Zod uses enum. It should match.

        if (id) {
            const updated = await prisma.productionBlock.update({
                where: { id },
                data: dataToSave as any // Cast to avoid strict Prisma type mismatch if optional fields differ slightly
            });
            return NextResponse.json(updated);
        } else {
            const created = await prisma.productionBlock.create({
                data: dataToSave as any
            });
            return NextResponse.json(created);
        }
    } catch (error: any) {
        console.error('Save error details:', error);
        console.error('Stack:', error.stack);
        return NextResponse.json({ error: 'Failed to save block', details: error.message }, { status: 500 });
    }
}
