'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', background: '#334155', color: 'white',
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600
            }}
        >
            <Printer size={16} /> Imprimir / PDF
        </button>
    );
}
