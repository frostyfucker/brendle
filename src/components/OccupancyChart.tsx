
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const data = [
  { name: 'Occupied', value: 82 },
  { name: 'Vacant', value: 18 },
];

const COLORS = ['#2563eb', '#d1d5db']; // blue-600, gray-300

const OccupancyChart: React.FC = () => {
  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
                backgroundColor: 'rgba(30, 41, 59, 0.8)', // slate-800 with opacity
                borderColor: '#475569', // slate-600
                borderRadius: '0.5rem',
            }}
            itemStyle={{ color: '#f1f5f9' }} // slate-100
          />
          <Legend iconType="circle" />
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-800 dark:fill-white text-3xl font-bold">
            82%
          </text>
           <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 dark:fill-slate-400 text-sm">
            Occupied
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OccupancyChart;
