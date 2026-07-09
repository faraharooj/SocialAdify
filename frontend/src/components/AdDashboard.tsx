// D:\socialadify\frontend\src\components\AdDashboard.tsx
'use client';

import React from 'react';
// --- UPDATED: Import MetaAdCreativePublic and define UnifiedAd ---
import { AdCreativePublic, MetaAdCreativePublic } from '@/services/adCreatorService'; 

// --- Icons ---
const PlusIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> );
const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.927a2.25 2.25 0 01-2.244-2.077L5.09 5.93c-.3-.058-.6-.117-.9-.176M4.5 5.25a2.25 2.25 0 012.25-2.25h1.5A2.25 2.25 0 0112 5.25m-3 0h3.75" /></svg> );
const LoadingSpinner = ({ className = "animate-spin h-5 w-5 text-white" }: {className?: string}) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
const GoogleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="m24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path></svg>);
const MetaIcon = ({ className = "w-5 h-5" }: { className?: string }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22.002 10.119c-.066-1.57-.37-2.923-.834-4.052a5.42 5.42 0 0 0-1.87-2.344C18.25.922 17.006.46 15.65.21a19.43 19.43 0 0 0-7.298 0c-1.357.25-2.602.712-3.65 1.513a5.42 5.42 0 0 0-1.87 2.344c-.464 1.13-.768 2.482-.834 4.052a19.53 19.53 0 0 0 0 3.764c.066 1.57.37 2.923.834 4.051a5.42 5.42 0 0 0 1.87 2.345c1.048.8 2.293 1.263 3.65 1.513a19.43 19.43 0 0 0 7.298 0c1.357-.25 2.602-.713 3.65-1.513a5.42 5.42 0 0 0 1.87-2.345c.464-1.128.768-2.481.834-4.051a19.53 19.53 0 0 0 0-3.764Zm-10.02 7.02c-3.15 0-5.703-2.62-5.703-5.86s2.554-5.86 5.704-5.86c3.149 0 5.703 2.62 5.703 5.86s-2.554 5.86-5.704 5.86Z"></path></svg>);
const PublishIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" /></svg> );

// --- NEW: Unified Ad Type (must match page.tsx) ---
type UnifiedAd = (AdCreativePublic & { adType: 'GOOGLE' }) | (MetaAdCreativePublic & { adType: 'META' });

// --- UPDATED: Props now use the UnifiedAd type ---
interface AdDashboardProps {
    ads: UnifiedAd[];
    isLoading: boolean;
    isPublishing: string | null;
    onGoToCreate: () => void;
    onDelete: (adId: string, adType: 'GOOGLE' | 'META') => void; // Updated signature
    onPublish: (ad: UnifiedAd) => void; // Updated signature
    cardClass: string;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'DRAFT':
            return 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10';
        case 'PUBLISHED':
            return 'text-green-400 border-green-400/50 bg-green-400/10';
        case 'PUBLISHING':
            return 'text-sky-400 border-sky-400/50 bg-sky-400/10';
        case 'FAILED':
            return 'text-red-400 border-red-400/50 bg-red-400/10';
        default:
            return 'text-slate-400 border-slate-400/50 bg-slate-400/10';
    }
};

// --- UPDATED: AdItem props now use UnifiedAd and new handlers ---
const AdItem: React.FC<{ ad: UnifiedAd; isPublishing: boolean; onDelete: () => void; onPublish: () => void; }> = ({
    ad,
    isPublishing,
    onDelete,
    onPublish
}) => {
    
    const PlatformIcon = ad.adType === 'GOOGLE' ? GoogleIcon : MetaIcon;
    const platformName = ad.adType === 'GOOGLE' ? 'Google' : 'Meta';
    const publishColor = ad.adType === 'GOOGLE' ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500';
    
    return (
        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 flex flex-wrap justify-between items-center gap-4">
            <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-1">
                    <PlatformIcon className="w-4 h-4" />
                    <p className="text-lg font-semibold text-slate-100">{ad.campaign_name}</p>
                </div>
                <p className="text-sm text-slate-400">
                    Platform: <span className="font-medium text-slate-300">{platformName}</span> | 
                    Status: <span className={`font-medium ${getStatusColor(ad.status)}`}>{ad.status}</span>
                </p>
                {ad.status === 'FAILED' && ad.error_message && (
                    <p className="text-xs text-red-400 mt-1 truncate" title={ad.error_message}>
                        Error: {ad.error_message}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onDelete} // <-- This now calls the simple prop
                    className="p-2 text-red-400 hover:bg-slate-600 rounded-md"
                    title="Delete Draft"
                >
                    <TrashIcon />
                </button>
                {ad.status === 'DRAFT' && (
                    <button
                        onClick={onPublish} // <-- This now calls the simple prop
                        disabled={isPublishing}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-md transition-colors text-white disabled:opacity-50 ${publishColor}`}
                        title={`Publish to ${platformName}`}
                    >
                        {isPublishing ? <LoadingSpinner className="w-4 h-4" /> : <PublishIcon />}
                        {isPublishing ? 'Publishing...' : 'Publish'}
                    </button>
                )}
            </div>
        </div>
    );
};


export const AdDashboard: React.FC<AdDashboardProps> = ({
    ads,
    isLoading,
    isPublishing,
    onGoToCreate,
    onDelete,
    onPublish,
    cardClass
}) => {
    
    return (
        <div className={cardClass}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-100">Your Ad Drafts</h2>
                <button
                    onClick={onGoToCreate}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-md transition-colors bg-sky-600 hover:bg-sky-500 text-white"
                >
                    <PlusIcon /> Create New Ad
                </button>
            </div>
            {isLoading ? (
                <div className="text-center py-10">
                    <LoadingSpinner className="h-8 w-8 text-sky-400 mx-auto" />
                    <p className="mt-4 text-slate-400">Loading your ad drafts...</p>
                </div>
            ) : ads.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-700 rounded-lg">
                    <p className="text-slate-400">You haven't created any ad drafts yet.</p>
                    <button
                        onClick={onGoToCreate}
                        className="mt-4 text-sm font-semibold text-sky-400 hover:text-sky-300"
                    >
                        + Create your first ad
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {ads.map(ad => (
                        <AdItem
                            key={ad.id}
                            ad={ad}
                            isPublishing={isPublishing === ad.id}
                            // --- UPDATED: Pass the correct adType to the handlers ---
                            onDelete={() => onDelete(ad.id, ad.adType)}
                            onPublish={() => onPublish(ad)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};