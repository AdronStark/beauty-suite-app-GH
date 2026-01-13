'use client';

import { useState } from 'react';
import { Copy, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createRevision } from '../actions';
import { toast } from 'sonner';

export default function CreateRevisionButton({ formulaId }: { formulaId: string }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateRevision = async () => {
        if (!confirm('¿Crear una nueva revisión de esta fórmula?')) return;

        setIsLoading(true);
        const res = await createRevision(formulaId);

        if (res.success && res.newFormulaId) {
            toast.success('Nueva revisión creada');
            router.push(`/formulas/${res.newFormulaId}`);
        } else {
            toast.error('Error al crear revisión');
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleCreateRevision}
            disabled={isLoading}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '6px',
                background: 'white', color: '#64748b', cursor: 'pointer',
                opacity: isLoading ? 0.7 : 1
            }}
        >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
            {isLoading ? 'Creando...' : 'Nueva Revisión'}
        </button>
    );
}
