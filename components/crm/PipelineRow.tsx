
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getStatusColor } from '@/lib/statusColors';
import { formatCurrency } from '@/lib/formatters';
import { useSearchParams } from 'next/navigation';
import { differenceInDays } from 'date-fns';
import { Check, X, Clock } from 'lucide-react';

export default function PipelineRow({ offer }: { offer: any }) {
    const searchParams = useSearchParams();
    const rowRef = useRef<HTMLTableRowElement>(null);
    const highlightId = searchParams.get('highlight');

    // Scroll into view if highlighted
    useEffect(() => {
        if (highlightId === offer.id && rowRef.current) {
            rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            rowRef.current.style.backgroundColor = '#fef3c7'; // Amber-100 highlight
            setTimeout(() => {
                if (rowRef.current) rowRef.current.style.backgroundColor = 'transparent';
            }, 3000);
        }
    }, [highlightId, offer.id]);

    // Probability Logic
    const [probability, setProbability] = useState(offer.probability);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(probability || 0);
    const [saving, setSaving] = useState(false);

    // Calculate derived values for display (if null, use heuristic)
    const displayProb = probability !== null ? probability : getHeuristicProb(offer.status);

    // Status Heuristic
    function getHeuristicProb(status: string) {
        switch (status) {
            case 'Borrador': return 10;
            case 'Pendiente de validar': return 30;
            case 'Validada': return 50;
            case 'Enviada': return 70;
            case 'Aceptada':
            case 'Adjudicada': return 100;
            case 'Rechazada': return 0;
            default: return 0;
        }
    }

    let probColor = '#ef4444'; // Low
    if (displayProb >= 50) probColor = '#f59e0b'; // Med
    if (displayProb >= 80) probColor = '#10b981'; // High
    if (offer.status === 'Aceptada' || offer.status === 'Adjudicada') probColor = '#10b981';

    let value = 0;
    try {
        const summary = JSON.parse(offer.resultsSummary || '{}');
        value = parseFloat(summary.totalValue || '0');
    } catch (e) { }


    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/ofertas/${offer.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ probability: parseInt(String(editValue), 10) })
            });
            if (!res.ok) throw new Error("Update failed");

            setProbability(parseInt(String(editValue), 10));
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            alert("Error al actualizar");
        } finally {
            setSaving(false);
        }
    };

    return (
        <tr ref={rowRef} key={offer.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.5s' }}>
            <td style={{ padding: '1rem', fontWeight: 500, color: '#334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {offer.code || '-'}
                    {offer.revision !== undefined && offer.revision !== null && (
                        <span style={{
                            fontSize: '0.7rem',
                            background: '#f1f5f9',
                            color: '#64748b',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            border: '1px solid #e2e8f0'
                        }}>
                            v{offer.revision}
                        </span>
                    )}
                </div>
            </td>
            <td style={{ padding: '1rem', color: '#0f172a', fontWeight: 500 }}>
                <Link href={`/crm/clients/${encodeURIComponent(offer.client)}`} style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px dashed #94a3b8' }}>
                    {offer.client}
                </Link>
            </td>
            <td style={{ padding: '1rem', color: '#475569' }}>{offer.product}</td>
            <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 600 }}>
                {value > 0 ? formatCurrency(value, 0) + ' €' : '-'}
            </td>
            <td style={{ padding: '1rem' }}>
                {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={editValue}
                            onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                            style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                            autoFocus
                        />
                        <button onClick={handleSave} disabled={saving} style={{ color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer' }}><Check size={16} /></button>
                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                if (!confirm("¿Deseas restablecer la probabilidad a 'Indefinida'?")) {
                                    setIsEditing(false);
                                    return;
                                }

                                setSaving(true);
                                try {
                                    const res = await fetch(`/api/ofertas/${offer.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ probability: null }) // Send null to reset
                                    });
                                    if (!res.ok) throw new Error("Reset failed");
                                    setProbability(null);
                                    setIsEditing(false);
                                } catch (error) {
                                    alert("Error al restablecer");
                                } finally {
                                    setSaving(false);
                                }
                            }}
                            disabled={saving}
                            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                            title="Restablecer a Indefinida"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                        title="Click para editar probabilidad"
                        onClick={() => { setEditValue(displayProb); setIsEditing(true); }}
                    >
                        {probability === null ? (
                            <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600, background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>
                                Indefinida
                            </span>
                        ) : (
                            <>
                                <div style={{ height: '6px', width: '50px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${displayProb}%`, background: probColor }} />
                                </div>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{displayProb}%</span>
                            </>
                        )}
                    </div>
                )}
            </td>
            <td style={{ padding: '1rem' }}>
                <span style={{
                    display: 'inline-flex',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: getStatusColor(offer.status),
                    color: 'white'
                }}>
                    {offer.status}
                </span>
            </td>
            <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                {new Date(offer.updatedAt).toLocaleDateString()}
            </td>
            <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                {/* Aging Display */}
                {(() => {
                    if (['Adjudicada', 'Aceptada', 'Rechazada', 'Perdida'].includes(offer.status)) {
                        return <span style={{ color: '#94a3b8' }}>-</span>;
                    }
                    const daysOpen = Math.max(0, differenceInDays(new Date(), new Date(offer.createdAt)));
                    const isOld = daysOpen > 60;
                    return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isOld ? '#ef4444' : '#64748b', fontWeight: isOld ? 600 : 400 }}>
                            {isOld && <Clock size={14} />}
                            {daysOpen} días
                        </div>
                    )
                })()}
            </td>
            <td style={{ padding: '1rem' }}>
                <Link href={`/ofertas/editor/${offer.id}?mode=readonly`} style={{ color: '#3b82f6', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500 }}>
                    Ver
                </Link>
            </td>
        </tr>
    );
}
