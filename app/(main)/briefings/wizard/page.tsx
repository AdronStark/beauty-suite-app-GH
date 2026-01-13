import { prisma } from '@/lib/db/prisma';
import WizardClient from './WizardClient';
import BriefingCreator from '@/components/briefings/BriefingCreator';

export default async function WizardPage({
    searchParams,
}: {
    searchParams: Promise<{ id?: string, mode?: string }>
}) {
    const { id, mode } = await searchParams;

    if (!id) {
        return <BriefingCreator />;
    }

    const briefing = await prisma.briefing.findUnique({
        where: { id },
        include: {
            formulas: true // Needed for Sample Registration
        }
    });

    return <WizardClient initialData={briefing} initialMode={mode as any} />;
}
