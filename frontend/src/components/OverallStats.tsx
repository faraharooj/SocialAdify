// D:\socialadify\frontend\src\components\OverallStats.tsx
'use client';
import React from 'react';

// --- MODIFIED: Import the updated Statistics interface from the service file ---
import { Statistics } from '@/services/insightsService';


// --- MODIFIED: SVG Icons updated with dark-theme-friendly colors ---
const IconClicks = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.698 9.931c.852.175 1.73.266 2.698.266 1.934 0 3.743-.39 5.368-1.097l-2.668-5.446M12 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565" /></svg>;
const IconImpressions = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconCTR = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5l.415-.207a.75.75 0 011.06.022L10.5 9.75l.256-1.304A.75.75 0 0111.53 8l2.308 4.22A.75.75 0 0113.27 13H8.25m0 0a2.25 2.25 0 00-2.25 2.25v2.25H15M8.25 7.5V6m0 1.5V4.5m0 3V1.5A2.25 2.25 0 0110.5 0h3A2.25 2.25 0 0115.75 2.25v1.5M8.25 7.5h-1.5M15 15H4.5a2.25 2.25 0 00-2.25 2.25v2.25A2.25 2.25 0 004.5 24h10.5A2.25 2.25 0 0017.25 21.75V19.5A2.25 2.25 0 0015 15z" /></svg>;
const IconSpend = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconReach = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962a3.75 3.75 0 015.409 0L18 18.72m-7.5-2.962a3.75 3.75 0 00-5.409 0L3 18.72m0 0a9.094 9.094 0 003.741.479 3 3 0 004.682-2.72M3 18.72V18a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 18v.72M3 18.72v-1.11a2.25 2.25 0 01.9-1.966l-.001-.001c.046-.05.092-.096.138-.143a2.25 2.25 0 013.638-2.022M12 12a3 3 0 100-6 3 3 0 000 6z" /></svg>;
const IconFrequency = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.182-3.182m0-4.991v4.99" /></svg>;
const IconCPM = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.75A.75.75 0 013 4.5h.75m0 0h.75A.75.75 0 015.25 6v.75m0 0H3.75m0 0A.75.75 0 013 6V5.25m0 0A.75.75 0 013.75 4.5h.75m0 0V3.75A.75.75 0 015.25 3h.75m0 0v.75A.75.75 0 015.25 4.5h-.75m0 0a.75.75 0 01-.75.75V6m0 0v.75a.75.75 0 01-.75.75h-.75m0 0v-.75a.75.75 0 01.75-.75h.75M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconConversions = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// --- Helper to format values (Unchanged) ---
const formatValue = (key: keyof Statistics, value: number | string): string => {
    const numValue = Number(value);
    if (isNaN(numValue)) return String(value);

    if (key === 'cost' || key === 'avg_cpc' || key === 'cpm' || key === 'cpa') {
        return `Rs${numValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (key === 'ctr') { return `${numValue.toFixed(2)}%`; }
    if (key === 'frequency') { return numValue.toFixed(2); }
    return numValue.toLocaleString();
};

// --- Metric Display Config (Unchanged) ---
const METRIC_DISPLAY_CONFIG: { [key in keyof Statistics]?: { label: string; icon?: React.FC; highlight?: 'positive' | 'neutral' | 'cost'; } } = {
    impressions: { label: "Impressions", icon: IconImpressions, highlight: 'neutral' },
    clicks: { label: "Clicks", icon: IconClicks, highlight: 'neutral' },
    reach: { label: "Reach", icon: IconReach, highlight: 'neutral' },
    ctr: { label: "CTR", icon: IconCTR, highlight: 'positive' },
    conversions: { label: "Conversions", icon: IconConversions, highlight: 'positive' },
    cost: { label: "Cost", icon: IconSpend, highlight: 'cost' },
    avg_cpc: { label: "Avg. CPC", icon: IconSpend, highlight: 'cost' },
    cpm: { label: "CPM", icon: IconCPM, highlight: 'cost' },
    cpa: { label: "CPA", icon: IconSpend, highlight: 'cost' },
    frequency: { label: "Frequency", icon: IconFrequency, highlight: 'neutral' },
};

const metricsToShow: (keyof Statistics)[] = ['impressions', 'clicks', 'reach', 'ctr', 'conversions', 'cost', 'avg_cpc', 'cpm', 'cpa', 'frequency'];

interface OverallStatsProps {
    data: Statistics | null;
    title?: string;
    isLoading?: boolean;
}

// --- MODIFIED: Skeleton card updated for dark theme ---
const MetricSkeletonCard = () => (
    <div className="bg-slate-700/50 rounded-xl p-4 min-h-[110px] animate-pulse">
        <div className="h-3.5 bg-slate-600 rounded w-3/4 mb-3"></div>
        <div className="h-7 bg-slate-600 rounded w-1/2"></div>
    </div>
);

export default function OverallStats({ data, title = "Detailed Statistics", isLoading = false }: OverallStatsProps) {
    if (isLoading) {
        return (
            <>
                <h2 className="text-xl md:text-2xl font-semibold text-slate-200 mb-6">{title}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                    {Array.from({ length: 10 }).map((_, index) => <MetricSkeletonCard key={`skeleton-${index}`} />)}
                </div>
            </>
        );
    }

    if (!data) {
        return (
            <>
                <h2 className="text-xl md:text-2xl font-semibold text-slate-200 mb-4">{title}</h2>
                <div className="p-4 text-center text-slate-400">Select a campaign to view its detailed statistics.</div>
            </>
        );
    }

    // --- MODIFIED: Styling helpers updated for dark theme ---
    const getHighlightClasses = (highlightType?: 'positive' | 'neutral' | 'cost') => {
        switch (highlightType) {
            case 'positive': return 'bg-green-900/30 border-green-700/50 hover:bg-green-900/50';
            case 'cost': return 'bg-red-900/30 border-red-700/50 hover:bg-red-900/50';
            default: return 'bg-slate-700/40 border-slate-600/50 hover:bg-slate-700/60';
        }
    };
    const getValueTextClasses = (highlightType?: 'positive' | 'neutral' | 'cost') => {
        switch (highlightType) {
            case 'positive': return 'text-green-400';
            case 'cost': return 'text-red-400';
            default: return 'text-indigo-400';
        }
    }

    return (
        <>
            <h2 className="text-xl md:text-2xl font-semibold text-slate-200 mb-6">{title}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                {metricsToShow.map((key) => {
                    const config = METRIC_DISPLAY_CONFIG[key];
                    if (!config) return null;
                    const value = data[key as keyof Statistics];
                    const Icon = config.icon;
                    return (
                        <div
                            key={key}
                            className={`rounded-xl p-3 sm:p-4 border flex flex-col justify-between min-h-[100px] sm:min-h-[110px] transition-all duration-200 ease-in-out transform hover:-translate-y-1 ${getHighlightClasses(config.highlight)}`}
                        >
                            <div className="flex items-center text-xs sm:text-sm font-medium text-slate-300 capitalize mb-1.5 truncate">
                                {Icon && <Icon />}
                                {config.label}
                            </div>
                            <p className={`text-lg sm:text-xl font-bold truncate ${getValueTextClasses(config.highlight)}`}>
                                {formatValue(key, value as number)}
                            </p>
                        </div>
                    )
                })}
            </div>
        </>
    );
}

