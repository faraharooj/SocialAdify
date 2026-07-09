// D:\socialadify\frontend\src\services\adminService.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Re-using UserPublic interface from authService for consistency
import { UserPublic } from './authService';

// --- Error Handling Helper (can be a shared utility if many services) ---
async function handleAdminApiError(response: Response, defaultErrorMessage: string): Promise<never> {
    let processedErrorMessage = defaultErrorMessage;
    console.error(`ADMIN_SERVICE_HANDLE_ERROR: Status: ${response.status}, Content-Type: ${response.headers.get('Content-Type')}`);
    try {
        const responseText = await response.text();
        console.error("ADMIN_SERVICE_HANDLE_ERROR: Response Text:", responseText);
        try {
            const errorData = JSON.parse(responseText);
            console.error("ADMIN_SERVICE_HANDLE_ERROR: Parsed JSON errorData:", errorData);
            // MODIFIED: Streamlined error message extraction
            if (errorData && typeof errorData.detail === 'string') {
                processedErrorMessage = errorData.detail;
            } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
                // For Pydantic validation errors, FastAPI often returns an array of objects with 'msg'
                const firstError = errorData.detail[0];
                if (typeof firstError === 'object' && firstError !== null && 'msg' in firstError) {
                    processedErrorMessage = (firstError as { msg: string }).msg;
                } else {
                    processedErrorMessage = `Validation errors: ${JSON.stringify(errorData.detail)}`;
                }
            } else if (responseText) {
                processedErrorMessage = responseText;
            }
        } catch (jsonParseError) {
            console.error("ADMIN_SERVICE_HANDLE_ERROR: Failed to parse response as JSON.", jsonParseError);
            if (responseText) {
                processedErrorMessage = responseText;
            }
        }
    } catch (e) {
        console.error("ADMIN_SERVICE_HANDLE_ERROR: Error reading response body.", e);
    }
    console.error("ADMIN_SERVICE_THROWING_ERROR_MESSAGE:", processedErrorMessage);
    throw new Error(processedErrorMessage);
}

/**
 * Fetches a list of all users from the backend for the admin panel.
 * @param token The authentication token of the admin user.
 * @param skip Number of users to skip (for pagination).
 * @param limit Maximum number of users to return.
 * @param search Optional search query for email, first name, or last name.
 * @returns A promise that resolves to an array of UserPublic objects.
 */
export async function fetchAllUsers(
    token: string,
    skip: number = 0,
    limit: number = 10,
    search: string = ''
): Promise<UserPublic[]> {
    console.log(`adminService: Fetching all users (skip: ${skip}, limit: ${limit}, search: '${search}')`);
    const queryParams = new URLSearchParams({
        skip: String(skip),
        limit: String(limit),
    });
    if (search) {
        queryParams.append('search', search);
    }

    const response = await fetch(`${API_BASE_URL}/admin/users?${queryParams.toString()}`, {
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
        if (response.status === 403) {
            throw new Error("Forbidden: You do not have administrative privileges.");
        }
        return handleAdminApiError(response, 'Failed to fetch users.');
    }
    return response.json();
}

/**
 * Fetches the total count of users, optionally filtered by a search query.
 * @param token The authentication token of the admin user.
 * @param search Optional search query for email, first name, or last name.
 * @returns A promise that resolves to the total count of users.
 */
export async function fetchUsersCount(
    token: string,
    search: string = ''
): Promise<number> {
    console.log(`adminService: Fetching user count (search: '${search}')`);
    const queryParams = new URLSearchParams();
    if (search) {
        queryParams.append('search', search);
    }

    const response = await fetch(`${API_BASE_URL}/admin/users/count?${queryParams.toString()}`, {
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
        if (response.status === 403) {
            throw new Error("Forbidden: You do not have administrative privileges.");
        }
        return handleAdminApiError(response, 'Failed to fetch user count.');
    }
    return response.json();
}

/**
 * Deletes a user account by their ID.
 * @param token The authentication token of the admin user.
 * @param userId The ID of the user to delete.
 * @returns A promise that resolves when the user is successfully deleted.
 */
export async function deleteUser(token: string, userId: string): Promise<void> {
    console.log(`adminService: Attempting to delete user ID: ${userId}`);
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Unauthorized: Session may have expired. Please log in again.");
        }
        if (response.status === 403) {
            throw new Error("Forbidden: You do not have administrative privileges.");
        }
        // For 204 No Content, response.ok is true, so this only runs for other errors
        return handleAdminApiError(response, `Failed to delete user ID: ${userId}.`);
    }
    // No content expected for a 204 No Content response
    console.log(`adminService: User ID ${userId} deleted successfully.`);
}