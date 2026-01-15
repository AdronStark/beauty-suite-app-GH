import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const rules = await prisma.rawMaterialExcludedTerm.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(rules);
    } catch (error) {
        console.error("[EXCLUDED_TERMS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { term, field, matchType } = await req.json();

        if (!term || !field || !matchType) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        const newRule = await prisma.rawMaterialExcludedTerm.create({
            data: {
                term,
                field,
                matchType
            }
        });

        return NextResponse.json(newRule);
    } catch (error) {
        console.error("[EXCLUDED_TERMS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { id } = await req.json();

        if (!id) return new NextResponse("Missing ID", { status: 400 });

        await prisma.rawMaterialExcludedTerm.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[EXCLUDED_TERMS_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
