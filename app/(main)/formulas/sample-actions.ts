'use server';

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';

export async function createSample(formulaId: string, data: any) {
    try {
        await prisma.sample.create({
            data: {
                formulaId,
                recipient: data.recipient,
                dateSent: new Date(data.dateSent),
                status: 'Pending',
                feedback: ''
            }
        });

        revalidatePath(`/formulas/${formulaId}`);
        return { success: true };
    } catch (e) {
        console.error("Failed to create sample", e);
        return { error: 'Failed to create sample' };
    }
}

export async function updateSampleStatus(sampleId: string, formulaId: string, status: string, feedback: string) {
    try {
        await prisma.sample.update({
            where: { id: sampleId },
            data: { status, feedback }
        });

        revalidatePath(`/formulas/${formulaId}`);
        return { success: true };
    } catch (e) {
        console.error("Failed to update sample", e);
        return { error: 'Failed to update sample' };
    }
}

export async function deleteSample(sampleId: string, formulaId: string) {
    try {
        await prisma.sample.delete({
            where: { id: sampleId }
        });

        revalidatePath(`/formulas/${formulaId}`);
        return { success: true };
    } catch (e) {
        console.error("Failed to delete sample", e);
        return { error: 'Failed to delete sample' };
    }
}
