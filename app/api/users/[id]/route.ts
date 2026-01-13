
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN') {
        return new NextResponse("Unauthorized", { status: 403 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { username, password, name, role, companies, firstName, lastName1, lastName2, position, isCommercial, isTechnical, connectedClientName } = body;

        let updateData: any = {
            username,
            name,
            // @ts-ignore
            firstName,
            // @ts-ignore
            lastName1,
            // @ts-ignore
            lastName2,
            // @ts-ignore
            position,
            // @ts-ignore
            isCommercial,
            // @ts-ignore
            isTechnical,
            role,
            // @ts-ignore
            connectedClientName,
            companies: JSON.stringify(companies || []),
        };

        if (password && password.length > 0) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData
        });

        const { password: _, ...userWithoutPass } = updatedUser;
        return NextResponse.json(userWithoutPass);
    } catch (e) {
        console.error(e);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN') {
        return new NextResponse("Unauthorized", { status: 403 });
    }

    try {
        const { id } = await params;

        // Prevent deleting self? Or rely on UI warning.
        // @ts-ignore
        if (session?.user?.id === id) {
            return new NextResponse("Cannot delete yourself", { status: 400 });
        }

        await prisma.user.delete({
            where: { id }
        });

        return new NextResponse(null, { status: 204 });
    } catch (e) {
        console.error(e);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
