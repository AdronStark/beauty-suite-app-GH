'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Company, COMPANIES, getCompanyById } from '@/lib/companies';

interface CompanyContextType {
    selectedCompanyId: string | null;
    activeCompany: Company | null;
    setCompany: (id: string | null) => void;
    availableCompanies: Company[];
    allowedCompanyIds?: string | string[];
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children, allowedCompanyIds }: { children: React.ReactNode, allowedCompanyIds?: string | string[] }) {
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

    // Filter available companies
    // If allowedCompanyIds is provided, parse it (it comes as JSON string from DB/Session)
    let availableCompanies = COMPANIES;
    if (allowedCompanyIds) {
        // Handle if it's a string (JSON) or array
        let ids: string[] = [];
        try {
            // In auth.ts we passed it as is, likely a string from DB. 
            // But let's handle if it's already an array or needs parsing.
            // Actually, from session it might be string or array depending on how we typed it.
            // In DB it is String (JSON). In session callback we passed it.
            // Let's assume it might be a JSON string.
            if (typeof allowedCompanyIds === 'string') {
                ids = JSON.parse(allowedCompanyIds);
            } else if (Array.isArray(allowedCompanyIds)) {
                ids = allowedCompanyIds;
            }
        } catch (e) {
            console.error("Error parsing allowed companies", e);
        }

        if (ids.length > 0) {
            availableCompanies = COMPANIES.filter(c => ids.includes(c.id));
        }
    }

    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        // Auto-select if only one company available
        if (availableCompanies.length === 1) {
            const onlyCompany = availableCompanies[0];
            if (selectedCompanyId !== onlyCompany.id) {
                setSelectedCompanyId(onlyCompany.id);
                localStorage.setItem('lastSelectedCompany', onlyCompany.id);
            }
            return;
        }

        const saved = localStorage.getItem('lastSelectedCompany');
        // Verify saved company is allowed
        if (saved) {
            const isAllowed = availableCompanies.find(c => c.id === saved);
            if (isAllowed) {
                setSelectedCompanyId(saved);
            } else {
                setSelectedCompanyId(null);
            }
        }

        // If no selection and multiple options, redirect to selection page
        // But delay slightly or ensure we are mounted to avoid hydration mismatch?
        // Effect runs on client so it's fine.

        // Fix for Portal Users: Do not enforce company selection if we are deeper in the portal
        if (pathname?.startsWith('/portal')) return;

        if (availableCompanies.length > 1 && !selectedCompanyId && !saved && pathname !== '/select-company') {
            router.push('/select-company');
        }

    }, [availableCompanies, selectedCompanyId, pathname, router]);

    const setCompany = (id: string | null) => {
        // Enforce permission check
        if (id && !availableCompanies.find(c => c.id === id)) {
            console.warn("Attempted to switch to unauthorized company");
            return;
        }

        setSelectedCompanyId(id);
        if (id) {
            localStorage.setItem('lastSelectedCompany', id);
        } else {
            localStorage.removeItem('lastSelectedCompany');
        }
    };

    const activeCompany = selectedCompanyId ? availableCompanies.find(c => c.id === selectedCompanyId) || null : null;

    return (
        <CompanyContext.Provider value={{ selectedCompanyId, activeCompany, setCompany, availableCompanies, allowedCompanyIds }}>
            {children}
        </CompanyContext.Provider>
    );
}

export function useCompany() {
    const context = useContext(CompanyContext);
    if (context === undefined) {
        throw new Error('useCompany must be used within a CompanyProvider');
    }
    return context;
}
