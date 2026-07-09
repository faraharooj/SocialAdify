// D:\socialadify\frontend\src\services\insightsService.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

import { UserPublic } from './authService';

// --- Interfaces ---

export interface GoogleAdAccount {
    id: string;
    name: string;
    is_manager: boolean;
    is_test_account: boolean;
}

interface GoogleAdAccountsResponse {
    accounts: GoogleAdAccount[];
}

export interface GoogleCampaign {
    id: string;
    name: string;
    status: string;
    clicks: number;
    impressions: number;
    ctr: number;
    average_cpc: number;
    cost: number;
}

interface GoogleCampaignsResponse {
    campaigns: GoogleCampaign[];
}

// --- ADDED: Meta Campaign Interfaces ---
export interface MetaCampaign {
    id: string;
    name: string;
    status: string;
    clicks: number;
    impressions: number;
    ctr: number;
    average_cpc: number;
    cost: number;
}

interface MetaCampaignsResponse {
    campaigns: MetaCampaign[];
}
// --- END: Meta Campaign Interfaces ---
// --- Interfaces for detailed campaign performance data ---
export interface TrendPoint {
    date: string;
    impressions: number;
    clicks: number;
    cost_micros: number;
}

// --- MODIFIED: The Statistics interface now includes all 10 metrics ---
export interface Statistics {
    impressions: number;
    clicks: number;
    cost: number;
    ctr: number;
    avg_cpc: number;
    // New fields
    reach: number;
    frequency: number;
    cpm: number;
    conversions: number;
    cpa: number;
}

export interface PerformanceData {
    trends: TrendPoint[];
    statistics: Statistics;
}

// --- Interface for AI Suggestion response ---
export interface AISuggestion {
    ad_id: string; // The backend uses 'ad_id', which will hold our campaign_id
    suggestion: string;
}

export interface DashboardOverviewResponse {
    impressions: { value: string; trend: number; status: string };
    cost_micros: { value: string; trend: number; status: string };
    clicks: { value: string; trend: number; status: string };
}


// --- Error Handling ---
async function handleApiError(response: Response, defaultErrorMessage: string): Promise<never> {
    let processedErrorMessage = defaultErrorMessage;
    try {
        const errorData = await response.json();
        if (errorData && errorData.detail) {
            processedErrorMessage = errorData.detail;
        }
    } catch (e) { /* Ignore */ }
    throw new Error(processedErrorMessage);
}

// --- API Functions ---

export async function getGoogleAdAccounts(token: string): Promise<GoogleAdAccountsResponse> {
    const response = await fetch(`${API_BASE_URL}/insights/google/ad-accounts`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) return handleApiError(response, 'Failed to fetch Google Ads accounts.');
    return response.json();
}

export async function saveGoogleAdAccount(token: string, adAccountId: string): Promise<UserPublic> {
    const response = await fetch(`${API_BASE_URL}/insights/google/set-ad-account`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ad_account_id: adAccountId }),
    });
    if (!response.ok) return handleApiError(response, 'Failed to save the selected Google Ad Account.');
    return response.json();
}

export async function getGoogleCampaigns(token: string): Promise<GoogleCampaignsResponse> {
    const response = await fetch(`${API_BASE_URL}/insights/google/campaigns`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) return handleApiError(response, 'Failed to fetch Google Ads campaigns.');
    return response.json();
}

// --- ADDED: getMetaCampaigns function ---
export async function getMetaCampaigns(token: string): Promise<MetaCampaignsResponse> {
    const response = await fetch(`${API_BASE_URL}/ads/meta/campaigns`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) return handleApiError(response, 'Failed to fetch Meta Ads campaigns.');
    return response.json();
}

export const getGoogleCampaignPerformance = async (token: string, campaignId: string): Promise<PerformanceData> => {
    const response = await fetch(`${API_BASE_URL}/insights/google/campaigns/${campaignId}/performance`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        return handleApiError(response, 'Failed to fetch campaign performance data.');
    }
    return response.json();
};


// --- Function to fetch AI suggestion for a campaign ---
export const getAiSuggestionForCampaign = async (token: string, campaignId: string): Promise<AISuggestion> => {
    const response = await fetch(`${API_BASE_URL}/insights/campaign/${campaignId}/generate-suggestion`, {
        method: 'POST', // Use POST as it triggers a process on the backend
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        return handleApiError(response, 'Failed to fetch AI suggestion.');
    }
    return response.json();
};

export async function getDashboardOverview(token: string): Promise<DashboardOverviewResponse> {
    // --- MODIFIED: Changed path from /insights/google/overview to /insights/overview ---
    const response = await fetch(`${API_BASE_URL}/insights/overview`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) return handleApiError(response, 'Failed to fetch dashboard overview.');
    return response.json();
}