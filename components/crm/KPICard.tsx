
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    secondaryValue?: string | React.ReactNode;
    color?: string;
    className?: string; // Allow external classes
    style?: React.CSSProperties; // Allow external styles
}

export default function KPICard({ title, value, subtext, icon: Icon, trend, trendValue, secondaryValue, color = 'var(--color-primary)', className, style }: KPICardProps) {
    return (
        <div
            className={className}
            style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.25rem', // Slightly reduced from 1.5rem
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                border: '1px solid #e2e8f0',
                height: '100%', // Ensure it fills container
                justifyContent: 'space-between',
                ...style
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>{title}</span>
                <div style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: `${color}15`, // 10% opacity
                    color: color
                }}>
                    <Icon size={20} />
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0f172a' }}>{value}</span>
                {trendValue && (
                    <span style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#64748b',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue}
                    </span>
                )}
            </div>

            {secondaryValue && (
                <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600, marginTop: '-0.25rem' }}>
                    {secondaryValue}
                </div>
            )}

            {subtext && <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{subtext}</span>}
        </div>
    );
}
