import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        // Get distinct supplier names from RawMaterialOrder
        const suppliers = await prisma.rawMaterialOrder.findMany({
            select: { supplierName: true },
            where: { supplierName: { not: null } },
            distinct: ['supplierName']
        });

        const names = suppliers.map(s => s.supplierName).filter(Boolean).sort();
        return NextResponse.json(names);
    } catch (error) {
        console.error("[RAW_MATERIALS_SUPPLIERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
