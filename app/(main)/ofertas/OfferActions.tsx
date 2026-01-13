'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export default function OfferActions({ id }: { id: string }) {
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que quieres borrar esta oferta?')) return;

        try {
            const res = await fetch(`/api/ofertas/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                router.refresh();
            } else {
                alert('Error al borrar');
            }
        } catch (e) {
            console.error(e);
            alert('Error al borrar');
        }
    };

    return (
        <button
            onClick={handleDelete}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#ef4444',
                padding: '0.4rem',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
            title="Borrar Oferta"
        >
            <Trash2 size={18} />
        </button>
    );
}
