import DirectionLayout from './DirectionLayout';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Dirección - Labery Beauty App Suite',
    description: 'Cuadro de mando y KPIs estratégicos de la suite.',
};

export default async function DireccionPage() {
    const session = await auth();
    // @ts-ignore - Check augmented role
    const role = session?.user?.role;

    if (role !== 'ADMIN' && role !== 'MANAGER') {
        redirect('/');
    }

    return <DirectionLayout />;
}
