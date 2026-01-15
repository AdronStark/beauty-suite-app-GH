
import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Enforces that the current user has a specific role for a specific application.
 * If the user is a global ADMIN, they are granted access automatically.
 * 
 * @param appId The ID of the application (e.g., 'crm', 'briefings')
 * @param allowedRoles Array of allowed roles (e.g., ['ADMIN', 'EDITOR'])
 * @returns The session object if authorized
 * @throws Error if unauthorized (should be caught by error boundary or API handler)
 */
export async function requireAppRole(appId: string, allowedRoles: string[]) {
    const session = await auth();

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    // 1. Global Admin Bypass
    // @ts-ignore
    if (session.user.role === 'ADMIN') {
        return session;
    }

    // 2. Per-App Role Check
    // @ts-ignore
    const userAppRoles = session.user.appRoles || [];

    // @ts-ignore
    const specificRole = userAppRoles.find(r => r.appId === appId)?.role;

    if (!specificRole || !allowedRoles.includes(specificRole)) {
        throw new Error("Forbidden: Insufficient permissions for this application.");
    }

    return session;
}

/**
 * Version of requireAppRole that redirects instead of throwing (for Page components)
 */
export async function protectPage(appId: string, allowedRoles: string[]) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    // @ts-ignore
    if (session.user.role === 'ADMIN') return session;

    // @ts-ignore
    const userAppRoles = session.user.appRoles || [];
    // @ts-ignore
    const specificRole = userAppRoles.find(r => r.appId === appId)?.role;

    if (!specificRole || !allowedRoles.includes(specificRole)) {
        redirect("/"); // Send back home or to 403 page
    }

    return session;
}
