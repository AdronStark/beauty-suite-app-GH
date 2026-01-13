'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', {
            ...Object.fromEntries(formData),
            redirect: false,
        });

        // Redirect based on Role is tricky in Server Action if we don't have the session yet.
        // However, 'signIn' sets the cookie. So 'auth()' should work immediately after?
        // Let's try to get session.
        // import { auth } from '@/auth'; 
        // But auth() usage inside action...
        // Alternative: Just redirect to / and let Middleware/Page handle it.
        // OR: Special return value to client?

        // Let's rely on a helper or just redirect to root, and let a layout check handle it? 
        // Better: Fetch user by username again to check role? No, double query.

        // Let's modify logic: 
        // 1. Get username from formData
        // 2. Query DB to get Role (we have separate Prisma instance in this file? No, we need to import)
        // 3. Decide redirect URL.
        // 4. Call signIn with redirectTo.

        // Actually, best "Next-Auth v5" way:
        const username = formData.get('username') as string;

        // We can't easily check DB here without importing Prisma.
        // Let's try redirecting to '/' and having a logic there.
        // BUT user asked for specific flow.

        // Let's force a redirect to a generic loading page that redirects? No.

        // Hack: Client-side already knows if they clicked "Client" or "Worker".
        // But that's UI state.

        // Let's blindly redirect to / and ensure middleware handles "CLIENT doing / -> /portal"

        revalidatePath('/');
        redirect('/');

    } catch (error) {
        if ((error as Error).message === 'NEXT_REDIRECT') {
            throw error;
        }

        console.error('Login Error:', error);

        // DEBUG: Return raw error message to UI (Reverted to standard but keeping log)
        // const msg = (error as Error).message;
        // const type = (error as any).type;
        // return `DEBUG ERROR: ${type || 'Unknown'} - ${msg}`;
        return 'Algo salió mal. Por favor, inténtelo de nuevo.';
    }
}

export async function signOutAction() {
    await signOut({ redirectTo: '/login' });
}
