// D:\socialadify\frontend\src\components\PageTrendChart.tsx
'use client';

import React from 'react';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer 
} from 'recharts';
import { PageInsightsResponse } from '@/services/socialInsightsService';
import { format } from 'date-fns';

interface PageTrendChartProps {
    data: PageInsightsResponse['time_series'];
}

// Helper to format the date for the X-axis (e.g., "Nov 05")
const formatDate = (dateString: string) => {
    try {
        // Parse the ISO date string (YYYY-MM-DD)
        const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
        return format(date, 'MMM dd');
    } catch (e) {
        return dateString;
    }
};

// Helper to format large numbers for the Y-axis (e.g., 1500 -> 1.5k)
const formatYAxisTick = (tick: number) => {
    if (tick >= 1000000) {
        return `${(tick / 1000000).toFixed(1)}M`;
    }
    if (tick >= 1000) {
        return `${(tick / 1000).toFixed(0)}k`;
    }
    return tick.toString();
};

// Custom Tooltip component for dark mode
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const date = formatDate(label);
        return (
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3">
                <p className="text-sm font-semibold text-slate-50 mb-2">{date}</p>
                {payload.map((entry: any) => (
                    <div key={entry.name} style={{ color: entry.color }} className="flex items-center gap-2 text-sm">
                        <span>{entry.name}:</span>
                        <span className="font-bold">{entry.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function PageTrendChart({ data }: PageTrendChartProps) {
    // Format the data for the chart
    const chartData = data.map(item => ({
        ...item,
        // Format date for display on X-axis ticks
        date: formatDate(item.date), 
    }));

    return (
        <div className="h-full w-full">
            <h3 className="text-lg font-semibold text-slate-100 mb-6">
                Page Trends: Reach vs. Engagement
            </h3>
            <div className="h-[20rem] w-full"> 
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{
                            top: 5,
                            right: 10,
                            left: -20, // Adjust to make Y-axis numbers fit
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="rgb(71 85 105 / 0.5)" // slate-600 with 50% opacity
                        />
                        <XAxis 
                            dataKey="date" 
                            stroke="rgb(148 163 184)" // slate-400
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis 
                            stroke="rgb(148 163 184)" // slate-400
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={formatYAxisTick}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            wrapperStyle={{ color: 'rgb(203 213 225)' }} // slate-300
                        />
                        <Line 
                            type="monotone" 
                            dataKey="reach" 
                            name="Page Reach"
                            stroke="rgb(129 140 248)" // indigo-400
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6, style: { fill: 'rgb(129 140 248)', strokeWidth: 2 } }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="engagement" 
                            name="Page Engagement"
                            stroke="rgb(250 204 21)" // amber-400
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6, style: { fill: 'rgb(250 204 21)', strokeWidth: 2 } }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}