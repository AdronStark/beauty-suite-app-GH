'use client';

import React, { useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

interface ProtectedFieldProps {
    label?: string;
    value: string; // Display value
    children: React.ReactNode; // The input component
    protectionMessage?: string;
    isProtecting?: boolean; // If false, always editable (bypass protection)
    className?: string;
}

export function ProtectedField({
    label,
    value,
    children,
    protectionMessage = "Este campo está protegido para evitar errores. ¿Seguro que quieres editarlo?",
    isProtecting = true,
    className
}: ProtectedFieldProps) {
    const [isEditing, setIsEditing] = useState(!isProtecting);

    const handleUnlock = () => {
        if (!isProtecting) {
            setIsEditing(true);
            return;
        }

        // Use standard confirm for simplicity and robustness, or could be a custom modal.
        // For "Super App" feel, a custom small popover would be nice, but confirm is native and safe.
        // User asked: "sino que te pregunte si quieres editarlo cuando clicas en el"
        if (confirm(protectionMessage)) {
            setIsEditing(true);
            toast.info("Campo desbloqueado para edición");
        }
    };

    if (isEditing) {
        return (
            <div className={className} style={{ position: 'relative' }}>
                {children}
            </div>
        );
    }

    return (
        <div className={className} onClick={handleUnlock} style={{ cursor: 'pointer', position: 'relative', opacity: 1 }}>
            {/* Visual Indicator of Locked State */}
            <div style={{
                borderBottom: '1px dashed #cbd5e1',
                padding: '0.25rem 0',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: '27px'
            }}>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {value || <span style={{ color: '#94a3b8', fontWeight: 400 }}>- Sin definir -</span>}
                </span>
                <Lock size={12} style={{ color: '#94a3b8' }} />
            </div>
        </div>
    );
}
