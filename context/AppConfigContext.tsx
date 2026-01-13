
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

    const checkAccess = useCallback((appId: string, userRole?: string, companyId?: string | null) => {
        // Find app by ID or Path
        const app = apps.find(a => a.id === appId || a.path === appId);
        if (!app) return false;

        // Check Role
        if (app.allowedRoles !== 'all') {
            if (!userRole || !app.allowedRoles.includes(userRole)) return false;
        }

        // Check Company
        if (app.allowedCompanies !== 'all') {
            if (!companyId) return false;
            // Handle strict string matching
            if (!app.allowedCompanies.includes(companyId)) return false;
        }

        return true;
    }, [apps]);

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
