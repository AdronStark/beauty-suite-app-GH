import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import EditFormulaForm from './EditFormulaForm';

export const dynamic = 'force-dynamic';

export default async function EditFormulaPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Explicitly cast to any to resolve potential TS issues with prisma client generation
    const formula = await prisma.formula.findUnique({
        where: { id },
        include: { clients: true }
    }) as any;

    if (!formula) notFound();

    return <EditFormulaForm formula={formula} />;
}
