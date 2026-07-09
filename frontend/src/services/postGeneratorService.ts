// D:/socialadify/frontend/src/services/postGeneratorService.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// --- Types for AI Post Generation ---
export interface PostGenerationPayload {
    product_name: string;
    target_audience: string;
    key_features: string[];
    tone: string;
    platform: string;
    call_to_action: string;
    aspect_ratio: string;
}

export interface PostGenerationResult {
    image_data_url: string;
    prompt_used: string;
}

export interface SavePostPayload {
    image_data_url: string;
    prompt_used: string;
    original_request: PostGenerationPayload;
}

// Define specific types for each kind of editable field
export interface EditableTextField {
    key: string;
    label: string;
    type: 'text'; // Discriminated union key
    position: { x: number; y: number };
    font: string;
    font_size: number;
    color: string;
    max_length: number;
}

export interface EditableImageField {
    key: string;
    label: string;
    type: 'image'; // Discriminated union key
    position: { x: number; y: number };
    width: number;
    height: number;
}

// The EditableField is a union of the two specific types
export type EditableField = EditableTextField | EditableImageField;


export interface Template {
    id: string;
    name: string;
    description: string;
    preview_image_path: string;
    base_image_path: string;
    editable_fields?: EditableField[];
}


// --- Error Handling Helper ---
async function handleApiError(response: Response, defaultErrorMessage: string): Promise<never> {
    let processedErrorMessage = defaultErrorMessage;
    try {
        const errorData = await response.json();
        if (errorData && errorData.detail) {
            processedErrorMessage = errorData.detail;
        }
    } catch (e) {
        // Ignore if the response is not JSON
    }
    throw new Error(processedErrorMessage);
}


// --- API Call Functions ---
export async function generateVisualPost(token: string, payload: PostGenerationPayload): Promise<PostGenerationResult> {
    const response = await fetch(`${API_BASE_URL}/post-generator/generate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Unauthorized: Your session may have expired. Please log in again.");
        }
        return handleApiError(response, 'Failed to generate visual post.');
    }

    return response.json();
}

export async function saveVisualPost(token: string, payload: SavePostPayload): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/post-generator/save`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Unauthorized: Your session may have expired. Please log in again.");
        }
        return handleApiError(response, 'Failed to save the post.');
    }

    return response.json();
}

// --- Functions for Template Feature ---
export async function getTemplates(token: string): Promise<Template[]> {
    const response = await fetch(`${API_BASE_URL}/templates`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
        return handleApiError(response, 'Failed to fetch templates.');
    }
    
    const data = await response.json();
    
    // --- ADDED THIS DEBUG LINE ---
    console.log("--- DEBUG: Raw data received from API:", data);
    // ---------------------------

    return data;
}

// --- UPDATED: generateFromTemplate now accepts FormData ---
export async function generateFromTemplate(
    token: string,
    templateId: string,
    formData: FormData // Changed from Record<string, string> to FormData
): Promise<{ generated_image_url: string }> {
    const response = await fetch(`${API_BASE_URL}/templates/${templateId}/generate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            // NOTE: Do NOT set 'Content-Type'. The browser sets it automatically for FormData.
        },
        body: formData,
    });
    if (!response.ok) {
        return handleApiError(response, 'Failed to generate image from template.');
    }
    return response.json();
}

