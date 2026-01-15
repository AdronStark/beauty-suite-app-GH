
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { DEFAULT_APP_CONFIG } from '@/lib/app-config';
import UserAppRolesEditor from '@/components/admin/UserAppRolesEditor';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, ShieldAlert } from 'lucide-react';

export default async function UserRolesPage({ params }: { params: { id: string } }) {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN') {
        redirect('/');
    }

    const { id } = await params;

    const targetUser = await prisma.user.findUnique({
        where: { id: id },
        include: {
            appRoles: true
        }
    });

    if (!targetUser) {
        notFound();
    }

    const initialRoles = targetUser.appRoles.map(r => ({
        appId: r.appId,
        role: r.role
    }));

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            {/* Breadcrumb / Navigation */}
            <div className="mb-8">
                <Link
                    href="/admin/users"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-4"
                >
                    <ArrowLeft size={16} /> Volver a Usuarios
                </Link>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestión de Permisos</h1>
                        <p className="text-gray-500 mt-2 flex items-center gap-2">
                            Configurando acceso para:
                            <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <User size={14} /> {targetUser.username}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Global Admin Warning */}
                {targetUser.role === 'ADMIN' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                        <ShieldAlert className="text-blue-600 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h3 className="text-blue-900 font-semibold text-sm">Usuario Administrador Global</h3>
                            <p className="text-blue-700 text-sm mt-1 leading-relaxed">
                                Este usuario tiene el rol global <strong>ADMIN</strong>. Esto le otorga acceso total a todas las aplicaciones independientemente de la configuración individual que establezcas aquí.
                            </p>
                        </div>
                    </div>
                )}

                <UserAppRolesEditor
                    userId={targetUser.id}
                    userName={targetUser.name || targetUser.username}
                    apps={DEFAULT_APP_CONFIG}
                    initialRoles={initialRoles}
                />
            </div>
        </div>
    );
}
