
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: string;
  changeColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, changeColor }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex items-center gap-6 transition hover:shadow-lg hover:scale-105 duration-300">
      <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
        {change && (
            <p className={`text-xs font-medium ${changeColor || 'text-slate-500'}`}>{change}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
