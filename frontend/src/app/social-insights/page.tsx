// D:/socialadify/frontend/src/app/social-insights/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
// Removed subDays import as we start empty now
import {
    fetchPageInsights,
    fetchPostInsights,
    PageInsightsResponse,
    PostInsightsResponse
} from '@/services/socialInsightsService';
import { DateRange } from 'react-day-picker';

// --- Icons ---
const FacebookIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3l-.5 3h-2.5v6.95C18.05 21.45 22 17.19 22 12z" />
    </svg>
);
const InstagramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.27.06 2.16.27 2.91.56.77.29 1.48.69 2.18 1.4.7.7 1.1 1.41 1.4 2.18.29.75.5 1.64.56 2.91.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.06 1.27-.27 2.16-.56 2.91-.29.77-.69 1.48-1.4 2.18-.7.7-1.41 1.1-2.18 1.4-.75.29-1.64.5-2.91.56-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.27-.06-2.16-.27-2.91-.56-.77-.29-1.48-.69-2.18-1.4-.7-.7-1.1-1.41-1.4-2.18-.29-.75-.5-1.64-.56-2.91-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.06-1.27.27 2.16.56 2.91.29.77.69 1.48 1.4-2.18.7-.7 1.41-1.1 2.18-1.4.75-.29 1.64-.5 2.91-.56C8.42 2.18 8.8 2.16 12 2.16m0-2.16C8.74 0 8.33.01 7.05.07c-1.35.06-2.3.27-3.12.57-.84.3-1.6.78-2.35 1.53C.83 2.92.35 3.68.05 4.52c-.3 .82-.51 1.77-.57 3.12C-2.16 8.9 0 9.31 0 12c0 2.69.01 3.1.07 4.38.06 1.35.27 2.3.57 3.12.3.84.78 1.6 1.53 2.35.75.75 1.51 1.23 2.35 1.53.82.3 1.77.51 3.12.57 1.28.06 1.69.07 4.38.07 2.69 0 3.1-.01 4.38-.07 1.35-.06 2.3-.27 3.12-.57.84-.3 1.6-.78 2.35-1.53.75-.75-1.51-1.23-2.35-1.53-.82-.3-1.77-.51-3.12-.57C15.67.01 15.26 0 12 0zm0 5.84c-3.4 0-6.16 2.76-6.16 6.16s2.76 6.16 6.16 6.16 6.16-2.76 6.16-6.16S15.4 5.84 12 5.84zm0 10.32c-2.3 0-4.16-1.86-4.16-4.16S9.7 7.84 12 7.84s4.16 1.86 4.16 4.16-1.86 4.16-4.16 4.16zm6.4-10.8c-.78 0-1.41.63-1.41 1.41s.63 1.41 1.41 1.41 1.41-.63 1.41-1.41-.63-1.41-1.41-1.41z" />
    </svg>
);
const ChartBarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25C3.504 21 3 20.496 3 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25c-.621 0-1.125-.504-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25c-.621 0-1.125-.504-1.125-1.125V4.125z" />
    </svg>
);
const LoadingSpinner = () => ( <svg className="animate-spin h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
const UsersIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 00-12 0m12 0a9.094 9.094 0 01-12 0m12 0A9.094 9.094 0 016 18.72m12 0A9.094 9.094 0 006 18.72m0 0A9.094 9.094 0 0112 15.072m0 0A9.094 9.094 0 0118 18.72m-6 0A9.094 9.094 0 006 18.72m6 3.648A9.094 9.094 0 0112 15.072m0 0A9.094 9.094 0 0118 18.72m-6-3.648A9.094 9.094 0 006 18.72" />
    </svg>
);
const EyeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const UserPlusIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
);
// --- New Icon for Empty State ---
const CalendarDaysIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12v-.008zM9.75 15h.008v.008H9.75v-.008zM9.75 12h.008v.008H9.75v-.008zM15 15h.008v.008H15v-.008zM15 12h.008v.008H15v-.008zM17.25 15h.008v.008H17.25v-.008zM17.25 12h.008v.008H17.25v-.008z" />
    </svg>
);

// --- Component Imports ---
import InsightsDateRangePicker from '@/components/InsightsDateRangePicker';
import StatCard from '@/components/StatCard';
import PageTrendChart from '@/components/PageTrendChart';
import PostInsightsTable from '@/components/PostInsightTable';

type Platform = 'facebook' | 'instagram';

export default function SocialInsightsPage() {
    const { token, user } = useAuth();
    const [platform, setPlatform] = useState<Platform>('facebook');
    
    // --- CHANGED: Initialize as undefined to wait for user input ---
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    const [pageInsights, setPageInsights] = useState<PageInsightsResponse | null>(null);
    const [postInsights, setPostInsights] = useState<PostInsightsResponse | null>(null);
    // --- CHANGED: Start loading as false, only set true when fetching ---
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isFacebookConnected = !!(user as any)?.linked_page_id;
    const isInstagramConnected = !!(user as any)?.linked_instagram_id;

    // Data fetching logic
    const fetchData = useCallback(async () => {
        // --- ADDED: Guard clause to return if dates aren't selected yet ---
        if (!token || !dateRange?.from || !dateRange?.to) return;
        
        // Check for connections
        if (platform === 'facebook' && !isFacebookConnected) {
            setError("Please connect your Facebook Page in the 'Connections' settings.");
            setLoading(false);
            setPageInsights(null);
            setPostInsights(null);
            return;
        }
        if (platform === 'instagram' && !isInstagramConnected) {
            setError("Please connect your Instagram Account in the 'Connections' settings.");
            setLoading(false);
            setPageInsights(null);
            setPostInsights(null);
            return;
        }

        setLoading(true);
        setError(null);
        setPageInsights(null);
        setPostInsights(null);

        try {
            const [pageData, postData] = await Promise.all([
                fetchPageInsights(token, platform, dateRange.from, dateRange.to),
                fetchPostInsights(token, platform, dateRange.from, dateRange.to)
            ]);
            
            setPageInsights(pageData);
            setPostInsights(postData);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to fetch insights. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [token, platform, dateRange, isFacebookConnected, isInstagramConnected]);

    // Re-fetch data when dependencies change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePlatformChange = (newPlatform: Platform) => {
        setError(null);
        setPlatform(newPlatform);
        // If dates are already selected, fetchData will naturally re-run
    };

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* --- Header --- */}
                <div className="mb-10 md:mb-12">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-50 tracking-tight">
                        Social Media Insights
                    </h1>
                    <p className="mt-3 text-md text-slate-300">
                        Analyze the performance of your connected social accounts.
                    </p>
                </div>

                {/* --- Control Bar (Toggles & Date Picker) --- */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    {/* Platform Toggles */}
                    <div className="flex p-1 bg-slate-800 rounded-lg border border-slate-700">
                        <button
                            onClick={() => handlePlatformChange('facebook')}
                            disabled={!isFacebookConnected}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                                platform === 'facebook'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-700/50'
                            } ${!isFacebookConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <FacebookIcon className="w-4 h-4" /> Facebook
                        </button>
                        <button
                            onClick={() => handlePlatformChange('instagram')}
                            disabled={!isInstagramConnected}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                                platform === 'instagram'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-700/50'
                            } ${!isInstagramConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <InstagramIcon className="w-4 h-4" /> Instagram
                        </button>
                    </div>

                    {/* --- Date Range Picker --- */}
                    <div className="w-full md:w-auto">
                        <InsightsDateRangePicker 
                            range={dateRange} 
                            onRangeChange={setDateRange} 
                        /> 
                    </div>
                </div>

                {/* --- Dashboard Content --- */}
                
                {/* 1. Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center h-96 gap-4">
                        <LoadingSpinner />
                        <p className="text-lg text-slate-400">Fetching insights...</p>
                    </div>
                )}

                {/* 2. Error State */}
                {!loading && error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}

                {/* 3. Empty State (Waiting for Date Selection) */}
                {!loading && !error && (!dateRange?.from || !dateRange?.to) && (
                    <div className="flex flex-col items-center justify-center h-80 bg-slate-800/40 border border-slate-700/50 rounded-2xl border-dashed">
                        <div className="p-4 bg-slate-800/80 rounded-full mb-4">
                            <CalendarDaysIcon className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-200">Select a Date Range</h3>
                        <p className="text-slate-400 mt-2 text-center max-w-md">
                            Please pick a start and end date from the calendar above to generate your insights report.
                        </p>
                    </div>
                )}

                {/* 4. Success State (Data Display) */}
                {!loading && !error && pageInsights && postInsights && (
                    <div className="space-y-8">
                        {/* --- Section 1: Total Stats Cards --- */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                            <StatCard 
                                title="Page Reach"
                                value={pageInsights.totals.reach}
                                icon={<EyeIcon className="w-5 h-5" />}
                            />
                            <StatCard 
                                title="Page Impressions"
                                value={pageInsights.totals.impressions}
                                icon={<ChartBarIcon className="w-5 h-5" />}
                            />
                            <StatCard 
                                title="Engagement"
                                value={pageInsights.totals.engagement}
                                icon={<UsersIcon className="w-5 h-5" />}
                            />
                            <StatCard 
                                title={platform === 'facebook' ? 'Page Fans' : 'Followers'}
                                value={pageInsights.totals.follower_count || 0}
                                icon={<UserPlusIcon className="w-5 h-5" />}
                            />
                        </div>

                        {/* --- Section 2: Page Trends Chart --- */}
                        <div className="bg-slate-800/60 backdrop-blur-md shadow-xl rounded-2xl p-6 border border-slate-700 text-slate-300">
                            <PageTrendChart data={pageInsights.data} />
                        </div>

                        {/* --- Section 3: Post Insights Table --- */}
                        <div className="bg-slate-800/60 backdrop-blur-md shadow-xl rounded-2xl p-6 border border-slate-700 text-slate-300">
                            <h3 className="text-xl font-bold text-slate-100 mb-6">Post Performance</h3>
                            <PostInsightsTable posts={postInsights.posts} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}