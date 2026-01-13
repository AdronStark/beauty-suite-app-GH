import { prisma } from '@/lib/db/prisma';
import ConfigEditor from '@/components/ofertas/config/ConfigEditor';

export const dynamic = 'force-dynamic';

export default async function ConfigPage() {
    const configs = await prisma.configuration.findMany();
    const configMap = configs.reduce((acc, curr) => ({
        ...acc,
        [curr.key]: curr.value
    }), {});

    return (
        <div className="min-h-screen bg-slate-50">
            <ConfigEditor initialConfig={configMap} />
        </div>
    );
}
