// D:\socialadify\frontend\src\services\historyService.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Define the types for the items we'll get from the history
interface BaseHistoryItem {
    id: string;
    user_id: string;
    caption: string;
    created_at: string;
}

export interface CaptionHistoryItem extends BaseHistoryItem {
    item_type: 'caption';
    // Caption-specific fields if any
}

export interface PostHistoryItem extends BaseHistoryItem {
    item_type: 'post';
    image_url: string;
    // Post-specific fields if any
}

export type HistoryItem = CaptionHistoryItem | PostHistoryItem;

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


/**
 * Fetches the unified history for the current user.
 * @param token The user's JWT for authentication.
 * @returns A promise that resolves to an array of HistoryItem objects.
 */
export async function fetchHistory(token: string): Promise<HistoryItem[]> {
    const response = await fetch(`${API_BASE_URL}/history/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        return handleApiError(response, 'Failed to fetch history.');
    }
    
    return response.json();
}

export async function deleteVisualPost(token: string, postId: string): Promise<void> {
    // This assumes your backend has a delete endpoint for posts.
    // We may need to add this if it doesn't exist.
    const response = await fetch(`${API_BASE_URL}/post-generator/${postId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        return handleApiError(response, 'Failed to delete visual post.');
    }
}