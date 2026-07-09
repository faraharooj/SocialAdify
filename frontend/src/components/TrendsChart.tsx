// D:\socialadify\frontend\src\components\TrendsChart.tsx
'use client';

import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
    Title, Tooltip, Legend, Filler, ChartOptions, TooltipItem, ChartData
} from 'chart.js';
import { TrendPoint } from '@/services/insightsService';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
);

export interface TrendsChartProps {
    data: TrendPoint[];
    isLoading: boolean;
    error: string | null;
}

const TrendsChart: React.FC<TrendsChartProps> = ({ data, isLoading, error }) => {
    
    // The chart's data configuration remains the same
    const chartDataConfig: ChartData<'line'> = {
        labels: data.map(item => new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [
            {
                label: 'Clicks',
                data: data.map(item => item.clicks),
                borderColor: 'rgb(129, 140, 248)', // Brighter Indigo
                backgroundColor: 'rgba(129, 140, 248, 0.2)',
                yAxisID: 'yClicks',
                tension: 0.4, fill: 'origin', pointRadius: 2, pointHoverRadius: 5,
            },
            {
                label: 'Impressions',
                data: data.map(item => item.impressions),
                borderColor: 'rgb(52, 211, 153)', // Brighter Green (Emerald)
                backgroundColor: 'rgba(52, 211, 153, 0.2)',
                yAxisID: 'yImpressions',
                tension: 0.4, fill: 'origin', pointRadius: 2, pointHoverRadius: 5,
            }
        ],
    };

    // --- MODIFIED: Chart options updated for dark theme readability ---
    const chartOptions: ChartOptions<'line'> = {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
            legend: { 
                position: 'top' as const, 
                labels: { 
                    usePointStyle: true, 
                    boxWidth: 8, 
                    padding: 20, 
                    color: '#cbd5e1', // Slate 300 for text
                    font: {size: 13} 
                }
            },
            title: { display: false }, 
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.8)', // Slate 900
                titleColor: '#f1f5f9', // Slate 100
                bodyColor: '#cbd5e1', // Slate 300
                titleFont: {size: 13}, 
                bodyFont: {size: 12},
                callbacks: {
                    label: function(context: TooltipItem<'line'>) {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== null) label += context.parsed.y.toLocaleString();
                        return label;
                    }
                }
            },
        },
        scales: {
            x: { 
                grid: { display: false }, 
                ticks: { color: '#94a3b8', font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 7 } // Slate 400 for ticks
            },
            yClicks: {
                type: 'linear' as const, display: true, position: 'left' as const, beginAtZero: true,
                grid: { color: 'rgba(100, 116, 139, 0.2)' }, // Slate 500 with opacity
                ticks: { font: { size: 11 }, color: 'rgb(129, 140, 248)', padding: 5, callback: value => Number(value).toLocaleString() },
                title: { display: true, text: 'Clicks', color: 'rgb(129, 140, 248)', font: {size: 12, weight: 600}}
            },
            yImpressions: {
                type: 'linear' as const, display: true, position: 'right' as const, beginAtZero: true,
                grid: { drawOnChartArea: false }, 
                ticks: { font: { size: 11 }, color: 'rgb(52, 211, 153)', padding: 5, callback: value => Number(value).toLocaleString() },
                title: { display: true, text: 'Impressions', color: 'rgb(52, 211, 153)', font: {size: 12, weight: 600}}
            }
        },
    };

    // --- MODIFIED: Render states updated for dark theme ---
    if (isLoading) { 
        return (
            <div className="flex items-center justify-center h-[350px] md:h-[400px]">
                <div className="text-center text-slate-400">
                    <div className="w-10 h-10 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3"></div>
                    <p>Loading Performance Trends...</p>
                </div>
            </div>
        );
    }

    if (error) { 
        return (
            <div className="flex items-center justify-center h-[350px] md:h-[400px] text-red-300 bg-red-900/30 p-4 rounded-lg border border-red-700" role="alert">
                <div>
                    <p className="font-bold text-center">Error Loading Trends</p>
                    <p className="text-sm text-center mt-1">{error}</p>
                </div>
            </div>
        );
    }

    if (data.length === 0) { 
        return (
            <div className="flex items-center justify-center h-[350px] md:h-[400px] text-slate-400">
                <p>No trend data available for the selected period.</p>
            </div>
        );
    }
    
    return (
        // The parent component provides the background, so this div can be simple
        <div className="h-[350px] md:h-[400px]">
            <Line options={chartOptions} data={chartDataConfig} />
        </div>
    );
};

export default TrendsChart;

