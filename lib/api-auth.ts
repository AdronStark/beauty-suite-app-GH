import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * API Authentication and Authorization Wrapper
 * 
 * Usage:
 * export const GET = withAuth(async (req, ctx, session) => {
 *     // Your handler code here
 * }, { roles: ['ADMIN', 'MANAGER'] });
 */

type Handler = (req: Request, ctx: any, session: any) => Promise<NextResponse>;

interface AuthOptions {
    /** Global roles allowed (e.g., ['ADMIN', 'MANAGER']) */
    roles?: string[];
    /** App ID for per-app role checking */
    appId?: string;
    /** App-specific roles required */
    appRoles?: string[];
    /** If true, allows any authenticated user */
    anyAuthenticated?: boolean;
}

export function withAuth(handler: Handler, options: AuthOptions = { anyAuthenticated: true }) {
    return async (req: Request, ctx: any) => {
        try {
            const session = await auth();

            if (!session?.user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const userRole = (session.user as any).role;

            // Global admin bypass - admins can do everything
            if (userRole === "ADMIN") {
                return handler(req, ctx, session);
            }

            // If specific global roles are required
            if (options.roles && options.roles.length > 0) {
                if (!options.roles.includes(userRole)) {
                    return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
                }
            }

            // Check app-specific roles if specified
            if (options.appId && options.appRoles && options.appRoles.length > 0) {
                const userAppRoles = (session.user as any).appRoles || [];
                const appRole = userAppRoles.find((r: any) => r.appId === options.appId)?.role;
                if (!appRole || !options.appRoles.includes(appRole)) {
                    return NextResponse.json({ error: "Forbidden: No access to this application" }, { status: 403 });
                }
            }

            // If we reach here and anyAuthenticated is true (default), allow access
            return handler(req, ctx, session);

        } catch (error) {
            console.error("[withAuth] Error:", error);
            return NextResponse.json({ error: "Authentication error" }, { status: 500 });
        }
    };
}

/**
 * Standardized API Error Handler
 * Hides internal details in production, shows them in development
 */
export class ApiError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = "ApiError";
    }
}

export function handleApiError(error: unknown, context?: string) {
    if (context) {
        console.error(`[${context}]`, error);
    } else {
        console.error("[API Error]", error);
    }

    if (error instanceof ApiError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    // In development, show more details
    if (process.env.NODE_ENV === "development") {
        return NextResponse.json(
            { error: (error as Error).message || "Unknown error" },
            { status: 500 }
        );
    }

    // In production, hide internal details
    return NextResponse.json(
        { error: "An unexpected error occurred. Please try again later." },
        { status: 500 }
    );
}
