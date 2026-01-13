import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { Printer } from 'lucide-react';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';

export default async function FormulaPrintPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const formula = await prisma.formula.findUnique({
        where: { id },
    }) as any;

    if (!formula) notFound();

    let ingredients = [];
    try {
        ingredients = JSON.parse(formula.ingredients);
    } catch (e) {
        ingredients = [];
    }

    // Sort ingredients by percentage desc
    ingredients.sort((a: any, b: any) => b.percentage - a.percentage);

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif', color: '#000' }}>

            <div className="print-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #000' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>FICHA TÉCNICA DE FÓRMULA</h1>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#444' }}>Laboratorio I+D</p>
                </div>
                <div className="no-print">
                    <PrintButton />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div>
                    <div style={{ marginBottom: '10px' }}>
                        <span style={{ fontWeight: 'bold', display: 'block', fontSize: '12px', color: '#666' }}>CÓDIGO</span>
                        <span style={{ fontSize: '18px' }}>{formula.code}</span>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <span style={{ fontWeight: 'bold', display: 'block', fontSize: '12px', color: '#666' }}>NOMBRE</span>
                        <span style={{ fontSize: '18px' }}>{formula.name}</span>
                    </div>
                </div>
                <div>
                    <div style={{ marginBottom: '10px' }}>
                        <span style={{ fontWeight: 'bold', display: 'block', fontSize: '12px', color: '#666' }}>REVISIÓN</span>
                        <span style={{ fontSize: '18px' }}>{formula.revision}</span>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <span style={{ fontWeight: 'bold', display: 'block', fontSize: '12px', color: '#666' }}>FECHA</span>
                        <span style={{ fontSize: '18px' }}>{new Date(formula.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px', fontSize: '16px', textTransform: 'uppercase' }}>Descripción</h3>
                <p style={{ lineHeight: 1.5, fontSize: '14px' }}>{formula.description || 'Sin descripción disponible.'}</p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px', fontSize: '16px', textTransform: 'uppercase' }}>Composición Cualitativa-Cuantitativa</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #000' }}>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Fase</th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Ingrediente</th>
                            <th style={{ textAlign: 'right', padding: '8px' }}>%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ingredients.map((ing: any, i: number) => (
                            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '8px' }}>{ing.phase}</td>
                                <td style={{ padding: '8px' }}>{ing.name}</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>{ing.percentage.toFixed(2)}%</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold' }}>
                            <td colSpan={2} style={{ padding: '8px', textAlign: 'right' }}>TOTAL</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>100.00%</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <div style={{ width: '30%', borderTop: '1px solid #000', paddingTop: '5px', textAlign: 'center' }}>
                    Firma Responsable I+D
                </div>
                <div style={{ width: '30%', borderTop: '1px solid #000', paddingTop: '5px', textAlign: 'center' }}>
                    Firma Dirección Técnica
                </div>
            </div>

        </div>
    );
}
