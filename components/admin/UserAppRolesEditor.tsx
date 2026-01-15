'use client';

import { useState } from 'react';
import { AppDefinition } from '@/lib/app-config';
import { updateUserAppRole } from '@/actions/admin-roles';
import { toast } from 'sonner';
import { Shield, Check, AlertCircle, ChevronDown, LayoutGrid, FlaskConical, Tag, Settings } from 'lucide-react';

interface Props {
    userId: string;
    userName: string;
    apps: AppDefinition[];
    initialRoles: { appId: string, role: string }[];
}

export default function UserAppRolesEditor({ userId, userName, apps, initialRoles }: Props) {
    const [roles, setRoles] = useState<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        initialRoles.forEach(r => map[r.appId] = r.role);
        return map;
    });

    const [loading, setLoading] = useState<string | null>(null);

    const handleRoleChange = async (appId: string, newRole: string) => {
        setLoading(appId);
        try {
            const res = await updateUserAppRole(userId, appId, newRole);
            if (res.success) {
                setRoles(prev => ({ ...prev, [appId]: newRole }));
                toast.success("Permisos actualizados", {
                    icon: <Check size={16} className="text-green-500" />
                });
            } else {
                toast.error("Error al actualizar permisos");
            }
        } catch (e) {
            toast.error("Error desconocido");
        } finally {
            setLoading(null);
        }
    };

    const getGroupIcon = (group: string) => {
        switch (group) {
            case 'rd': return <FlaskConical size={14} />;
            case 'commercial': return <Tag size={14} />;
            case 'production': return <Settings size={14} />;
            default: return <LayoutGrid size={14} />;
        }
    };

    const getGroupLabel = (group: string) => {
        switch (group) {
            case 'rd': return 'I+D';
            case 'commercial': return 'Comercial';
            case 'production': return 'Producción';
            case 'direction': return 'Dirección';
            default: return group;
        }
    };

    const getGroupColor = (group: string) => {
        switch (group) {
            case 'rd': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'commercial': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'production': return 'bg-orange-50 text-orange-700 border-orange-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    return (
        <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden'
        }}>
            {/* Header of the Card */}
            <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(to right, #ffffff, #f8fafc)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px', height: '40px',
                        borderRadius: '10px',
                        background: 'var(--color-primary)',
                        color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 6px -1px rgba(62, 106, 216, 0.2)'
                    }}>
                        <Shield size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-heading)' }}>
                            Permisos de Aplicación
                        </h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            Gestiona el acceso individual a cada módulo
                        </p>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>Aplicación</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>Departamento</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>Nivel de Acceso</th>
                        </tr>
                    </thead>
                    <tbody>
                        {apps.map((app, index) => {
                            const currentRole = roles[app.id] || 'NONE';
                            const isActive = currentRole !== 'NONE';

                            return (
                                <tr key={app.id} style={{
                                    borderBottom: index === apps.length - 1 ? 'none' : '1px solid var(--color-divider)',
                                    transition: 'background 0.2s',
                                    background: isActive ? '#f8fafc' : 'white'
                                }}
                                    className="hover:bg-gray-50"
                                >
                                    <td style={{ padding: '1rem 1.5rem', width: '40%' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 500, color: 'var(--color-text-heading)' }}>{app.title}</span>
                                            {app.description && (
                                                <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                                                    {app.description}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', width: '20%' }}>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getGroupColor(app.group)}`}>
                                            {getGroupIcon(app.group)}
                                            {getGroupLabel(app.group)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', width: '40%' }}>
                                        <div className="relative">
                                            <select
                                                value={currentRole}
                                                onChange={(e) => handleRoleChange(app.id, e.target.value)}
                                                disabled={loading === app.id}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem 1rem',
                                                    paddingRight: '2.5rem',
                                                    borderRadius: '8px',
                                                    border: `1px solid ${isActive ? 'var(--color-primary-light)' : '#e2e8f0'}`,
                                                    background: 'white',
                                                    fontSize: '0.9rem',
                                                    color: isActive ? 'var(--color-primary-dark)' : '#64748b',
                                                    fontWeight: isActive ? 500 : 400,
                                                    cursor: 'pointer',
                                                    outline: 'none',
                                                    appearance: 'none', // Remove default arrow
                                                    boxShadow: isActive ? '0 0 0 1px var(--color-primary-light)' : 'none'
                                                }}
                                            >
                                                <option value="NONE">⛔ Sin Acceso</option>
                                                <option value="VIEWER">👁️ Solo Lectura (Viewer)</option>
                                                <option value="EDITOR">✏️ Editor</option>
                                                <option value="ADMIN">🛡️ Administrador</option>
                                            </select>
                                            <div style={{
                                                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                                pointerEvents: 'none', color: '#94a3b8'
                                            }}>
                                                {loading === app.id ? (
                                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <ChevronDown size={16} />
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer with legend */}
            {/* Footer with legend */}
            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                        <span style={{ fontWeight: 500 }}>Leyenda:</span>
                    </div>

                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '2px 8px', borderRadius: '4px',
                        background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c'
                    }}>
                        <AlertCircle size={12} /> <span style={{ fontWeight: 600 }}>Sin Acceso</span>
                    </div>

                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '2px 8px', borderRadius: '4px',
                        background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8'
                    }}>
                        <Check size={12} /> <span style={{ fontWeight: 600 }}>Acceso Activo</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
