import React, { ReactNode } from 'react';

// A helper to format large numbers (e.g., 1000 -> 1k, 1500000 -> 1.5M)
const formatCompactNumber = (number: number) => {
    if (number < 1000) {
        return number.toString();
    }
    const suffixes = ["", "k", "M", "B", "T"];
    const i = Math.floor(Math.log10(number) / 3);
    const value = (number / Math.pow(1000, i));

    if (value >= 10 || value % 1 === 0) {
        return value.toFixed(0) + suffixes[i];
    } else {
        return value.toFixed(1) + suffixes[i];
    }
};

interface StatCardProps {
    title: string;
    value: number;
    icon: ReactNode;
    change?: number; // Optional: for percentage change
    changeType?: 'positive' | 'negative';
}

const ChangeIndicator: React.FC<{ change: number, type?: 'positive' | 'negative' }> = ({ change, type }) => {
    const isPositive = type === 'positive' || (type !== 'negative' && change >= 0);
    const color = isPositive ? 'text-green-400' : 'text-red-400';
    const symbol = isPositive ? '▲' : '▼';

    return (
        <span className={`flex items-center text-xs font-medium ${color}`}>
            {symbol} {Math.abs(change).toFixed(1)}%
        </span>
    );
};

export default function StatCard({ title, value, icon, change, changeType }: StatCardProps) {
    return (
        <div className="bg-slate-800/60 backdrop-blur-md shadow-xl rounded-2xl p-5 sm:p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-400">{title}</p>
                <div className="text-indigo-400">
                    {icon}
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold text-slate-50 tracking-tight">
                    {formatCompactNumber(value)}
                </p>
                {change !== undefined && (
                    <ChangeIndicator change={change} type={changeType} />
                )}
            </div>
        </div>
    );
}