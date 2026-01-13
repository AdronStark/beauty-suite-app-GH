import { prisma } from '@/lib/db/prisma';
import PlannerLayout from './PlannerLayout';

export const dynamic = 'force-dynamic';

export default async function PlannerPage() {
    const blocks = await prisma.productionBlock.findMany();
    const holidays = await prisma.holiday.findMany();
    const maintenance = await prisma.reactorMaintenance.findMany();
    const reactors = await prisma.reactor.findMany({
        orderBy: { name: 'asc' },
        where: { isActive: true }
    });

    // Custom Sort: "Agitación" always last
    reactors.sort((a, b) => {
        if (a.name === 'Agitación') return 1;
        if (b.name === 'Agitación') return -1;
        return 0; // Maintain original order (alphabetical or ID)
    });

    return <PlannerLayout initialBlocks={blocks} holidays={holidays} maintenance={maintenance} reactors={reactors} />;
}
