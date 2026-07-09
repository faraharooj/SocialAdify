// D:\socialadify\frontend\src\services\captionService.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface CaptionSaveData {
    caption_text: string;
    category?: string; 
    tone?: string;     
    include_hashtags?: boolean;
    include_emojis?: boolean;
    image_description_used?: string | null; 
    source_image_filename?: string | null;  
    is_edited: boolean; 
}

export interface CaptionUpdateData {
    caption_text: string;
}

export interface SavedCaption {
    id: string;
    user_id: string;
    caption_text: string;
    preferences_category?: string | null;
    preferences_tone?: string | null;
    preferences_include_hashtags?: boolean | null;
    preferences_include_emojis?: boolean | null;
    original_image_description?: string | null;
    source_image_filename?: string | null;
    is_edited: boolean;
    source: string;
    created_at: string; 
    updated_at: string; 
    item_type: "caption"; // *** THIS LINE IS THE FIX ***
}

async function handleCaptionApiError(response: Response, defaultErrorMessage: string): Promise<never> {
    let processedErrorMessage = defaultErrorMessage;
    try {
        const errorData = await response.json();
        if (errorData && errorData.detail) {
            processedErrorMessage = errorData.detail;
        } else if (response.statusText) {
            processedErrorMessage = response.statusText;
        }
    } catch (parseError) { 
        console.warn("Caption Service: Could not parse error response as JSON.", parseError);
    }
    console.error("Caption Service API Error:", processedErrorMessage, "Status:", response.status);
    throw new Error(processedErrorMessage);
}


export async function saveCaptionToDB(token: string, captionData: CaptionSaveData): Promise<SavedCaption> {
    const response = await fetch(`${API_BASE_URL}/captions/save`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(captionData),
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Unauthorized: Session may have expired. Please log in again.");
        }
        return handleCaptionApiError(response, 'Failed to save caption.');
    }
    return response.json();
}

export async function fetchUserCaptionHistory(token: string, skip: number = 0, limit: number = 10): Promise<SavedCaption[]> {
    const response = await fetch(`${API_BASE_URL}/captions/history?skip=${skip}&limit=${limit}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Unauthorized: Session may have expired. Please log in again.");
        }
        return handleCaptionApiError(response, 'Failed to fetch caption history.');
    }
    return response.json();
}

export async function updateSavedCaptionInDB(token: string, captionId: string, updateData: CaptionUpdateData): Promise<SavedCaption> {
    const response = await fetch(`${API_BASE_URL}/captions/${captionId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Unauthorized: Session may have expired. Please log in again.");
        }
        return handleCaptionApiError(response, 'Failed to update caption.');
    }
    return response.json();
}

export async function deleteSavedCaptionFromDB(token: string, captionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/captions/${captionId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Unauthorized: Session may have expired. Please log in again.");
        }
        if (response.status !== 204) {
             return handleCaptionApiError(response, 'Failed to delete caption.');
        }
    }
}
