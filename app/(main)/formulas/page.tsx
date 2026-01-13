import { prisma } from '@/lib/db/prisma';
import { Beaker } from 'lucide-react';
import Link from 'next/link';

import FormulaTable from '@/components/formulas/FormulaTable';

export const dynamic = 'force-dynamic';

export default async function FormulasPage({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string }> }) {
    const params = await searchParams;
    const query = params.q || '';
    const category = params.cat || 'ALL';

    const where: any = {
        status: 'Active'
    };

    if (query) {
        where.name = { contains: query };
    }

    if (category !== 'ALL') {
        where.category = category;
    }

    const formulas = await prisma.formula.findMany({
        where,
        orderBy: { name: 'asc' },
        include: { clients: true }
    });

    // Count revisions per formula code
    const revisionCounts = await prisma.formula.groupBy({
        by: ['code'],
        _count: {
            revision: true
        }
    });

    // Create a map for quick lookup: code -> count
    const revisionMap = new Map<string, number>();
    revisionCounts.forEach(item => {
        if (item.code) revisionMap.set(item.code, item._count.revision);
    });

    // Merge data
    const enrichedFormulas = formulas.map(f => ({
        ...f,
        revisionCount: (f.code && revisionMap.get(f.code)) || 0
    }));

    const categories = ['Facial', 'Corporal', 'Capilar', 'Solar', 'Higienizante'];
    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Beaker className="text-blue-600" size={32} />
                        Biblioteca de Fórmulas
                    </h1>
                    <p style={{ color: '#64748b' }}>Repositorio de fórmulas estándar y base.</p>
                </div>

                <Link href="/formulas/new" style={{ textDecoration: 'none' }}>
                    <button
                        style={{
                            background: 'var(--color-primary)', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px',
                            border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(62, 106, 216, 0.2)'
                        }}
                    >
                        <Beaker size={18} /> Nueva Fórmula
                    </button>
                </Link>
            </div>

            {/* Table View */}
            <FormulaTable formulas={enrichedFormulas as any} />
        </div>
    );
}
