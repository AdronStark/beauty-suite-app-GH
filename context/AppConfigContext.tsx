
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppDefinition } from '@/lib/app-config';
import { useSession } from 'next-auth/react';
import { useCompany } from './CompanyContext';
import { toast } from 'sonner';

interface AppConfigContextType {
    apps: AppDefinition[];
    loading: boolean;
    refreshApps: () => Promise<void>;
    checkAccess: (appId: string, role?: string, companyId?: string | null) => boolean;
    getApp: (appId: string) => AppDefinition | undefined;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export function AppConfigProvider({ children }: { children: ReactNode }) {
    const [apps, setApps] = useState<AppDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const { data: session } = useSession();

    const fetchApps = useCallback(async () => {
        try {
            const res = await fetch('/api/config/apps');
            if (res.ok) {
                const data = await res.json();
                setApps(data);
            }
        } catch (e) {
            console.error("Failed to load app config", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchApps();
    }, [fetchApps]);

    const checkAccess = useCallback((appId: string, userGlobalRole?: string, companyId?: string | null) => {
        // Find app by ID or Path
        const app = apps.find(a => a.id === appId || a.path === appId);
        if (!app) return false;

        // 1. Company Check (Highest Priority Filter)
        if (app.allowedCompanies !== 'all') {
            if (!companyId) return false;
            // Handle strict string matching
            if (!app.allowedCompanies.includes(companyId)) return false;
        }

        // 2. Global Admin Bypass
        // @ts-ignore
        if (session?.user?.role === 'ADMIN') return true;
        // Prioritize session user role if passed role is undefined?
        // Actually usually userGlobalRole passed from Header matches session.user.role

        // 3. Per-App Role Check (New System)
        // @ts-ignore
        const userAppRoles = session?.user?.appRoles;
        if (Array.isArray(userAppRoles)) {
            // Check if user has ANY role for this app
            // We match against app.id
            // @ts-ignore
            const specificRole = userAppRoles.find(r => r.appId === app.id)?.role;

            if (specificRole === 'NONE') {
                return false; // Explicitly Denied
            }

            if (specificRole) {
                // User has an explicit role assigned for this app -> ACCESS GRANTED
                return true;
            }
        }

        // 4. Legacy/Global Role Fallback
        // Only if app doesn't have specific roles assigned? 
        // Or if user didn't have specific role?
        // We fall back to the static `allowedRoles` config.
        if (app.allowedRoles !== 'all') {
            const roleToCheck = userGlobalRole || (session?.user as any)?.role;
            if (!roleToCheck || !app.allowedRoles.includes(roleToCheck)) return false;
        }

        return true;
    }, [apps, session]);

    const getApp = useCallback((appId: string) => {
        return apps.find(a => a.id === appId || a.path === appId);
    }, [apps]);

    return (
        <AppConfigContext.Provider value={{ apps, loading, refreshApps: fetchApps, checkAccess, getApp }}>
            {children}
        </AppConfigContext.Provider>
    );
}

export function useAppConfig() {
    const context = useContext(AppConfigContext);
    if (!context) {
        throw new Error('useAppConfig must be used within an AppConfigProvider');
    }
    return context;
}
