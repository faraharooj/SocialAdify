// D:\socialadify\frontend\src\components\CampaignList.tsx
'use client';

import React from 'react';
import { UnifiedCampaign } from '@/app/dashboard/page';

// Props interface (Unchanged)
interface CampaignListProps {
    campaigns: UnifiedCampaign[];
    onCampaignSelect: (campaignId: string) => void;
    isLoading: boolean;
    error: string | null;
    selectedCampaignId: string | null;
    isComparing: boolean;
    comparisonIds: string[];
}

// Icon component (Unchanged)
const GoogleLogoIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path fill="#4285F4" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.19,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.19,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.19,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1Z" />
    </svg>
);

// --- ADDED: MetaLogoIcon component ---
const MetaLogoIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.99 12c0-6.627-5.372-12-11.995-12C5.372 0 0 5.373 0 12c0 6.012 4.425 10.985 10.125 11.85v-8.325H7.077V12h3.048V9.356c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.688.235 2.688.235v2.953H15.83c-1.49 0-1.956.925-1.956 1.874V12h3.328l-.532 3.525h-2.796v8.325C19.565 22.985 23.99 18.012 23.99 12z"/>
    </svg>
);
// --- END: MetaLogoIcon component ---


const CampaignList: React.FC<CampaignListProps> = ({
    campaigns,
    onCampaignSelect,
    isLoading,
    error,
    selectedCampaignId,
    isComparing,
    comparisonIds
}) => {

    // --- MODIFIED: Loading skeleton updated for dark theme ---
    if (isLoading) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 rounded-2xl shadow-2xl h-full">
                <div className="h-6 bg-slate-700 rounded w-1/2 mb-4 animate-pulse"></div>
                <ul className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <li key={i} className="h-16 bg-slate-700/50 rounded-md animate-pulse"></li>
                    ))}
                </ul>
            </div>
        );
    }

    // --- MODIFIED: Error state updated for dark theme ---
    if (error) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 rounded-2xl shadow-2xl h-full">
               <h3 className="text-md font-semibold text-slate-200 mb-3 border-b border-slate-700 pb-2">Campaigns</h3>
               <div className="p-4 text-red-300 bg-red-900/50 rounded-md border border-red-700">{error}</div>
            </div>
        );
    }

    // --- MODIFIED: Empty state updated for dark theme ---
    if (!campaigns || campaigns.length === 0) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 rounded-2xl shadow-2xl h-full">
                <h3 className="text-md font-semibold text-slate-200 mb-3 border-b border-slate-700 pb-2">Campaigns</h3>
                <div className="p-4 text-center text-slate-400">No campaigns found.</div>
            </div>
        );
    }

    return (
        // --- MODIFIED: Main container now has glassmorphism style ---
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 rounded-2xl shadow-2xl h-full overflow-y-auto">
            <h3 className="text-md font-semibold text-slate-200 mb-3 border-b border-slate-700 pb-2">
                {isComparing ? 'Select 2 to Compare' : 'Campaigns'}
            </h3>
            <ul className="space-y-2">
                {campaigns.map((campaign) => {
                    const isSelected = isComparing 
                        ? comparisonIds.includes(campaign.id)
                        : selectedCampaignId === campaign.id;

                    // --- MODIFIED: Button classes updated for dark theme and better visual feedback ---
                    const buttonClasses = `w-full text-left px-3 py-2 rounded-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 
                        ${isSelected
                            ? (isComparing ? 'bg-green-600 text-white shadow-lg ring-green-500' : 'bg-indigo-600 text-white shadow-lg ring-indigo-500')
                            : 'bg-slate-700/40 hover:bg-slate-700/80 text-slate-300'
                        }`;

                    return (
                        <li key={campaign.id}>
                            <button onClick={() => onCampaignSelect(campaign.id)} className={buttonClasses}>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium truncate" title={campaign.name}>
                                        {campaign.name}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-600 text-slate-300'}`}>
                                        {campaign.clicks.toLocaleString()} Clicks
                                    </span>
                                </div>
                                {/* --- MODIFIED: Conditionally render Google or Meta icon --- */}
                                <div className={`flex items-center text-xs mt-0.5 ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                                    {campaign.platform === 'Google' && (
                                        <GoogleLogoIcon className="w-3.5 h-3.5 mr-1.5" />
                                    )}
                                    {campaign.platform === 'Meta' && (
                                        <MetaLogoIcon className="w-3.5 h-3.5 mr-1.5" />
                                    )}
                                    Status: {campaign.status}
                                </div>
                                {/* --- END: Conditional icon --- */}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default CampaignList;