import { prisma } from '@/lib/db/prisma';
import ConfigEditor from '@/components/ofertas/config/ConfigEditor';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export default async function ConfigPage() {
    const session = await auth();
    const userRole = session?.user?.role;

    if (userRole !== 'ADMIN') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Restringido</h1>
                    <p className="text-slate-600 mb-6">
                        No tienes permisos para acceder a esta configuración. Esta sección está reservada para administradores.
                    </p>
                    <a href="/" className="inline-block px-6 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors">
                        Volver al Inicio
                    </a>
                </div>
            </div>
        );
    }

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
