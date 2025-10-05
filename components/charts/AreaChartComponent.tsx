
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AreaChartProps {
    data: any[];
    dataKey: string;
    color: string;
}

const AreaChartComponent: React.FC<AreaChartProps> = ({ data, dataKey, color }) => {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                <XAxis dataKey="name" stroke="#a0aec0" />
                <YAxis stroke="#a0aec0" tickFormatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#2d3748', border: 'none', color: '#e2e8f0' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill={`url(#color${dataKey})`} />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default AreaChartComponent;
