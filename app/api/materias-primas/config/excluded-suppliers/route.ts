import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const excluded = await prisma.rawMaterialExcludedSupplier.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(excluded);
    } catch (error) {
        console.error("[EXCLUDED_SUPPLIERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { name } = await req.json();
        if (!name) return new NextResponse("Name required", { status: 400 });

        const created = await prisma.rawMaterialExcludedSupplier.create({
            data: { name }
        });
        return NextResponse.json(created);
    } catch (error) {
        console.error("[EXCLUDED_SUPPLIERS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { id } = await req.json();
        if (!id) return new NextResponse("ID required", { status: 400 });

        await prisma.rawMaterialExcludedSupplier.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[EXCLUDED_SUPPLIERS_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
