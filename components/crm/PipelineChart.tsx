'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PipelineChartProps {
    data: {
        name: string;
        value: number;
        count: number;
    }[];
}

export default function PipelineChart({ data }: PipelineChartProps) {
    return (
        <div style={{ width: '100%', height: '100%', minHeight: '100px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(value) => `${value / 1000}k`}
                    />
                    <Tooltip
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                        formatter={(value: any) => [`${value?.toLocaleString()} €`, 'Valor']}
                    />
                    <Bar
                        dataKey="value"
                        fill="var(--color-primary)"
                        radius={[6, 6, 0, 0]}
                        barSize={50}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
