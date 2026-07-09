'use client';

import { format } from 'date-fns';

// Use the environment variable for the API base URL
// --- FIX: Use NEXT_PUBLIC_API_BASE_URL to match your authService.ts ---
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// --- Error Handling ---
async function handleApiError(response: Response, defaultErrorMessage: string): Promise<never> {
    let processedErrorMessage = defaultErrorMessage;
    try {
        const errorData = await response.json();
        if (errorData && errorData.detail) {
            processedErrorMessage = errorData.detail;
        }
    } catch (e) { /* Ignore if the response is not JSON */ }
    throw new Error(processedErrorMessage);
}

// --- TypeScript Types ---

export interface PageInsightDataPoint {
    date: string;
    reach?: number; // Changed to optional to match backend logic
    impressions?: number; // Changed to optional
    engagement?: number; // Changed to optional
    follower_count?: number; // Changed to optional
}

export interface PageInsightsResponse {
    platform: string; // Added platform
    totals: {
        reach: number;
        impressions: number;
        engagement: number;
        follower_count?: number; // Changed to optional
    };
    // --- THIS IS THE FIX (Part 1) ---
    // Renamed 'time_series' to 'data' to match the backend schema
    data: PageInsightDataPoint[];
}

// --- FIX: Update PostInsight to match backend schema ---
export interface PostReactions {
    like?: number;
    love?: number;
    wow?: number;
    haha?: number;
    sad?: number;
    angry?: number;
    total?: number;
}
export interface PostInsight {
    post_id: string;
    platform: string;
    created_time: string;
    message?: string | null;
    
    impressions?: number;
    reach?: number;
    engagement?: number;
    comments?: number;
    shares?: number;
    reactions: PostReactions;
}
// --- END FIX ---

export interface PostInsightsResponse {
    posts: PostInsight[];
}

type Platform = 'facebook' | 'instagram';

// --- API Fetch Functions ---

const formatDateForApi = (date: Date) => format(date, 'yyyy-MM-dd');

export async function fetchPageInsights(
    token: string,
    platform: Platform,
    startDate: Date,
    endDate: Date
): Promise<PageInsightsResponse> {
    const params = new URLSearchParams({
        platform: platform, // <-- ADDED platform
        start_date: formatDateForApi(startDate),
        end_date: formatDateForApi(endDate),
    });

    // --- FIX: Removed the /meta/${platform} prefix to match your 404 fix ---
    const response = await fetch(`${API_BASE_URL}/insights/page-insights?${params.toString()}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) return handleApiError(response, 'Failed to fetch page insights.');
    return response.json();
}

export async function fetchPostInsights(
    token: string,
    platform: Platform,
    startDate: Date,
    endDate: Date
): Promise<PostInsightsResponse> {
    const params = new URLSearchParams({
        platform: platform, // <-- ADDED platform
        start_date: formatDateForApi(startDate),
        end_date: formatDateForApi(endDate),
    });

    // --- FIX: Removed the /meta/${platform} prefix to match your 404 fix ---
    const response = await fetch(`${API_BASE_URL}/insights/post-insights?${params.toString()}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) return handleApiError(response, 'Failed to fetch post insights.');
    return response.json();
}