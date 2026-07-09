// D:\socialadify\frontend\src\app\ad-creator\page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
    fetchAdCreatives,
    deleteAdCreative,
    publishAdToGoogle,
    AdCreativePublic,
    // --- NEW: Import Meta functions ---
    fetchMetaAdCreatives,
    deleteMetaAdCreative,
    publishAdToMeta,
    MetaAdCreativePublic
} from '@/services/adCreatorService'; // Use alias path

// Import the new components using the @ alias from your main components folder
import { AdDashboard } from '@/components/AdDashboard';
import { AdCreatorForm } from '@/components/AdCreatorForm'; // <-- FIX: Changed 'as' to 'from'
import { AIPlatformSuggestor } from '@/components/AIPlatformSuggestor';
// --- NEW: Import Meta form ---
import { MetaAdCreatorForm } from '@/components/MetaAdCreatorForm';


// --- Icons ---
const HomeIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125A2.25 2.25 0 0021 18.75V9.75M8.25 21h7.5" /></svg> );
const LoadingSpinner = ({ className = "animate-spin h-5 w-5 text-white" }: {className?: string}) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
const MetaIcon = ({ className = "w-5 h-5" }: { className?: string }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22.002 10.119c-.066-1.57-.37-2.923-.834-4.052a5.42 5.42 0 0 0-1.87-2.344C18.25.922 17.006.46 15.65.21a19.43 19.43 0 0 0-7.298 0c-1.357.25-2.602.712-3.65 1.513a5.42 5.42 0 0 0-1.87 2.344c-.464 1.13-.768 2.482-.834 4.052a19.53 19.53 0 0 0 0 3.764c.066 1.57.37 2.923.834 4.051a5.42 5.42 0 0 0 1.87 2.345c1.048.8 2.293 1.263 3.65 1.513a19.43 19.43 0 0 0 7.298 0c1.357-.25 2.602-.713 3.65-1.513a5.42 5.42 0 0 0 1.87-2.345c.464-1.128.768-2.481.834-4.051a19.53 19.53 0 0 0 0-3.764Zm-10.02 7.02c-3.15 0-5.703-2.62-5.703-5.86s2.554-5.86 5.704-5.86c3.149 0 5.703 2.62 5.703 5.86s-2.554 5.86-5.704 5.86Z"></path></svg>);


// --- NEW: Updated Page State ---
type PageState = 'dashboard' | 'suggesting' | 'creatingGoogle' | 'creatingMeta';

// --- NEW: Unified Ad Type ---
type UnifiedAd = (AdCreativePublic & { adType: 'GOOGLE' }) | (MetaAdCreativePublic & { adType: 'META' });

export default function AdCreatorPage() {
    const { token, logout, isAuthReady } = useAuth();
    
    const [pageState, setPageState] = useState<PageState>('dashboard');
    // --- NEW: State holds unified ads ---
    const [ads, setAds] = useState<UnifiedAd[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPublishing, setIsPublishing] = useState<string | null>(null); // Stores ID of ad

    const cardClass = "bg-slate-900 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-800";

    // --- Data Fetching Effect (UPDATED) ---
    useEffect(() => {
        if (!isAuthReady) return;
        if (!token) {
            logout();
            return;
        }

        const loadAds = async () => {
            setIsLoading(true);
            try {
                // Fetch from both sources
                const googleAdsPromise = fetchAdCreatives(token);
                const metaAdsPromise = fetchMetaAdCreatives(token);
                
                const [googleAds, metaAds] = await Promise.all([googleAdsPromise, metaAdsPromise]);

                // Map to a unified structure
                const unifiedGoogleAds: UnifiedAd[] = googleAds.map(ad => ({ ...ad, adType: 'GOOGLE' }));
                const unifiedMetaAds: UnifiedAd[] = metaAds.map(ad => ({ ...ad, adType: 'META' }));

                // Combine and sort
                const allAds = [...unifiedGoogleAds, ...unifiedMetaAds];
                allAds.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                setAds(allAds);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load ad drafts.");
            } finally {
                setIsLoading(false);
            }
        };
        loadAds();
    }, [isAuthReady, token, logout]);

    // --- Event Handlers (passed down to children) ---

    // --- NEW: Two separate save handlers ---
    const handleGoogleDraftSaved = (newAd: AdCreativePublic) => {
        setAds(prev => [{ ...newAd, adType: 'GOOGLE' }, ...prev]); // Add new ad to the top of the list
        setPageState('dashboard'); // Switch back to the dashboard view
    };

    const handleMetaDraftSaved = (newAd: MetaAdCreativePublic) => {
        setAds(prev => [{ ...newAd, adType: 'META' }, ...prev]); // Add new ad to the top of the list
        setPageState('dashboard'); // Switch back to the dashboard view
    };

    // --- NEW: Unified Delete Handler ---
    const handleDelete = async (adId: string, adType: 'GOOGLE' | 'META') => {
        if (!token || !window.confirm("Are you sure you want to delete this draft?")) return;
        
        try {
            if (adType === 'GOOGLE') {
                await deleteAdCreative(token, adId);
            } else {
                await deleteMetaAdCreative(token, adId);
            }
            setAds(ads.filter(ad => ad.id !== adId));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete ad.");
        }
    };
    
    // --- NEW: Unified Publish Handler ---
    const handlePublish = async (ad: UnifiedAd) => {
        if (!token) return;

        // Use the correct publisher based on adType
        const publishFunction = ad.adType === 'GOOGLE' ? publishAdToGoogle : publishAdToMeta;
        const platformName = ad.adType === 'GOOGLE' ? 'Google Ads' : 'Meta';

        if (!window.confirm(`This will publish the ad "${ad.campaign_name}" to your ${platformName} account. Continue?`)) return;

        setIsPublishing(ad.id);
        setError(null);

        try {
            // --- FIX: Ensure the correct type is passed to the publish function ---
            const publishedAd = await publishFunction(token, ad.id);
            // Update the ad in the list with its new status
            // We cast `publishedAd` to `any` here to satisfy TypeScript, 
            // as the return types of publishFunction are (AdCreativePublic | MetaAdCreativePublic)
            setAds(ads.map(a => a.id === publishedAd.id ? { ...(publishedAd as any), adType: ad.adType } : a));
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : `Failed to publish ad to ${platformName}.`;
            setError(errorMsg);
            
            // Update ad with error status
            setAds(ads.map(a => a.id === ad.id ? { ...a, status: 'FAILED', error_message: errorMsg } : a));
        } finally {
            setIsPublishing(null);
        }
    };

    // --- Handlers for the new workflow ---
    const handleGoToSuggestor = () => {
        setError(null);
        setPageState('suggesting');
    };

    const handleCancelCreate = () => {
        setError(null);
        setPageState('dashboard');
    };

    const handlePlatformSelected = (platform: 'google' | 'meta') => {
        if (platform === 'google') {
            setPageState('creatingGoogle');
        } else {
            setPageState('creatingMeta');
        }
    };
    // ---

    // --- NEW: Render Logic ---
    const renderCurrentState = () => {
        switch (pageState) {
            case 'dashboard':
                return (
                    <AdDashboard
                        ads={ads} // Pass unified ads
                        isLoading={isLoading}
                        isPublishing={isPublishing}
                        onGoToCreate={handleGoToSuggestor}
                        onDelete={handleDelete} // Pass unified delete
                        onPublish={handlePublish} // Pass unified publish
                        cardClass={cardClass}
                    />
                );
            case 'suggesting':
                return (
                    <AIPlatformSuggestor
                        token={token}
                        onPlatformSelected={handlePlatformSelected}
                        onCancel={handleCancelCreate}
                        cardClass={cardClass}
                    />
                );
            case 'creatingGoogle':
                return (
                    <AdCreatorForm
                        token={token}
                        onDraftSaved={handleGoogleDraftSaved} // Use Google-specific save
                        onCancel={handleCancelCreate}
                        cardClass={cardClass}
                    />
                );
            case 'creatingMeta':
                // --- NEW: Show the new Meta form ---
                return (
                    <MetaAdCreatorForm
                        token={token}
                        onDraftSaved={handleMetaDraftSaved} // Use Meta-specific save
                        onCancel={handleCancelCreate}
                        cardClass={cardClass}
                    />
                );
            default:
                return (
                    <AdDashboard
                        ads={ads}
                        isLoading={isLoading}
                        isPublishing={isPublishing}
                        onGoToCreate={handleGoToSuggestor}
                        onDelete={handleDelete}
                        onPublish={handlePublish}
                        cardClass={cardClass}
                    />
                );
        }
    };

    // --- Main Page Render ---
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <header className="text-center mb-10">
                
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-green-300 via-sky-400 to-blue-400 bg-clip-text text-transparent pb-2">
                    AI Ad Placement
                </h1>
                <p className="mt-3 text-md text-slate-400 max-w-2xl mx-auto">
                    Create, target, and publish your ads to Google and Meta, all in one place.
                </p>
            </header>

            <div className="max-w-6xl mx-auto">
                {error && (
                    <div className={`${cardClass} mb-6 text-center`}>
                        <h3 className="text-lg font-semibold text-red-400">An Error Occurred</h3>
                        <p className="mt-2 text-sm text-slate-400 bg-slate-700/50 p-3 rounded-md">{error}</p>
                        <button onClick={() => setError(null)} className="mt-4 px-4 py-2 text-sm font-medium bg-sky-600 hover:bg-sky-500 rounded-md">
                            Dismiss
                        </button>
                    </div>
                )}

                {/* --- NEW: Use the render function --- */}
                {renderCurrentState()}
            </div>
        </div>
    );
}