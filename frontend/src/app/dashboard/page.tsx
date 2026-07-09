// D:\socialadify\frontend\src\app\dashboard\page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import OverallStats from '../../components/OverallStats';
import TrendsChart from '../../components/TrendsChart';
import CampaignList from '../../components/CampaignList';
import SuggestionModal from '../../components/SuggestionModal'; 
import CampaignComparisonChart from '../../components/CampaignComparisonChart';
import { useAuth } from '../../context/AuthContext';
import { 
    getGoogleCampaigns, GoogleCampaign, getGoogleCampaignPerformance, PerformanceData,
    getAiSuggestionForCampaign, AISuggestion, Statistics,
    // --- ADDED: Meta imports ---
    getMetaCampaigns, MetaCampaign
} from '../../services/insightsService';

// --- MODIFIED: Updated UnifiedCampaign interface ---
export interface UnifiedCampaign {
    id: string; name: string; status: string; 
    platform: 'Google' | 'Meta'; // <-- Allow 'Meta'
    clicks: number; impressions: number; ctr: number; cost: number; cpc: number;
}
// --- END: UnifiedCampaign ---

export interface ComparisonData {
    campaign1: Statistics | null; campaign2: Statistics | null;
    campaign1Name: string; campaign2Name: string;
}

export default function DashboardPage() {
    const { user, token, isAuthReady } = useAuth();

    // All state management logic remains the same
    const [campaigns, setCampaigns] = useState<UnifiedCampaign[]>([]);
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
    const [campaignsError, setCampaignsError] = useState<string | null>(null);
    const [selectedCampaign, setSelectedCampaign] = useState<UnifiedCampaign | null>(null);
    const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
    const [isPerformanceLoading, setIsPerformanceLoading] = useState(false);
    const [performanceError, setPerformanceError] = useState<string | null>(null);
    const [comparisonIds, setComparisonIds] = useState<string[]>([]);
    const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const [isComparisonLoading, setIsComparisonLoading] = useState(false);
    const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
    const [suggestionData, setSuggestionData] = useState<AISuggestion | null>(null);
    const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);
    
    // --- MODIFIED: This entire useEffect hook is replaced to fetch both Google and Meta ---
    useEffect(() => {
        const fetchCampaignList = async () => {
            if (!token || !user) {
                if(isAuthReady) setCampaignsError("Please log in to view data.");
                setIsLoadingCampaigns(false); 
                return;
            }

            setIsLoadingCampaigns(true);
            setCampaignsError(null);
            
            const hasGoogle = !!user.google_ad_account_id;
            const hasMeta = !!user.meta_ad_account_id;

            if (!hasGoogle && !hasMeta) {
                setCampaigns([]);
                setCampaignsError("No ad account connected. Please connect Google or Meta to see campaigns.");
                setIsLoadingCampaigns(false);
                return;
            }

            try {
                const promises = [];
                if (hasGoogle) {
                    promises.push(getGoogleCampaigns(token));
                }
                if (hasMeta) {
                    promises.push(getMetaCampaigns(token));
                }

                // We use Promise.allSettled to ensure that if one API fails,
                // the other can still display its campaigns.
                const results = await Promise.allSettled(promises);

                let allCampaigns: UnifiedCampaign[] = [];
                let fetchErrors: string[] = [];

                // Process Google results
                if (hasGoogle) {
                    const googleResult = results[0];
                    if (googleResult.status === 'fulfilled') {
                        const googleCampaigns = googleResult.value.campaigns.map((c: GoogleCampaign): UnifiedCampaign => ({
                            id: c.id, name: c.name, status: c.status, platform: 'Google',
                            clicks: Number(c.clicks), impressions: Number(c.impressions),
                            ctr: Number(c.ctr) * 100, cost: Number(c.cost), cpc: Number(c.average_cpc),
                        }));
                        allCampaigns = allCampaigns.concat(googleCampaigns);
                    } else {
                        fetchErrors.push("Failed to load Google campaigns.");
                        console.error("Google fetch error:", googleResult.reason);
                    }
                }
                
                // Process Meta results
                if (hasMeta) {
                    const metaResult = results[hasGoogle ? 1 : 0]; // Adjust index based on whether Google was fetched
                    if (metaResult.status === 'fulfilled') {
                        const metaCampaigns = metaResult.value.campaigns.map((c: MetaCampaign): UnifiedCampaign => ({
                            id: c.id, name: c.name, status: c.status, platform: 'Meta',
                            clicks: Number(c.clicks), impressions: Number(c.impressions),
                            ctr: Number(c.ctr), cost: Number(c.cost), cpc: Number(c.average_cpc),
                        }));
                        allCampaigns = allCampaigns.concat(metaCampaigns);
                    } else {
                        fetchErrors.push("Failed to load Meta campaigns.");
                        console.error("Meta fetch error:", metaResult.reason);
                    }
                }

                setCampaigns(allCampaigns);
                if (fetchErrors.length > 0) {
                    setCampaignsError(fetchErrors.join(' '));
                }

            } catch (err) {
                // This would be for a critical failure
                setCampaignsError(err instanceof Error ? err.message : "An unknown error occurred.");
                setCampaigns([]);
            } finally {
                setIsLoadingCampaigns(false);
            }
        };

        if (isAuthReady) fetchCampaignList();
    }, [user, token, isAuthReady]);
    // --- END: Replaced useEffect ---

    useEffect(() => {
        const fetchPerformanceData = async () => {
            if (!selectedCampaign || !token || isComparing) {
                setPerformanceData(null); return;
            }
            setIsPerformanceLoading(true); setPerformanceError(null); setPerformanceData(null);
            try {
                // --- MODIFIED: Check platform before fetching performance ---
                // For now, only Google campaigns have a performance detail endpoint.
                // Meta campaigns will just show 0 stats (handled by backend returning zeros)
                if (selectedCampaign.platform === 'Google') {
                    const data = await getGoogleCampaignPerformance(token, selectedCampaign.id);
                    setPerformanceData(data);
                } else {
                    // For Meta, the backend doesn't have a specific performance endpoint yet,
                    // so we'll just fetch the mock/zero data.
                    // This logic assumes getGoogleCampaignPerformance can handle any ID
                    // and return 0s for non-Google/non-mock IDs, which your backend router does.
                    const data = await getGoogleCampaignPerformance(token, selectedCampaign.id);
                    setPerformanceData(data);
                }
            } catch (err) {
                setPerformanceError(err instanceof Error ? err.message : "Failed to load performance data.");
            } finally {
                setIsPerformanceLoading(false);
            }
        };
        fetchPerformanceData();
    }, [selectedCampaign, token, isComparing]);

    const handleCampaignSelection = (campaignId: string) => {
        if (isComparing) {
            setComparisonIds(prev => {
                const newSet = new Set(prev);
                if (newSet.has(campaignId)) { newSet.delete(campaignId); } 
                else if (newSet.size < 2) { newSet.add(campaignId); }
                return Array.from(newSet);
            });
        } else {
            const campaign = campaigns.find(c => c.id === campaignId) || null;
            setSelectedCampaign(campaign);
        }
    };

    const handleStartComparison = async () => {
        if (comparisonIds.length !== 2 || !token) return;
        setIsComparisonLoading(true);
        setComparisonData(null);
        try {
            // This will correctly call the backend for each ID,
            // returning real data for mock IDs and 0s for others.
            const [data1, data2] = await Promise.all([
                getGoogleCampaignPerformance(token, comparisonIds[0]),
                getGoogleCampaignPerformance(token, comparisonIds[1])
            ]);
            const name1 = campaigns.find(c => c.id === comparisonIds[0])?.name || 'Campaign 1';
            const name2 = campaigns.find(c => c.id === comparisonIds[1])?.name || 'Campaign 2';
            setComparisonData({
                campaign1: data1.statistics, campaign2: data2.statistics,
                campaign1Name: name1, campaign2Name: name2,
            });
        } catch (err) {
            console.error("Failed to fetch comparison data:", err);
        } finally {
            setIsComparisonLoading(false);
        }
    };

    const handleGenerateSuggestion = async () => {
        if (!selectedCampaign || !token) return;
        setIsSuggestionModalOpen(true);
        setIsSuggestionLoading(true);
        setSuggestionError(null); setSuggestionData(null);
        try {
            // This will work for any campaign ID, as the backend just needs the ID
            const data = await getAiSuggestionForCampaign(token, selectedCampaign.id);
            setSuggestionData(data);
        } catch (err) {
            setSuggestionError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsSuggestionLoading(false);
        }
    };
    
    const toggleComparisonMode = () => {
        setIsComparing(!isComparing);
        setSelectedCampaign(null);
        setComparisonIds([]);
        setComparisonData(null);
    };

    // --- Render Logic (Styling changes applied here) ---
    const renderMainContent = () => {
        if (isComparing) {
            return (
                <section className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 md:p-6 rounded-2xl shadow-2xl">
                    {isComparisonLoading ? (
                        <div className="text-center p-10 h-[500px] flex items-center justify-center text-slate-300"><p>Loading comparison data...</p></div>
                    ) : (
                        <CampaignComparisonChart data={comparisonData} />
                    )}
                </section>
            );
        }
        return (
            <>
                <section className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 md:p-6 rounded-2xl shadow-2xl">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <h3 className="text-xl font-semibold text-slate-100">
                            🚀 {selectedCampaign ? `Trends: ${selectedCampaign.name}` : 'Select a Campaign'}
                        </h3>
                        {selectedCampaign && (
                            <button onClick={handleGenerateSuggestion} disabled={isSuggestionLoading} className="mt-3 sm:mt-0 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center transition-colors">
                                Get AI Suggestion
                            </button>
                        )}
                    </div>
                    <TrendsChart data={performanceData?.trends || []} isLoading={isPerformanceLoading} error={performanceError}/>
                </section>
                <section className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 md:p-6 rounded-2xl shadow-2xl">
                    <OverallStats data={performanceData?.statistics || null} title="Campaign Statistics" isLoading={isPerformanceLoading} />
                </section>
            </>
        );
    };

    return (
        // --- THIS IS THE FIX: The outer div no longer has a background color, allowing the layout's background to show through ---
        <div>
            <header className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Ad Insights Dashboard</h1>
                <div className="mt-2 sm:mt-0 flex items-center space-x-3">
                    <button 
                        onClick={toggleComparisonMode} 
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                            isComparing 
                                ? 'bg-indigo-500 text-white hover:bg-indigo-600' 
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        {isComparing ? 'Exit Comparison' : 'Compare Campaigns'}
                    </button>
                    {isComparing && (
                        <button 
                            onClick={handleStartComparison} 
                            disabled={comparisonIds.length !== 2 || isComparisonLoading} 
                            className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isComparisonLoading ? 'Loading...' : `Compare ${comparisonIds.length}/2 Selected`}
                        </button>
                    )}
                </div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <main className="lg:col-span-9 space-y-6">{renderMainContent()}</main>
                <aside className="lg:col-span-3">
                    <CampaignList
                        campaigns={campaigns}
                        onCampaignSelect={handleCampaignSelection}
                        isLoading={isLoadingCampaigns}
                        error={campaignsError}
                        isComparing={isComparing}
                        comparisonIds={comparisonIds}
                        selectedCampaignId={selectedCampaign?.id || null}
                    />
                </aside>
            </div>
            <SuggestionModal
                isOpen={isSuggestionModalOpen}
                onClose={() => setIsSuggestionModalOpen(false)}
                suggestionData={suggestionData}
                isLoading={isSuggestionLoading}
                error={suggestionError}
            />
        </div>
    );
}