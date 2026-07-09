// D:\socialadify\frontend\src\services\adCreatorService.ts

import { UserPublic } from './authService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// --- Error Handling (copied from your schedulerService) ---
// --- UPDATED TO HANDLE 422 VALIDATION ERRORS ---
async function handleApiError(response: Response, defaultErrorMessage: string): Promise<never> {
    let processedErrorMessage = defaultErrorMessage;
    try {
        const errorData = await response.json();
        if (errorData && errorData.detail) {
            // Check if detail is an array (FastAPI 422 error)
            if (Array.isArray(errorData.detail)) {
                processedErrorMessage = errorData.detail
                    .map((err: any) => `${err.loc[err.loc.length - 1]}: ${err.msg}`)
                    .join('; ');
            } 
            // Check if detail is a simple string
            else if (typeof errorData.detail === 'string') {
                processedErrorMessage = errorData.detail;
            }
        }
    } catch (e) { /* Ignore */ }
    throw new Error(processedErrorMessage);
}

// --- Interface Definitions ---

// --- Audience Interface Removed ---


// --- Interface Definitions ---

// --- FIX: Moved Meta interfaces to the top ---
export interface MetaAdCreativePayload {
    campaign_name: string;
    ad_goal: string;
    platform: 'META';
    budget: number;
    primary_text: string;
    headline: string;
    website_url: string;
    call_to_action: string;
}

export interface MetaAdCreativeFormPayload {
    ad_data: MetaAdCreativePayload;
    image_file: File;
}

export interface MetaAdCreativePublic {
    id: string;
    user_id: string;
    campaign_name: string;
    ad_goal: string;
    platform: string;
    budget: number;
    primary_text: string;
    headline: string;
    website_url: string;
    call_to_action: string;
    image_url?: string | null;
    status: 'DRAFT' | 'PUBLISHED' | 'FAILED';
    created_at: string;
    updated_at: string;
    error_message?: string | null;
}
// ---

// --- UPDATED: This now matches all fields in the new form ---
export interface AdCreativePayload {
    campaign_name: string;
    ad_goal: string;
    platform: 'GOOGLE' | 'META';
    budget: number;
    // New Ad Creative Fields
    final_url: string;
    business_name: string;
    call_to_action_text: string;
    headlines: string[];
    long_headline: string;
    descriptions: string[];
}
// ---

// --- UPDATED PAYLOAD FOR THE FORM ---
export interface AdCreativeFormPayload {
    ad_data: AdCreativePayload;
    image_file_square: File;
    image_file_landscape: File;
}
// ---

// --- UPDATED: This now matches all fields in the new form ---
export interface AdCreativePublic {
    id: string;
    user_id: string;
    campaign_name: string;
    ad_goal: string;
    platform: string;
    budget: number;
    final_url: string;
    business_name: string;
    call_to_action_text: string;
    headlines: string[];
    long_headline: string;
    descriptions: string[];

    // Image URLs
    image_url_square?: string | null;
    image_url_landscape?: string | null;
    
    status: 'DRAFT' | 'PUBLISHED' | 'FAILED';
    created_at: string;
    updated_at: string;
    error_message?: string | null;
}
// ---
// --- RE-ADDED: AI Suggestion Schemas ---
export interface AIPlatformSuggestionRequest {
    ad_goal: string;
    audience_description: string;
    product_description: string;
}

export interface AIPlatformSuggestionResponse {
    recommendation: string;
    recommended_platform: 'GOOGLE' | 'META';
}

/**
 * Creates a new Ad Creative draft.
 * --- UPDATED TO HANDLE TWO FILE UPLOADS ---
 */
export async function createAdCreative(
    token: string, 
    payload: AdCreativeFormPayload // <-- Use new payload
): Promise<AdCreativePublic> {
    
    // Create FormData
    const formData = new FormData();
    
    // --- NEW: Append both image files ---
    formData.append('image_file_square', payload.image_file_square);
    formData.append('image_file_landscape', payload.image_file_landscape);
    
    // Append the rest of the ad data as a JSON string
    formData.append('ad_data_json', JSON.stringify(payload.ad_data));

    const response = await fetch(`${API_BASE_URL}/ads/`, {
        method: 'POST',
        headers: {
            // 'Content-Type' is NOT set here.
            // The browser will automatically set it to 'multipart/form-data'
            // and include the boundary.
            'Authorization': `Bearer ${token}`,
        },
        body: formData, // <-- Send FormData
    });

    if (!response.ok) {
        return handleApiError(response, 'Failed to create ad draft.');
    }
    return response.json();
}

export async function getAIPlatformSuggestion(
    token: string, 
    payload: AIPlatformSuggestionRequest
): Promise<AIPlatformSuggestionResponse> {
    const response = await fetch(`${API_BASE_URL}/ads/recommend`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        return handleApiError(response, 'Failed to get AI platform suggestion.');
    }
    return response.json();
}
// ---
/**
 * Fetches all ad creatives for the user.
 */
export async function fetchAdCreatives(
    token: string, 
    skip: number = 0, 
    limit: number = 100
): Promise<AdCreativePublic[]> {
    const response = await fetch(`${API_BASE_URL}/ads/?skip=${skip}&limit=${limit}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
        return handleApiError(response, 'Failed to fetch ad creatives.');
    }
    return response.json();
}

/**
 * Deletes an ad creative draft.
 */
export async function deleteAdCreative(token: string, adId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/ads/${adId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
        return handleApiError(response, 'Failed to delete ad draft.');
    }
}

/**
 * Publishes a saved ad draft to the Google Ads API.
 */
export async function publishAdToGoogle(token: string, adId: string): Promise<AdCreativePublic> {
    const response = await fetch(`${API_BASE_URL}/ads/publish/google/${adId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        return handleApiError(response, 'Failed to publish ad to Google.');
    }
    return response.json();
}

export async function createMetaAdDraft(
    token: string, 
    payload: MetaAdCreativeFormPayload
): Promise<MetaAdCreativePublic> {
    
    const formData = new FormData();
    formData.append('image_file', payload.image_file);
    formData.append('ad_data_json', JSON.stringify(payload.ad_data));

    const response = await fetch(`${API_BASE_URL}/ads/meta/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        return handleApiError(response, 'Failed to create Meta ad draft.');
    }
    return response.json();
}

/**
 * Fetches all Meta ad creatives for the user.
 */
export async function fetchMetaAdCreatives(
    token: string, 
    skip: number = 0, 
    limit: number = 100
): Promise<MetaAdCreativePublic[]> {
    const response = await fetch(`${API_BASE_URL}/ads/meta/?skip=${skip}&limit=${limit}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
        return handleApiError(response, 'Failed to fetch Meta ad creatives.');
    }
    return response.json();
}

/**
 * Deletes a Meta ad creative draft.
 */
export async function deleteMetaAdCreative(token: string, adId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/ads/meta/${adId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
        return handleApiError(response, 'Failed to delete Meta ad draft.');
    }
}

/**
 * Publishes a saved Meta ad draft.
 */
export async function publishAdToMeta(token: string, adId: string): Promise<MetaAdCreativePublic> {
    const response = await fetch(`${API_BASE_URL}/ads/meta/publish/${adId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        return handleApiError(response, 'Failed to publish ad to Meta.');
    }
    return response.json();
}
// ---