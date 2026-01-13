
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.name = token.name;
                // @ts-ignore
                session.user.role = token.role;
                // @ts-ignore
                session.user.companies = token.companies;
                // @ts-ignore
                // @ts-ignore
                session.user.connectedClientName = token.connectedClientName;
                // @ts-ignore
                session.user.firstName = token.firstName;
                // @ts-ignore
                session.user.lastName1 = token.lastName1;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role; // @ts-ignore
                token.companies = user.companies; // @ts-ignore
                token.connectedClientName = (user as any).connectedClientName;
                token.connectedClientName = (user as any).connectedClientName;
                token.name = user.name;
                // @ts-ignore
                token.firstName = (user as any).firstName;
                // @ts-ignore
                token.lastName1 = (user as any).lastName1;
            }
            return token;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnLogin = nextUrl.pathname.startsWith('/login');
            const isPublic = nextUrl.pathname.startsWith('/public') || nextUrl.pathname.startsWith('/api/auth') || nextUrl.pathname === '/icon.png';

            if (isPublic) return true;

            if (isOnLogin) {
                if (isLoggedIn) {
                    // Check Role to Redirect Correctly
                    const userRole = (auth?.user as any)?.role;
                    if (userRole === 'CLIENT') {
                        return Response.redirect(new URL('/portal/dashboard', nextUrl));
                    }
                    return Response.redirect(new URL('/', nextUrl));
                }
                return true;
            }

            if (!isLoggedIn) {
                return false;
            }

            // Protect Portal Routes
            const isPortalRoute = nextUrl.pathname.startsWith('/portal');
            const userRole = (auth?.user as any)?.role;

            if (isPortalRoute) {
                if (userRole !== 'CLIENT') {
                    return Response.redirect(new URL('/', nextUrl));
                }
            } else if (userRole === 'CLIENT' && !nextUrl.pathname.startsWith('/api')) {
                return Response.redirect(new URL('/portal/dashboard', nextUrl));
            }

            return true;
        },
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig;
