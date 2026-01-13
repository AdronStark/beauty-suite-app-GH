'use client';

import { useState } from 'react';
import { assignTechnician, createFormulaForBriefing } from './actions';
import { User } from '@prisma/client'; // Just for type, not used runtime
import { toast } from 'sonner';
import { Check, User as UserIcon, TestTube } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WorkloadCard({ briefing, technicians }: { briefing: any, technicians: any[] }) {
    const [isAssigning, setIsAssigning] = useState(false);
    const [selectedTech, setSelectedTech] = useState(briefing.responsableTecnico || '');
    const router = useRouter();

    const handleAssign = async (name: string) => {
        if (!briefing.id) {
            toast.error("Error interor: Falta ID del briefing");
            return;
        }
        const res = await assignTechnician(briefing.id, name);
        if (res.success) {
            toast.success('Técnico asignado');
            setSelectedTech(name);
            setIsAssigning(false);
        } else {
            toast.error('Error al asignar');
        }
    };

    const handleCreateFormula = async () => {
        const formulaName = prompt("Nombre de la nueva fórmula:", briefing.productName);
        if (!formulaName) return;

        const res = await createFormulaForBriefing(briefing.id, formulaName);
        if (res.success) {
            toast.success('Fórmula creada');
            router.push(`/formulas?q=${encodeURIComponent(formulaName)}`); // Navigate to formula? Or just refresh
        } else {
            toast.error('Error al crear fórmula');
        }
    };

    return (
        <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{briefing.productName}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{briefing.clientName}</div>
                </div>
                <div style={{
                    fontSize: '0.7rem',
                    background: '#f1f5f9',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600
                }}>
                    {briefing.code || 'N/A'}
                </div>
            </div>

            {/* Technician Assignment */}
            <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <UserIcon size={12} /> Técnico Responsable
                </div>
                {isAssigning ? (
                    <select
                        autoFocus
                        value={selectedTech}
                        onChange={(e) => handleAssign(e.target.value)}
                        onBlur={() => setIsAssigning(false)}
                        style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    >
                        <option value="">Seleccionar...</option>
                        {technicians.map(t => (
                            <option key={t.username} value={t.name || t.username}>{t.name || t.username}</option>
                        ))}
                    </select>
                ) : (
                    <div
                        onClick={() => setIsAssigning(true)}
                        style={{
                            fontSize: '0.9rem',
                            color: selectedTech ? 'var(--color-text)' : 'var(--color-text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f8fafc',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px dashed #cbd5e1'
                        }}
                    >
                        {selectedTech || 'Sin Asignar'}
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)' }}>Cambiar</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {briefing.formulas && briefing.formulas.length > 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={14} /> {briefing.formulas.length} Fórmulas vinculadas
                    </div>
                ) : (
                    <button
                        onClick={handleCreateFormula}
                        style={{
                            flex: 1,
                            background: 'var(--color-bg)',
                            border: '1px solid var(--color-primary)',
                            color: 'var(--color-primary)',
                            fontSize: '0.85rem',
                            padding: '0.5rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            fontWeight: 500
                        }}
                    >
                        <TestTube size={14} /> Crear Fórmula
                    </button>
                )}
            </div>
        </div>
    );
}
