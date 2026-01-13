
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { Calendar as CalendarIcon, Clock, User, AlertCircle } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, isSameDay, parseISO, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export default async function WorkloadPage() {
    // 1. Fetch Briefings with Target Date
    const briefings = await prisma.briefing.findMany({
        where: {
            targetDate: { not: null },
            status: { notIn: ['Rechazada', 'Completada'] } // Assuming these statuses exist or will exist
        },
        orderBy: { targetDate: 'asc' },
        select: {
            id: true,
            productName: true,
            clientName: true,
            targetDate: true,
            responsableTecnico: true,
            status: true,
            code: true
        }
    });

    const now = new Date();

    // Group by timeframe
    const overdue = briefings.filter(b => b.targetDate && isBefore(new Date(b.targetDate), now) && !isSameDay(new Date(b.targetDate), now));
    const today = briefings.filter(b => b.targetDate && isSameDay(new Date(b.targetDate), now));

    // Future weeks
    const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
    const next4Weeks = Array.from({ length: 4 }).map((_, i) => {
        const start = addWeeks(startOfCurrentWeek, i);
        const end = endOfWeek(start, { weekStartsOn: 1 });
        return {
            label: `Semana ${format(start, 'w')} (${format(start, 'd MH', { locale: es })} - ${format(end, 'd MH', { locale: es })})`,
            items: briefings.filter(b => {
                const d = new Date(b.targetDate!);
                return isAfter(d, now) && d >= start && d <= end;
            })
        };
    });

    const later = briefings.filter(b => {
        const d = new Date(b.targetDate!);
        const lastWeekEnd = endOfWeek(addWeeks(startOfCurrentWeek, 3), { weekStartsOn: 1 });
        return d > lastWeekEnd;
    });

    function StatusBadge({ status }: { status: string }) {
        const colors: any = {
            'Borrador': 'bg-gray-100 text-gray-600',
            'En Proceso': 'bg-blue-100 text-blue-700',
            'Validada': 'bg-green-100 text-green-700',
            'Urgente': 'bg-red-100 text-red-700'
        };
        return (
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colors[status] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    }

    function BriefingCard({ briefing }: { briefing: any }) {
        return (
            <Link href={`/briefings/wizard?id=${briefing.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                    background: 'white', padding: '1rem', borderRadius: '8px',
                    border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    display: 'flex', flexDirection: 'column', gap: '0.5rem',
                    transition: 'transform 0.2s', cursor: 'pointer'
                }} className="hover:shadow-md hover:-translate-y-1">

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{briefing.code || 'SIN CODIGO'}</span>
                        <StatusBadge status={briefing.status} />
                    </div>

                    <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>{briefing.productName}</h4>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{briefing.clientName}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #f8fafc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#64748b' }}>
                            <User size={14} /> {briefing.responsableTecnico || 'Sin asignar'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>
                            <CalendarIcon size={14} /> {format(new Date(briefing.targetDate), 'dd MMM', { locale: es })}
                        </div>
                    </div>
                </div>
            </Link>
        )
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CalendarIcon className="text-purple-600" size={32} />
                    Carga de Trabajo I+D
                </h1>
                <p style={{ color: '#64748b' }}>Visualización de fechas de entrega comprometidas.</p>
            </div>

            <div style={{ display: 'flex', gap: '2rem', overflowX: 'auto', paddingBottom: '2rem' }}>

                {/* Overdue Column */}
                <div style={{ minWidth: '300px', flex: 1, }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#ef4444', fontWeight: 700 }}>
                        <AlertCircle size={20} /> Vencidas ({overdue.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {overdue.map(b => <BriefingCard key={b.id} briefing={b} />)}
                        {overdue.length === 0 && <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontStyle: 'italic' }}>Todo al día</div>}
                    </div>
                </div>

                {/* Today Column */}
                <div style={{ minWidth: '300px', flex: 1, borderLeft: '1px solid #e2e8f0', paddingLeft: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#f59e0b', fontWeight: 700 }}>
                        <Clock size={20} /> Hoy ({today.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {today.map(b => <BriefingCard key={b.id} briefing={b} />)}
                        {today.length === 0 && <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontStyle: 'italic' }}>Nada para hoy</div>}
                    </div>
                </div>

                {/* Weeks Columns */}
                {next4Weeks.map((week, idx) => (
                    <div key={idx} style={{ minWidth: '300px', flex: 1, borderLeft: '1px solid #e2e8f0', paddingLeft: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#3b82f6', fontWeight: 700 }}>
                            <CalendarIcon size={20} /> {week.label}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {week.items.map(b => <BriefingCard key={b.id} briefing={b} />)}
                            {week.items.length === 0 && <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontStyle: 'italic' }}>-</div>}
                        </div>
                    </div>
                ))}

            </div>
        </div>
    );
}
