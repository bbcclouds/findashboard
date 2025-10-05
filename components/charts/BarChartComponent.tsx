import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BarChartProps {
  data: { name: string; value: number }[];
  colors: string[];
}

const BarChartComponent: React.FC<BarChartProps> = ({ data, colors }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" horizontal={false} />
        <XAxis type="number" stroke="#a0aec0" tickFormatter={(value) => `$${Number(value).toLocaleString()}`} tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="name" stroke="#a0aec0" width={100} tick={{ fontSize: 12 }} interval={0} />
        <Tooltip
          contentStyle={{ backgroundColor: '#2d3748', border: 'none', color: '#e2e8f0' }}
          formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
        />
        <Bar dataKey="value">
            {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarChartComponent;