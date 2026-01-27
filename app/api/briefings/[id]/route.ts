import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';
import { withAuth } from '@/lib/api-auth';

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

export const PUT = withAuth(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const { id } = await params;
        const body = await request.json();

        // Remove protected fields if present
        delete body.id;
        delete body.createdAt;
        delete body.updatedAt;
        delete body.code; // Prevent changing the code

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
}, { appId: 'briefings', appRoles: ['EDITOR', 'ADMIN'] });


export const DELETE = withAuth(async (request: Request, { params }: { params: Promise<{ id: string }> }, session: any) => {
    try {
        const { id } = await params;

        // Get briefing info for audit log
        const briefing = await prisma.briefing.findUnique({ where: { id }, select: { code: true, productName: true } });

        await prisma.briefing.delete({
            where: { id }
        });

        console.log(`[AUDIT] Briefing ${briefing?.code || briefing?.productName || id} deleted by user: ${session.user.name}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Briefing Error:", error);
        return NextResponse.json(
            { error: 'Failed to delete briefing' },
            { status: 500 }
        );
    }
}, { appId: 'briefings', appRoles: ['ADMIN'] });

export const PATCH = withAuth(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
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
}, { appId: 'briefings', appRoles: ['EDITOR', 'ADMIN'] });
