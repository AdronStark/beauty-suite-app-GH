'use server';

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';

export async function getClients() {
    try {
        const clients = await prisma.client.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            select: { id: true, name: true }
        });
        return { success: true, clients };
    } catch (e) {
        console.error("Failed to fetch clients", e);
        return { error: 'Failed to fetch clients', clients: [] };
    }
}

export async function createFormula(data: {
    name: string;
    category: string;
    description?: string;
    ownership: string;
    clientIds: string[];
    ingredients?: string;
    status?: string;
}) {
    if (!data.name) return { error: 'Name required' };

    try {
        // Generate Code: F + Sequence
        // Fetch all codes to find the true max sequence, avoiding sorting issues (e.g. F9 > F10 in string sort)
        const allFormulas = await prisma.formula.findMany({
            select: { code: true },
            where: { code: { startsWith: 'F' } }
        });

        let maxSequence = 0;
        for (const f of allFormulas) {
            if (f.code) {
                const num = parseInt(f.code.replace('F', ''), 10);
                if (!isNaN(num) && num > maxSequence) {
                    maxSequence = num;
                }
            }
        }

        const nextSequence = maxSequence + 1;
        const code = `F${nextSequence.toString().padStart(3, '0')}`;

        const newFormula = await prisma.formula.create({
            data: {
                name: data.name,
                code,
                revision: 0,
                category: data.category || 'General',
                status: data.status || 'Active',
                description: data.description || '',
                ingredients: data.ingredients || '[]',
                ownership: data.ownership || 'PROPIA',
                clients: {
                    connect: data.clientIds ? data.clientIds.map(id => ({ id })) : []
                }
            } as any
        });

        revalidatePath('/formulas');
        return { success: true, formulaId: newFormula.id };
    } catch (e) {
        console.error("Failed to create formula", e);
        return { error: 'Failed to create' };
    }
}

export async function createRevision(currentFormulaId: string) {
    try {
        const current = await prisma.formula.findUnique({ where: { id: currentFormulaId } }) as any;
        if (!current || !current.code) return { error: 'Original formula not found or missing code' };

        // Find highest revision for this code
        const latest = await prisma.formula.findFirst({
            where: { code: current.code } as any,
            orderBy: { revision: 'desc' } as any
        }) as any;

        const nextRevision = (latest?.revision ?? current.revision) + 1;

        const newRevision = await prisma.formula.create({
            data: {
                name: current.name, // Keep name or add suffix? Keep name usually.
                code: current.code,
                revision: nextRevision,
                category: current.category,
                description: current.description,
                ingredients: current.ingredients,
                status: 'Draft', // New revisions start as Draft
                briefingId: current.briefingId
            } as any
        });

        revalidatePath(`/formulas/${currentFormulaId}`);
        return { success: true, newFormulaId: newRevision.id };
    } catch (e) {
        console.error("Failed to create revision", e);
        return { error: 'Failed to create revision' };
    }
}

export async function updateFormula(id: string, data: any) {
    try {
        // Handle clients update if present
        let clientsUpdate = {};
        if (data.clientIds) {
            clientsUpdate = {
                clients: {
                    set: [], // Clear existing relations
                    connect: data.clientIds.map((cid: string) => ({ id: cid }))
                }
            };
        }

        await prisma.formula.update({
            where: { id },
            data: {
                name: data.name,
                category: data.category,
                description: data.description,
                ingredients: data.ingredients, // Expecting JSON string
                status: data.status,
                ownership: data.ownership,
                ...clientsUpdate
            }
        });

        revalidatePath(`/formulas/${id}`);
        revalidatePath('/formulas');
        return { success: true };
    } catch (e) {
        console.error("Failed to update formula", e);
        return { error: 'Failed to update' };
    }
}
