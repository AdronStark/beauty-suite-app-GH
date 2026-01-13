'use server';

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';

export async function createStabilityTest(formulaId: string, data: any) {
    try {
        await prisma.stabilityTest.create({
            data: {
                formulaId,
                type: data.type,
                temperature: data.temperature,
                ph: data.ph,
                viscosity: data.viscosity,
                appearance: data.appearance,
                aroma: data.aroma,
                notes: data.notes,
                date: new Date(data.date)
            }
        });

        revalidatePath(`/formulas/${formulaId}`);
        return { success: true };
    } catch (e) {
        console.error("Failed to create stability test", e);
        return { error: 'Failed to create test' };
    }
}

export async function deleteStabilityTest(testId: string, formulaId: string) {
    try {
        await prisma.stabilityTest.delete({
            where: { id: testId }
        });

        revalidatePath(`/formulas/${formulaId}`);
        return { success: true };
    } catch (e) {
        console.error("Failed to delete stability test", e);
        return { error: 'Failed to delete test' };
    }
}
