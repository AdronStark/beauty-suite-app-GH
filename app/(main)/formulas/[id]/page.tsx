import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash, Printer, Factory, Briefcase } from 'lucide-react';
import CreateRevisionButton from './CreateRevisionButton';
import StabilityTests from './StabilityTests';
import SampleTracking from './SampleTracking';

export const dynamic = 'force-dynamic';

export default async function FormulaDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const formula = await prisma.formula.findUnique({
        where: { id },
        include: {
            briefing: true,
            stabilityTests: {
                orderBy: { date: 'desc' }
            },
            clients: true
        }
    }) as any;

    if (!formula) notFound();

    // Fetch history
    let history: any[] = [];
    if (formula.code) {
        history = await prisma.formula.findMany({
            where: { code: formula.code } as any,
            orderBy: { revision: 'desc' },
            select: { id: true, revision: true, status: true, createdAt: true }
        });
    }

    let ingredients = [];
    try {
        ingredients = JSON.parse(formula.ingredients);
    } catch (e) {
        ingredients = [];
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 2rem' }}>
            {/* Fixed Header */}
            <div style={{
                position: 'fixed', top: 'var(--header-height)', left: 0, right: 0, zIndex: 40,
                background: '#fafaf9',
                borderBottom: '1px solid var(--color-border)',
                height: '80px',
                display: 'flex', alignItems: 'center'
            }}>
                <div style={{
                    width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '0 2rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <Link href="/formulas" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                            <ArrowLeft size={16} /> Volver a la biblioteca
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1 }}>
                                {formula.name}
                            </h1>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f766e', background: '#f0fdfa', padding: '2px 8px', borderRadius: '4px', alignSelf: 'center' }}>
                                {(formula as any).code} Rev. {(formula as any).revision}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <CreateRevisionButton formulaId={formula.id} />
                        <Link href={`/formulas/${formula.id}/edit`} style={{ textDecoration: 'none' }}>
                            <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', color: '#64748b', cursor: 'pointer' }}>
                                <Edit size={16} /> Editar
                            </button>
                        </Link>
                        <Link href={`/formulas/${formula.id}/print`} target="_blank" style={{ textDecoration: 'none' }}>
                            <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', color: '#64748b', cursor: 'pointer' }}>
                                <Printer size={16} />
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            <div style={{ paddingTop: '100px', paddingBottom: '4rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: '#1e293b' }}>Ingredientes</h2>
                    {ingredients.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem', color: '#64748b', fontWeight: 500, fontSize: '0.9rem' }}>Nombre INCI / Comercial</th>
                                    <th style={{ padding: '0.75rem', color: '#64748b', fontWeight: 500, fontSize: '0.9rem', textAlign: 'right' }}>%</th>
                                    <th style={{ padding: '0.75rem', color: '#64748b', fontWeight: 500, fontSize: '0.9rem' }}>Fase</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ingredients.map((ing: any, i: number) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                                        <td style={{ padding: '0.75rem', color: '#334155' }}>{ing.name}</td>
                                        <td style={{ padding: '0.75rem', color: '#334155', textAlign: 'right', fontWeight: 600 }}>{ing.percentage}%</td>
                                        <td style={{ padding: '0.75rem', color: '#64748b' }}>{ing.phase}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin ingredientes definidos.</p>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>Detalles</h3>

                        {/* Ownership Badge */}
                        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600,
                                background: formula.ownership === 'CLIENTE' ? '#eff6ff' : '#f0fdfa',
                                color: formula.ownership === 'CLIENTE' ? '#1d4ed8' : '#0f766e',
                                border: formula.ownership === 'CLIENTE' ? '1px solid #bfdbfe' : '1px solid #99f6e4'
                            }}>
                                {formula.ownership === 'CLIENTE' ? <Briefcase size={14} /> : <Factory size={14} />}
                                {formula.ownership === 'CLIENTE' ? 'Propiedad de Cliente' : 'Fórmula Propia'}
                            </div>
                        </div>

                        {/* Associated Clients */}
                        {formula.clients && formula.clients.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                                    {formula.ownership === 'CLIENTE' ? 'Cliente Propietario:' : 'Clientes Asociados:'}
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {formula.clients.map((c: any) => (
                                        <span key={c.id} style={{ fontSize: '0.9rem', color: '#334155' }}>• {c.name}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.6 }}>
                            {formula.description || 'Sin descripción'}
                        </p>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                            Creada: {new Date(formula.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    {history.length > 0 && (
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>Historial de Revisiones</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {history.map((rev) => (
                                    <Link
                                        key={rev.id}
                                        href={`/formulas/${rev.id}`}
                                        style={{
                                            padding: '0.75rem', borderRadius: '8px',
                                            background: rev.id === formula.id ? '#f0fdfa' : '#f8fafc',
                                            border: rev.id === formula.id ? '1px solid #99f6e4' : '1px solid #f1f5f9',
                                            textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: rev.id === formula.id ? '#0f766e' : '#64748b' }}>
                                                Rev. {rev.revision}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                {new Date(rev.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <span style={{
                                            fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px',
                                            background: rev.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                                            color: rev.status === 'Active' ? '#166534' : '#64748b'
                                        }}>
                                            {rev.status === 'Active' ? 'Activa' : 'Borrador'}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    <StabilityTests formulaId={formula.id} tests={formula.stabilityTests || []} />
                    <SampleTracking formulaId={formula.id} samples={formula.samples || []} />
                </div>
            </div>
        </div>
    );
}
