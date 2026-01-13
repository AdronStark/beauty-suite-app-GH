
'use client';

import { useAppConfig } from '@/context/AppConfigContext';
import { AppDefinition } from '@/lib/app-config';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    Calendar, FileText, BarChart2, Tag,
    Microscope, Users, FlaskConical, LayoutGrid, CheckCircle2
} from 'lucide-react';
import styles from './page.module.css';
import { toast } from 'sonner';

const ICON_MAP: Record<string, any> = {
    Calendar, FileText, BarChart2, Tag,
    Microscope, Users, FlaskConical, LayoutGrid, CheckCircle2
};

const ROLES = ['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER'];
const COMPANIES = [
    { id: 'coper', name: 'Coper' },
    { id: 'jumsa', name: 'Jumsa' },
    { id: 'ternum', name: 'Ternum' },
    { id: 'cosmeprint', name: 'Cosmeprint' }
];

export default function AdminAppsPage() {
    const { apps, refreshApps } = useAppConfig();
    const [localApps, setLocalApps] = useState<AppDefinition[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setLocalApps(JSON.parse(JSON.stringify(apps)));
    }, [apps]);

    const handleToggleRole = (appId: string, role: string) => {
        setLocalApps(prev => prev.map(app => {
            if (app.id !== appId) return app;

            let newRoles: string[] = [];
            if (app.allowedRoles === 'all') {
                // If it was all, removing one means it becomes the set of ALL minus that one
                // Or rather, we switch to specific mode.
                // If user clicks a role when it's 'all', we assume they want to RESTRICT it?
                // Visual logic: If 'all' is distinct from 'all checked'. 
                // Let's implement simplification: 'all' means all checkboxes checked.
                // If allowedRoles === 'all', checking a box does nothing (it's already allowed).
                // Unchecking a box switches it to explicit array.
                newRoles = [...ROLES];
            } else {
                newRoles = [...app.allowedRoles];
            }

            if (newRoles.includes(role)) {
                newRoles = newRoles.filter(r => r !== role);
            } else {
                newRoles.push(role);
            }

            // If all roles selected, switch back to 'all'? (Optional optimization)
            const isAll = ROLES.every(r => newRoles.includes(r));

            return { ...app, allowedRoles: isAll ? 'all' : newRoles };
        }));
        setHasChanges(true);
    };

    const handleToggleCompany = (appId: string, companyId: string) => {
        setLocalApps(prev => prev.map(app => {
            if (app.id !== appId) return app;

            let newCos: string[] = [];
            const allCompanyIds = COMPANIES.map(c => c.id);

            if (app.allowedCompanies === 'all') {
                newCos = [...allCompanyIds];
            } else {
                newCos = [...app.allowedCompanies];
            }

            if (newCos.includes(companyId)) {
                newCos = newCos.filter(c => c !== companyId);
            } else {
                newCos.push(companyId);
            }

            const isAll = allCompanyIds.every(c => newCos.includes(c));
            return { ...app, allowedCompanies: isAll ? 'all' : newCos };
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        const toastId = toast.loading("Guardando configuración...");
        try {
            const res = await fetch('/api/config/apps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(localApps)
            });

            if (res.ok) {
                await refreshApps();
                setHasChanges(false);
                toast.success("Configuración actualizada", { id: toastId });
            } else {
                toast.error("Error al guardar", { id: toastId });
            }
        } catch (e) {
            toast.error("Error de red", { id: toastId });
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Gestión de Aplicaciones</h1>
                {hasChanges && (
                    <button onClick={handleSave} className={styles.saveButton}>
                        Guardar Cambios
                    </button>
                )}
            </div>

            <div className={styles.grid}>
                {localApps.map(app => {
                    const Icon = ICON_MAP[app.iconName] || FileText;
                    return (
                        <div key={app.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.appInfo}>
                                    <div className={styles.icon}>
                                        <Icon size={20} />
                                    </div>
                                    <div>
                                        <h3 className={styles.appName}>{app.title}</h3>
                                        <p className={styles.appDescription}>{app.group}</p>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: app.status === 'active' ? '#16a34a' : '#9ca3af', background: app.status === 'active' ? '#dcfce7' : '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>
                                    {app.status === 'active' ? 'ACTIVO' : 'PRÓXIMAMENTE'}
                                </div>
                            </div>

                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>Roles Permitidos</div>
                                <div className={styles.checkboxGrid}>
                                    {ROLES.map(role => {
                                        const isChecked = app.allowedRoles === 'all' || app.allowedRoles.includes(role);
                                        return (
                                            <label key={role} className={styles.checkboxLabel}>
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleToggleRole(app.id, role)}
                                                />
                                                {role}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>Empresas Permitidas</div>
                                <div className={styles.checkboxGrid}>
                                    {COMPANIES.map(co => {
                                        const isChecked = app.allowedCompanies === 'all' || app.allowedCompanies.includes(co.id);
                                        return (
                                            <label key={co.id} className={styles.checkboxLabel}>
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleToggleCompany(app.id, co.id)}
                                                />
                                                {co.name}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {hasChanges && (
                <div className={styles.saveContainer}>
                    <button onClick={handleSave} className={styles.saveButton} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
                        Guardar Cambios
                    </button>
                </div>
            )}
        </div>
    );
}
