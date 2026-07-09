// D:/socialadify/frontend/src/services/schedulerService.ts
import { UserPublic } from '../services/authService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface ScheduledPost {
    id: string;
    user_id: string;
    caption: string;
    scheduled_at: string; // ISO string format
    image_url: string;
    status: string;
    created_at: string;
    updated_at: string;
    target_platform?: string | null;
    auto_post: boolean;
    auto_boost: boolean;
    boost_budget?: number | null;
    boost_duration_days?: number | null;
}

//NEW CALENDAR KY interfaces hain yeh 
export interface CalendarDayStatus {
    date: string; // YYYY-MM-DD
    status: 'uploaded' | 'scheduled' | 'failed' | 'completed';
    count: number;
}

export interface CalendarStatusResponse {
    statuses: CalendarDayStatus[];
}

//ENDSSS HERE 
// --- NEW INTERFACES FOR AI SUGGESTION ---
interface AISuggestionRequest {
    caption: string;
    target_platform: string;
    is_boosted: boolean;
}

interface AISuggestionResponse {
    suggested_time_utc: string;
    reasoning?: string;
}


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

export interface SchedulePostPayload {
    caption: string;
    scheduled_at_str: string;
    image_file: File;
    target_platform?: string;
    auto_post: boolean;
    auto_boost: boolean;
    boost_budget?: number;
    boost_duration_days?: number;
}

export interface UpdatePostPayload {
    caption?: string;
    scheduled_at_str?: string;
    target_platform?: string | null;
}


// --- NEW FUNCTION TO GET AI SUGGESTION ---
/**
 * Fetches an AI-powered time suggestion from the backend.
 */
export async function getAISuggestion(token: string, payload: AISuggestionRequest): Promise<AISuggestionResponse> {
    const response = await fetch(`${API_BASE_URL}/scheduler/suggestion`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        return handleApiError(response, 'Failed to get AI suggestion.');
    }
    return response.json();
}


/**
 * Creates a new scheduled post.
 */
export async function createScheduledPost(token: string, payload: SchedulePostPayload): Promise<ScheduledPost> {
    const formData = new FormData();
    formData.append('caption', payload.caption);
    formData.append('scheduled_at_str', payload.scheduled_at_str);
    formData.append('image_file', payload.image_file);
    if (payload.target_platform) {
        formData.append('target_platform', payload.target_platform);
    }
    formData.append('auto_post', String(payload.auto_post));
    formData.append('auto_boost', String(payload.auto_boost));
    if (payload.auto_boost && payload.boost_budget) {
        formData.append('boost_budget', String(payload.boost_budget));
    }
    if (payload.auto_boost && payload.boost_duration_days) {
        formData.append('boost_duration_days', String(payload.boost_duration_days));
    }

    const response = await fetch(`${API_BASE_URL}/scheduler/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        return handleApiError(response, 'Failed to schedule post.');
    }
    return response.json();
}

/**
 * Fetches a list of scheduled posts for the user.
 */
export async function fetchScheduledPosts(token: string, skip: number = 0, limit: number = 10): Promise<ScheduledPost[]> {
    const response = await fetch(`${API_BASE_URL}/scheduler/?skip=${skip}&limit=${limit}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
        return handleApiError(response, 'Failed to fetch scheduled posts.');
    }
    return response.json();
}

/**
 * Deletes a scheduled post.
 */
export async function deleteScheduledPost(token: string, postId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/scheduler/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
        return handleApiError(response, 'Failed to delete post.');
    }
}

/**
 * Updates an existing scheduled post.
 */
export async function updateScheduledPost(token: string, postId: string, payload: UpdatePostPayload): Promise<ScheduledPost> {
    const response = await fetch(`${API_BASE_URL}/scheduler/${postId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        return handleApiError(response, 'Failed to update post.');
    }
    return response.json();
}


// --- NEW FUNCTION TO GET MONTHLY POST STATUS ---(Nayye dashboardd calendarr ky functionss hainn)

/**
 * Fetches the aggregated status of scheduled posts for a given month and year.
 * Endpoint: GET /scheduler/status
 * @param token JWT token for authentication.
 * @param year The year to query (e.g., 2025).
 * @param month The month to query (1-12).
 */
export const getMonthlyPostStatus = async (
    token: string,
    year: number,
    month: number
): Promise<CalendarStatusResponse> => {
    // 💡 Note: I am assuming the path is '/scheduler/status' based on the backend router path: '/scheduling/status'
    // If your main router includes the prefix 'scheduling', the final path is correct.
    const url = `${API_BASE_URL}/scheduler/status?year=${year}&month=${month}`; 

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        return handleApiError(response, 'Failed to fetch calendar status.');
    }

    return response.json();
};