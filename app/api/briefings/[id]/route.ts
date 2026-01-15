import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;

        const briefing = await prisma.briefing.findUnique({
            where: { id }
        });

        if (!briefing) {
            return NextResponse.json({ error: 'Briefing not found' }, { status: 404 });
        }

        return NextResponse.json(briefing);
    } catch (error) {
        console.error("Get Briefing Error:", error);
        return NextResponse.json(
            { error: 'Failed to fetch briefing' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const body = await request.json();

        // Remove protected fields if present
        delete body.id;
        delete body.createdAt;
        delete body.updatedAt;
        delete body.code; // Prevent changing the code

        // Ensure actives are stored as JSON compatible object/array if needed, 
        // but since we are using a JSON column 'formData' effectively (or individual fields), 
        // we need to map based on schema. 
        // Assuming schema matches body keys largely, but let's check schema first to be safe? 
        // Actually, looking at the POST route, it maps fields directly. 
        // Wait, the POST route in previous turn showed mapping:
        /*
          data: {
              code: newCode,
              clientName: body.clientName,
              productName: body.productName,
              category: body.category || 'General',
              status: 'Borrador',
              formData: JSON.stringify(body) // It seems it stores everything else in formData?
          }
        */

        // We should replicate that behavior. Update core fields and formData.

        const updateData: any = {
            clientName: body.clientName,
            productName: body.productName,
            category: body.category,
            formData: JSON.stringify(body),
            updatedAt: new Date()
        };

        // Include status if provided
        if (body.status) {
            updateData.status = body.status;
        }

        const updated = await prisma.briefing.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Update Briefing Error:", error);
        return NextResponse.json(
            { error: 'Failed to update briefing' },
            { status: 500 }
        );
    }
}


export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;

        await prisma.briefing.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Briefing Error:", error);
        return NextResponse.json(
            { error: 'Failed to delete briefing' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const body = await request.json();

        // Allow updating specific fields (Responsible, Status, etc.)
        const allowedFields = [
            'responsableComercial',
            'responsableTecnico',
            'status',
            'clientName',
            'productName'
        ];

        const dataToUpdate: any = {};

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                dataToUpdate[field] = body[field];
            }
        }

        if (Object.keys(dataToUpdate).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const updated = await prisma.briefing.update({
            where: { id },
            data: {
                ...dataToUpdate,
                updatedAt: new Date()
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Patch Briefing Error:", error);
        return NextResponse.json(
            { error: 'Failed to patch briefing' },
            { status: 500 }
        );
    }
}
