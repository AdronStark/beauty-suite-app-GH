import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        // 1. Get all exclusion rules
        const [excludedSuppliers, excludedTerms] = await Promise.all([
            prisma.rawMaterialExcludedSupplier.findMany({ select: { name: true } }),
            prisma.rawMaterialExcludedTerm.findMany()
        ]);

        let deletedCount = 0;
        let suppliersAffected: string[] = [];
        let termsAffected: string[] = [];

        // --- PART A: Delete by Supplier Name (Efficient DB-level if possible) ---
        if (excludedSuppliers.length > 0) {
            const excludedNames = excludedSuppliers.map(s => s.name.toLowerCase().trim());

            const distinctOrderSuppliers = await prisma.rawMaterialOrder.findMany({
                where: { supplierName: { not: null } },
                distinct: ['supplierName'],
                select: { supplierName: true }
            });

            const suppliersToDelete = distinctOrderSuppliers
                .map(s => s.supplierName!)
                .filter(name => excludedNames.includes(name.toLowerCase().trim()));

            if (suppliersToDelete.length > 0) {
                const result = await prisma.rawMaterialOrder.deleteMany({
                    where: { supplierName: { in: suppliersToDelete } }
                });
                deletedCount += result.count;
                suppliersAffected = suppliersToDelete;
            }
        }

        // --- PART B: Delete by Text Rules (Code/Name) ---
        if (excludedTerms.length > 0) {
            // Fetch remaining orders (we need ID, Code, Name)
            const remainingOrders = await prisma.rawMaterialOrder.findMany({
                select: { id: true, articleCode: true, articleName: true }
            });

            const idsToDelete: string[] = [];

            for (const order of remainingOrders) {
                let shouldDelete = false;
                const code = order.articleCode || '';
                const name = order.articleName || '';
                const normalize = (s: string) => s.toLowerCase().trim();

                for (const rule of excludedTerms) {
                    const valueToCheck = rule.field === 'CODE' ? code : name;

                    if (rule.matchType === 'EXACT') {
                        if (normalize(valueToCheck) === normalize(rule.term)) {
                            shouldDelete = true;
                            break;
                        }
                    } else {
                        if (normalize(valueToCheck).includes(normalize(rule.term))) {
                            shouldDelete = true;
                            break;
                        }
                    }
                }

                if (shouldDelete) {
                    idsToDelete.push(order.id);
                }
            }

            if (idsToDelete.length > 0) {
                const result = await prisma.rawMaterialOrder.deleteMany({
                    where: { id: { in: idsToDelete } }
                });
                deletedCount += result.count;
                termsAffected = ['Términos de texto'];
            }
        }

        return NextResponse.json({
            deletedCount,
            suppliersAffected,
            termsAffected
        });

    } catch (error) {
        console.error("[APPLY_RULES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
