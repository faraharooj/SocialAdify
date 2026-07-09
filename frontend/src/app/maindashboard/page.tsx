// D:/socialadify/frontend/src/app/main-dashboard/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import DashboardCalendar from '../../components/DashboardCalendar';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { RocketLaunchIcon, SparklesIcon, ArrowRightIcon, LinkIcon } from '@heroicons/react/24/solid';
import { 
    getDashboardOverview, 
    DashboardOverviewResponse,
    getGoogleCampaigns,
    getMetaCampaigns
} from '../../services/insightsService';

// --- Icons for Platform ---
const GoogleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path fill="#4285F4" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.19,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.19,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.19,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1Z" />
    </svg>
);

const MetaIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="#0668E1" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.99 12c0-6.627-5.372-12-11.995-12C5.372 0 0 5.373 0 12c0 6.012 4.425 10.985 10.125 11.85v-8.325H7.077V12h3.048V9.356c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.688.235 2.688.235v2.953H15.83c-1.49 0-1.956.925-1.956 1.874V12h3.328l-.532 3.525h-2.796v8.325C19.565 22.985 23.99 18.012 23.99 12z"/>
    </svg>
);

const FacebookIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
         <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v2.277h-1.17c-1.637 0-2.198.684-2.198 1.962v1.02h3.209l-.278 3.668h-2.931v7.98h-5.099Z" />
    </svg>
);

const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="igGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f09433" />
                <stop offset="25%" stopColor="#e6683c" />
                <stop offset="50%" stopColor="#dc2743" />
                <stop offset="75%" stopColor="#cc2366" />
                <stop offset="100%" stopColor="#bc1888" />
            </linearGradient>
        </defs>
        <path fill="url(#igGradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
);

// --- Real Data Component ---

interface SimpleCampaign {
    id: string;
    name: string;
    status: string;
    platform: 'Google' | 'Meta';
    impressions: number;
}

const CampaignDataAtAGlance: React.FC = () => {
    const { token, user } = useAuth();
    const [stats, setStats] = useState<DashboardOverviewResponse | null>(null);
    const [activeCampaigns, setActiveCampaigns] = useState<SimpleCampaign[]>([]);
    const [loading, setLoading] = useState(true);

    // --- NEW: Check if connected ---
    const isGoogleConnected = !!user?.google_ad_account_id;
    const isMetaConnected = !!user?.meta_ad_account_id;
    const hasConnectedAccounts = isGoogleConnected || isMetaConnected;

    useEffect(() => {
        const fetchData = async () => {
            if (!token || !user) return;
            
            // --- LOGIC FIX: Stop fetching if not connected ---
            if (!hasConnectedAccounts) {
                setLoading(false); // Stop loading immediately
                return;
            }

            try {
                // 1. Fetch Stats
                const statsData = await getDashboardOverview(token);
                setStats(statsData);

                // 2. Fetch Campaigns
                const promises = [];
                if (user.google_ad_account_id) {
                    promises.push(getGoogleCampaigns(token).catch(() => ({ campaigns: [] })));
                } else {
                    promises.push(Promise.resolve({ campaigns: [] }));
                }

                if (user.meta_ad_account_id) {
                    promises.push(getMetaCampaigns(token).catch(() => ({ campaigns: [] })));
                } else {
                    promises.push(Promise.resolve({ campaigns: [] }));
                }

                const [googleRes, metaRes] = await Promise.all(promises);
                
                // Cast to any to handle the response structure safely and map data
                const googleList = (googleRes as any).campaigns?.map((c: any) => ({ 
                    ...c, 
                    platform: 'Google',
                    impressions: Number(c.impressions) || 0
                })) || [];

                const metaList = (metaRes as any).campaigns?.map((c: any) => ({ 
                    ...c, 
                    platform: 'Meta',
                    impressions: Number(c.impressions) || 0
                })) || [];
                
                const allCampaigns = [...googleList, ...metaList];
                
                // Sort by IMPRESSIONS (Descending) then take top 5
                const sorted = allCampaigns.sort((a, b) => b.impressions - a.impressions).slice(0, 3);

                setActiveCampaigns(sorted);

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token, user, hasConnectedAccounts]);

    // --- NEW: Empty State UI ---
    if (!hasConnectedAccounts) {
        return (
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-100 mb-4">Campaigns At A Glance</h2>
                <div className="bg-slate-800/70 p-10 rounded-xl border border-slate-700 shadow-2xl flex flex-col items-center justify-center text-center space-y-6">
                    <div className="p-4 bg-slate-700/50 rounded-full">
                        <SparklesIcon className="w-12 h-12 text-sky-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-100">No Active Campaigns Found</h3>
                        <p className="text-slate-400 mt-2 max-w-md mx-auto">
                            Connect your Google Ads or Meta Ads account to see real-time performance metrics, costs, and impressions right here.
                        </p>
                    </div>
                    <Link 
                        href="/connections" 
                        className="flex items-center px-6 py-3 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors shadow-lg shadow-sky-900/20"
                    >
                        Connect Accounts <ArrowRightIcon className="w-4 h-4 ml-2" />
                    </Link>
                </div>
            </div>
        );
    }

    const exchangeRate = 278; 

    const displayData = stats ? [
        { 
            metric: 'Total Impressions', 
            value: stats.impressions.value, 
            trend: stats.impressions.trend, 
            color: 'text-green-400', 
            icon: '👀' 
        },
        { 
            metric: 'Total Cost', 
            value: `Rs ${(Number(String(stats.cost_micros.value).replace(/[^0-9.]/g, '')) * exchangeRate).toLocaleString()}`, 
            trend: stats.cost_micros.trend, 
            color: stats.cost_micros.status === 'down' ? 'text-green-400' : 'text-red-400', 
            icon: stats.cost_micros.status === 'down' ? '📉' : '📈' 
        },
        { 
            metric: 'Total Clicks', 
            value: stats.clicks.value, 
            trend: stats.clicks.trend, 
            color: 'text-green-400', 
            icon: '🖱️' 
        },
    ] : [
        { metric: 'Total Impressions', value: 'Loading...', trend: 0, color: 'text-slate-500', icon: '⏳' },
        { metric: 'Total Cost', value: 'Loading...', trend: 0, color: 'text-slate-500', icon: '⏳' },
        { metric: 'Total Clicks', value: 'Loading...', trend: 0, color: 'text-slate-500', icon: '⏳' },
    ];

    const cardBaseClass = "bg-slate-800/70 p-4 rounded-xl border border-slate-700 shadow-2xl";

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Campaigns At A Glance</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {displayData.map((item) => (
                    <div key={item.metric} className={`${cardBaseClass} hover:border-orange-500 transition-colors`}>
                        <p className="text-xs text-slate-400">{item.metric}</p>
                        <div className="flex items-end justify-between mt-1">
                            <p className="text-2xl font-extrabold text-white">
                                {loading ? <span className="animate-pulse">...</span> : item.value}
                            </p>
                            <p className={`text-xs font-semibold flex items-center ${item.color}`}>
                                {item.icon} {Math.abs(item.trend)}%
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className={`${cardBaseClass} p-4`}>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-md font-semibold text-slate-200">Top Campaigns (by Impressions)</h3>
                    <Link href="/dashboard" className="text-xs text-sky-400 hover:text-sky-300 flex items-center">
                         View All <ArrowRightIcon className="w-3 h-3 ml-1" />
                    </Link>
                </div>
                <ul className="space-y-2 text-slate-300 text-sm">
                    {loading ? (
                        <div className="space-y-2">
                             <li className="h-10 rounded-lg bg-slate-900/50 animate-pulse"></li>
                             <li className="h-10 rounded-lg bg-slate-900/50 animate-pulse"></li>
                        </div>
                    ) : activeCampaigns.length > 0 ? (
                        activeCampaigns.map((campaign) => (
                            <li key={campaign.id} className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/50 hover:bg-slate-900/80 transition-colors border border-transparent hover:border-slate-700">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="flex-shrink-0 p-1.5 bg-slate-800 rounded-md">
                                        {campaign.platform === 'Google' ? <GoogleIcon /> : <MetaIcon />}
                                    </div>
                                    
                                    <div className="flex flex-col min-w-0">
                                        <span className="truncate font-medium text-slate-200 text-sm" title={campaign.name}>{campaign.name}</span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <span className="font-semibold text-slate-300">{campaign.impressions.toLocaleString()}</span> Impressions
                                        </span>
                                    </div>
                                </div>
                                
                                <span className={`flex-shrink-0 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wide ${
                                    campaign.status === 'ENABLED' ? 'bg-green-900/30 text-green-400 border border-green-900' : 
                                    campaign.status === 'PAUSED' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-900' : 
                                    'bg-slate-700 text-slate-400'
                                }`}>
                                    {campaign.status}
                                </span>
                            </li>
                        ))
                    ) : (
                        <li className="text-center text-slate-500 py-4">No active campaigns found.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

const QuickActions: React.FC = () => {
    const buttonClass = "flex items-center justify-center p-4 rounded-xl bg-orange-600 hover:bg-orange-500 transition-colors text-white font-semibold text-sm shadow-lg shadow-orange-500/30";
    
    return (
        <div className="flex flex-col space-y-4">
            <Link href="/post-generator" className={buttonClass.replace('bg-orange-600', 'bg-sky-700').replace('hover:bg-orange-500', 'hover:bg-sky-600').replace('shadow-lg shadow-orange-500/30', '')}>
                <RocketLaunchIcon className="w-5 h-5 mr-2" /> 
                NEW: AI Poster Generator
            </Link>
            <Link href="/caption-generator" className={buttonClass.replace('bg-orange-600', 'bg-slate-500').replace('hover:bg-orange-500', 'hover:bg-slate-600').replace('shadow-lg shadow-orange-500/30', '')}>
                <SparklesIcon className="w-5 h-5 mr-2" /> 
                AI Caption Craft
            </Link>
        </div>
    );
};

const ConnectedAccounts: React.FC = () => {
    const { user } = useAuth(); 
    const cardBaseClass = "bg-slate-800/70 p-4 rounded-xl border border-slate-700 shadow-2xl"; 

    const isInstagramConnected = !!user?.linked_instagram_id;
    const isFacebookConnected = !!user?.linked_page_id;
    const isGoogleAdsConnected = !!user?.google_ad_account_id; 
    const isMetaAdsConnected = !!user?.meta_ad_account_id;
    
    const accountStatus = [
        { 
            name: 'Instagram', 
            status: isInstagramConnected ? 'Connected' : 'Not Connected', 
            icon: <InstagramIcon className="w-5 h-5" />, 
            color: isInstagramConnected ? 'text-green-400' : 'text-slate-500' 
        },
        { 
            name: 'Facebook', 
            status: isFacebookConnected ? 'Connected' : 'Not Connected', 
            icon: <FacebookIcon className="w-5 h-5" />, 
            color: isFacebookConnected ? 'text-green-400' : 'text-slate-500' 
        },
        { 
            name: 'Google Ads', 
            status: isGoogleAdsConnected ? 'Connected' : 'Not Connected', 
            icon: <GoogleIcon className="w-5 h-5" />, 
            color: isGoogleAdsConnected ? 'text-green-400' : 'text-slate-500' 
        },
        { 
            name: 'Meta Ads', 
            status: isMetaAdsConnected ? 'Connected' : 'Not Connected', 
            icon: <MetaIcon className="w-5 h-5" />, 
            color: isMetaAdsConnected ? 'text-green-400' : 'text-slate-500' 
        },
    ];
    
    return (
        <div className={cardBaseClass}>
            <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-3">
                <h3 className="text-lg font-semibold text-slate-200">Connected Accounts</h3>
                <Link href="/connections" className="text-xs text-orange-400 hover:text-orange-300 flex items-center">
                    Manage <ArrowRightIcon className="w-3 h-3 ml-1" />
                </Link>
            </div>
            
            <ul className="space-y-3">
                {accountStatus.map((account) => (
                    <li key={account.name} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300 flex items-center">
                            {account.icon} <span className="ml-2 font-medium">{account.name}</span>
                        </span>
                        <span className={`text-xs font-medium ${account.color}`}>
                            {account.status}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};


// --- Main Dashboard Component ---

export default function DashboardPage() {
    const { user } = useAuth(); 
    
    // --- NEW: Determine if accounts are connected ---
    const hasConnectedAccounts = !!(user?.google_ad_account_id || user?.meta_ad_account_id);

    return (
        <div className="flex min-h-screen bg-slate-800 text-slate-100">
            <main className="flex-1 overflow-y-auto p-8">
                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-red-500 mb-8">
                    {/* --- CHANGED: Conditional Welcome Message --- */}
                    {hasConnectedAccounts ? 'Welcome Back' : 'Welcome'}, {user?.firstname || 'User'}!
                </h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <CampaignDataAtAGlance />
                        <ConnectedAccounts />
                    </div>
                    
                    <div className="lg:col-span-1 space-y-6">
                        <DashboardCalendar /> 
                        <QuickActions />
                    </div>
                </div>
            </main>
        </div>
    );
};