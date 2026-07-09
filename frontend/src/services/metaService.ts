// D:/socialadify/frontend/src/services/metaService.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// --- Interfaces to match the new backend responses ---

export interface MetaAuthUrlResponse {
    authorization_url: string;
}

export interface MetaAccount {
    page_id: string;
    page_name: string;
    instagram_id: string | null;
    instagram_username: string | null;
}

export interface MetaPagesResponse {
    accounts: MetaAccount[];
}

export interface LinkedMetaAccountPayload {
    page_id: string;
    page_name: string;
    instagram_id?: string | null;
    instagram_username?: string | null;
}

// --- Helper for consistent error handling ---

async function handleApiError(response: Response, defaultMessage: string): Promise<never> {
    try {
        const errorData = await response.json();
        throw new Error(errorData.detail || defaultMessage);
    } catch {
        throw new Error(defaultMessage);
    }
}

// --- API Functions ---

/**
 * Fetches the Meta OAuth URL from the backend.
 * The user will be redirected to this URL to start the login flow.
 */
export async function getMetaAuthUrl(token: string): Promise<MetaAuthUrlResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/meta/auth-url`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) await handleApiError(response, 'Failed to get Meta authentication URL.');
    return response.json();
}

/**
 * After a successful OAuth redirect, this fetches the user's available 
 * Facebook Pages and any linked Instagram accounts from our backend.
 */
export async function getMetaPages(token: string): Promise<MetaPagesResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/meta/pages`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) await handleApiError(response, "Failed to fetch user's Meta pages.");
    return response.json();
}

/**
 * Saves the user's selected Page and Instagram account details to the backend.
 */
export async function saveLinkedMetaAccount(token: string, payload: LinkedMetaAccountPayload): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/meta/save-account`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) await handleApiError(response, 'Failed to save the selected account.');
    return response.json();
}

/**
 * Disconnects the user's Meta account by clearing all credentials on the backend.
 */
export async function disconnectMetaAccount(token: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/meta/disconnect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) await handleApiError(response, 'Failed to disconnect the Meta account.');
    return response.json();
}

