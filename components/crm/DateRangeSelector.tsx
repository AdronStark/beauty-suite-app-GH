'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function DateRangeSelector() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentRange = searchParams.get('range') || 'YTD';

    const ranges = [
        { label: 'YTD', value: 'YTD' },
        { label: '1 Año', value: '1Y' },
        { label: '2 Años', value: '2Y' },
        { label: 'Todo', value: 'ALL' },
    ];

    const handleSelect = (range: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('range', range);
        router.push(`?${params.toString()}`);
    };

    return (
        <div style={{ display: 'flex', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
            {ranges.map((r) => (
                <button
                    key={r.value}
                    onClick={() => handleSelect(r.value)}
                    style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        background: currentRange === r.value ? 'var(--color-primary)' : 'transparent',
                        color: currentRange === r.value ? 'white' : '#64748b',
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        borderRight: '1px solid #e2e8f0'
                    }}
                >
                    {r.label}
                </button>
            ))}
        </div>
    );
}
