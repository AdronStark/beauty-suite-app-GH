import { prisma } from '@/lib/db/prisma';
import OfferEditor from './OfferEditor';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    let initialData = null;
    let offerId = null;

    if (id !== 'new') {
        const offer = await prisma.offer.findUnique({
            where: { id }
        });

        if (!offer) {
            notFound();
        }

        initialData = offer;
        offerId = offer.id;

        // Fetch simplified client details if available
        const clientDetails = await prisma.client.findFirst({
            where: { name: offer.client }
        });
        if (clientDetails) {
            // @ts-ignore
            initialData.clientDetails = clientDetails;
        }
    }

    const configs = await prisma.configuration.findMany();
    const configMap = configs.reduce((acc, curr) => ({
        ...acc,
        [curr.key]: curr.value
    }), {});

    return <OfferEditor initialData={initialData} offerId={offerId} config={configMap} />;
}
