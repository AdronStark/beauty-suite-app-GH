
'use client';

import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface UserOption {
    id: string;
    name: string; // fallback if parts missing
    firstName?: string;
    lastName1?: string;
    lastName2?: string;
    role: string;
    isCommercial?: boolean;
    isTechnical?: boolean;
}


interface ResponsibleCellProps {
    id: string; // offerId or briefingId
    field: 'responsableComercial' | 'responsableTecnico';
    initialValue?: string | null;
    users: UserOption[];
    apiPath?: string; // e.g. /api/ofertas (default) or /api/briefings
    readOnly?: boolean;
}

export default function ResponsibleCell({ id, field, initialValue, users, apiPath = '/api/ofertas', readOnly = false }: ResponsibleCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue || '');
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    const getDisplayName = (u: UserOption) => {
        if (u.firstName && u.lastName1) {
            return `${u.firstName} ${u.lastName1} ${u.lastName2 || ''}`.trim();
        }
        return u.name;
    };

    // Derived display value for non-editing state
    const displayValue = value || '-';

    const handleSave = async () => {
        setSaving(true);
        try {
            const url = `${apiPath}/${id}`; // construct URL dynamically
            const res = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    [field]: value
                })
            });

            if (!res.ok) throw new Error('Failed to update');

            setIsEditing(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Error al guardar responsable.');
        } finally {
            setSaving(false);
        }
    };

    if (isEditing) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <select
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    style={{
                        padding: '4px',
                        fontSize: '0.8rem',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        maxWidth: '150px'
                    }}
                    autoFocus
                >
                    <option value="">Seleccionar...</option>
                    {users
                        .filter(u => {
                            if (field === 'responsableComercial') return u.isCommercial;
                            if (field === 'responsableTecnico') return u.isTechnical;
                            return true;
                        })
                        .map(u => (
                            <option key={u.id} value={getDisplayName(u)}>
                                {getDisplayName(u)}
                            </option>
                        ))}
                </select>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <Check size={14} />
                </button>
                <button
                    onClick={() => { setIsEditing(false); setValue(initialValue || ''); }}
                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <X size={14} />
                </button>
            </div>
        );
    }

    if (readOnly) {
        return <div style={{ minHeight: '20px' }}>{displayValue}</div>;
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            style={{
                cursor: 'pointer',
                minHeight: '20px',
                minWidth: '100px',
                border: '1px solid transparent',
                borderRadius: '4px',
                padding: '2px 4px',
                transition: 'all 0.2s',
            }}
            className="hover:border-gray-300 hover:bg-gray-50"
            title="Click para editar"
        >
            {displayValue}
        </div>
    );
}
