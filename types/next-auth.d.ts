
import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            /** The user's role. */
            role: string;
            /** JSON string of allowed companies */
            companies: string;
            /** Linked client name for external users */
            connectedClientName?: string;
        } & DefaultSession["user"]
    }

    interface User {
        role: string;
        companies: string;
        connectedClientName?: string;
    }
}

declare module "next-auth/jwt" {
    /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
    interface JWT {
        role: string;
        companies: string;
        connectedClientName?: string;
    }
}
