'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, Plus, Edit, Trash2, Search, X, Check, Shield, Briefcase
} from 'lucide-react';
import Toast, { ToastType } from '@/components/ui/Toast';
import { COMPANIES } from '@/lib/companies';
import { User } from 'next-auth'; // Use type (will have augmentations hopefully)

// Local User Interface for Component State
interface AppUser {
    id: string;
    username: string;
    name: string | null;
    firstName?: string;
    lastName1?: string;
    lastName2?: string;
    position?: string;
    isCommercial?: boolean;
    isTechnical?: boolean;
    role: string;
    connectedClientName?: string | null;
    companies: string; // JSON string from DB, needs parsing
    createdAt: string;
}

export default function UsersAdminPage() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'worker' | 'client'>('worker');
    const [editingUser, setEditingUser] = useState<AppUser | null>(null);

    const router = useRouter();

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                setToast({ message: "Error al cargar usuarios. Verifica tus permisos.", type: "error" });
            }
        } catch (e) {
            setToast({ message: "Error de conexión.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setToast({ message: "Usuario eliminado.", type: "success" });
                fetchUsers();
            } else {
                setToast({ message: "Error al eliminar usuario.", type: "error" });
            }
        } catch (e) {
            setToast({ message: "Error de conexión.", type: "error" });
        }
    };

    const handleEdit = (user: AppUser) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCreate = (mode: 'worker' | 'client') => {
        setEditingUser(null);
        setModalMode(mode);
        setIsModalOpen(true);
    };

    // Filtered Users
    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Users size={32} className="text-primary" />
                        Gestión de Usuarios
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '4px' }}>Administra el acceso y roles de la plataforma.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => handleCreate('worker')}
                        style={{
                            background: 'white', color: '#475569', border: '1px solid #cbd5e1',
                            padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                            boxShadow: '0 2px 4px -1px rgba(0,0,0,0.05)'
                        }}
                    >
                        <Users size={20} /> Nuevo Trabajador
                    </button>
                    <button
                        onClick={() => handleCreate('client')}
                        style={{
                            background: 'var(--color-primary)', color: 'white', border: 'none',
                            padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                        }}
                    >
                        <Plus size={20} /> Nuevo Cliente
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Search size={20} color="#94a3b8" />
                <input
                    type="text"
                    placeholder="Buscar por usuario o nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ border: 'none', outline: 'none', fontSize: '1rem', width: '100%', color: '#1e293b' }}
                />
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuario / Nombre</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cargo / Puesto</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rol</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Empresas</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Cargando usuarios...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No se encontraron usuarios.</td></tr>
                        ) : (
                            filteredUsers.map(user => {
                                let userCompanies: string[] = [];
                                try {
                                    userCompanies = JSON.parse(user.companies);
                                } catch (e) { }

                                return (
                                    <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{user.username}</div>
                                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{user.name || '-'}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.9rem', color: '#1e293b' }}>{user.position || '-'}</div>
                                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                                {user.isCommercial && <span style={{ fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>COM</span>}
                                                {user.isTechnical && <span style={{ fontSize: '0.65rem', background: '#f0fdf4', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>TEC</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                background: user.role === 'ADMIN' ? '#eff6ff' : user.role === 'MANAGER' ? '#f0fdf4' : '#f8fafc',
                                                color: user.role === 'ADMIN' ? '#1d4ed8' : user.role === 'MANAGER' ? '#15803d' : '#475569',
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700,
                                                border: '1px solid transparent',
                                                borderColor: user.role === 'ADMIN' ? '#bfdbfe' : user.role === 'MANAGER' ? '#bbf7d0' : '#e2e8f0'
                                            }}>
                                                {user.role}
                                            </span>
                                            {user.role === 'CLIENT' && user.connectedClientName && (
                                                <div style={{ fontSize: '0.75rem', marginTop: '4px', color: '#b45309', fontWeight: 600 }}>
                                                    {user.connectedClientName}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                {userCompanies.map(cid => {
                                                    const comp = COMPANIES.find(c => c.id === cid);
                                                    return (
                                                        <span key={cid} style={{
                                                            fontSize: '0.75rem', background: 'white', border: '1px solid #e2e8f0',
                                                            padding: '2px 6px', borderRadius: '4px', color: '#64748b'
                                                        }}>
                                                            {comp ? comp.name : cid}
                                                        </span>
                                                    )
                                                })}
                                                {userCompanies.length === 0 && <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Ninguna</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button onClick={() => handleEdit(user)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#64748b' }}>
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(user.id)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fef2f2', cursor: 'pointer', color: '#ef4444' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <UserModal
                    user={editingUser}
                    initialMode={editingUser ? (editingUser.role === 'CLIENT' ? 'client' : 'worker') : modalMode}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => { setIsModalOpen(false); fetchUsers(); setToast({ message: editingUser ? "Usuario actualizado" : "Usuario creado", type: "success" }); }}
                />
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

function UserModal({ user, initialMode, onClose, onSuccess }: { user: AppUser | null, initialMode: 'worker' | 'client', onClose: () => void, onSuccess: () => void }) {
    const isEdit = !!user;
    const [mode] = useState<'worker' | 'client'>(initialMode);

    // Client Fetching
    const [clients, setClients] = useState<{ id: string, name: string }[]>([]);
    useEffect(() => {
        if (mode === 'client') {
            fetch('/api/clients')
                .then(res => res.json())
                .then(data => setClients(data))
                .catch(err => console.error("Error loading clients", err));
        }
    }, [mode]);

    const [formData, setFormData] = useState({
        username: user?.username || '',
        name: user?.name || '',
        firstName: user?.firstName || '',
        lastName1: user?.lastName1 || '',
        lastName2: user?.lastName2 || '',
        position: user?.position || '',
        isCommercial: user?.isCommercial || false,
        isTechnical: user?.isTechnical || false,
        password: '',
        role: user?.role || (mode === 'client' ? 'CLIENT' : 'VIEWER'),
        connectedClientName: user?.connectedClientName || '',
        companies: user ? JSON.parse(user.companies) as string[] : [] as string[]
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helpers for username generation
    const generateSimpleUsername = (clientName: string) => {
        return clientName
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[,.]/g, "") // Remove punctuation
            .replace(/\s+(sl|sa|scp|srl)$/, "") // Remove common suffixes
            .trim()
            .replace(/\s+/g, ""); // Remove spaces
    };

    const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const clientName = e.target.value;
        if (!clientName) return;

        // Auto-fill logic
        const simpleUser = generateSimpleUsername(clientName);
        setFormData(prev => ({
            ...prev,
            connectedClientName: clientName,
            username: !isEdit ? simpleUser : prev.username, // Only auto-fill username on create
            role: 'CLIENT'
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        if (!isEdit && !formData.password) {
            setError("La contraseña es obligatoria para nuevos usuarios.");
            setIsSaving(false);
            return;
        }

        try {
            const url = isEdit ? `/api/users/${user.id}` : '/api/users';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                onSuccess();
            } else {
                const txt = await res.text();
                setError(txt || "Error al guardar.");
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleCompany = (id: string) => {
        setFormData(prev => {
            const exists = prev.companies.includes(id);
            if (exists) return { ...prev, companies: prev.companies.filter(c => c !== id) };
            return { ...prev, companies: [...prev.companies, id] };
        });
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        {isEdit ? 'Editar Usuario' : (mode === 'client' ? 'Nuevo Usuario Cliente' : 'Nuevo Trabajador')}
                    </h2>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem' }}>{error}</div>}

                    {/* Client Selector for Client Mode */}
                    {mode === 'client' && (
                        <div style={{ background: '#FFFBEB', padding: '1rem', borderRadius: '8px', border: '1px solid #FCD34D', marginBottom: '0.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#B45309', marginBottom: '6px' }}>
                                Seleccionar Cliente
                            </label>
                            <select
                                value={formData.connectedClientName}
                                onChange={handleClientSelect}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #F59E0B', background: 'white', color: '#1e293b' }}
                                disabled={isEdit}
                            >
                                <option value="">-- Seleccionar Cliente --</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                            <p style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '6px', lineHeight: '1.4' }}>
                                Al seleccionar un cliente, se generará automáticamente un nombre de usuario simplificado.
                            </p>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Usuario (Login)</label>
                            <input
                                required
                                type="text"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: isEdit ? '#f8fafc' : 'white', fontWeight: 'bold' }}
                                disabled={isEdit}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Nombre</label>
                            <input
                                required
                                type="text"
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value, name: `${e.target.value} ${formData.lastName1} ${formData.lastName2}`.trim() })}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Apellido 1</label>
                            <input
                                required
                                type="text"
                                value={formData.lastName1}
                                onChange={e => setFormData({ ...formData, lastName1: e.target.value, name: `${formData.firstName} ${e.target.value} ${formData.lastName2}`.trim() })}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Apellido 2</label>
                            <input
                                type="text"
                                value={formData.lastName2}
                                onChange={e => setFormData({ ...formData, lastName2: e.target.value, name: `${formData.firstName} ${formData.lastName1} ${e.target.value}`.trim() })}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Cargo / Puesto</label>
                        <div style={{ position: 'relative' }}>
                            <Briefcase size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                value={formData.position}
                                onChange={e => setFormData({ ...formData, position: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                placeholder="Ej. Responsable I+D"
                            />
                        </div>
                    </div>

                    {mode === 'worker' && (
                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.isCommercial}
                                    onChange={e => setFormData({ ...formData, isCommercial: e.target.checked })}
                                    style={{ width: '16px', height: '16px' }}
                                />
                                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#475569' }}>Resp. Comercial</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.isTechnical}
                                    onChange={e => setFormData({ ...formData, isTechnical: e.target.checked })}
                                    style={{ width: '16px', height: '16px' }}
                                />
                                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#475569' }}>Resp. Técnico</span>
                            </label>
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                            {isEdit ? 'Contraseña (Dejar en blanco para no cambiar)' : 'Contraseña'}
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            placeholder={isEdit ? "••••••••" : ""}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Rol</label>
                        {mode === 'client' ? (
                            <div style={{ padding: '0.6rem', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontWeight: 600, fontSize: '0.9rem' }}>
                                CLIENT (Portal Cliente)
                            </div>
                        ) : (
                            <select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            >
                                <option value="VIEWER">VIEWER (Lectura)</option>
                                <option value="OPERATOR">OPERATOR (Operario)</option>
                                <option value="MANAGER">MANAGER (Gestor)</option>
                                <option value="ADMIN">ADMIN (Total)</option>
                            </select>
                        )}
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Empresas Autorizadas</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {COMPANIES.map(c => {
                                const checked = formData.companies.includes(c.id);
                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => toggleCompany(c.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px',
                                            borderRadius: '8px', border: `1px solid ${checked ? c.color : '#e2e8f0'}`,
                                            background: checked ? `${c.color}10` : 'white', cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{
                                            width: '18px', height: '18px', borderRadius: '4px', border: `1px solid ${checked ? c.color : '#cbd5e1'}`,
                                            background: checked ? c.color : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {checked && <Check size={12} color="white" />}
                                        </div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#475569' }}>{c.name}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 600, cursor: isSaving ? 'wait' : 'pointer', opacity: isSaving ? 0.7 : 1 }}
                        >
                            {isSaving ? 'Guardando...' : 'Guardar Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
