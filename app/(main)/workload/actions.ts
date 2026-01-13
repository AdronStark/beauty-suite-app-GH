'use server';

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';

export async function assignTechnician(briefingId: string, technicianName: string) {
    if (!briefingId || !technicianName) {
        return { error: 'Missing Required Fields' };
    }

    try {
        await prisma.briefing.update({
            where: { id: briefingId },
            data: { responsableTecnico: technicianName }
        });
        revalidatePath('/workload');
        return { success: true };
    } catch (e: any) {
        console.error("Assignment Failed", e);
        return { error: e.message || 'Failed to assign technician' };
    }
}

export async function createFormulaForBriefing(briefingId: string, name: string) {
    try {
        const briefing = await prisma.briefing.findUnique({ where: { id: briefingId } });
        if (!briefing) return { error: 'Briefing not found' };

        const newFormula = await prisma.formula.create({
            data: {
                name: name,
                category: briefing.category || 'General',
                description: `Created from Briefing: ${briefing.productName}`,
                briefingId: briefing.id,
                status: 'Active'
            } as any
        });
        revalidatePath('/workload');
        // Redirect? For now just return success
        return { success: true, formulaId: newFormula.id };
    } catch (e) {
        console.error("Formula Creation Failed", e);
        return { error: 'Failed to create formula' };
    }
}
