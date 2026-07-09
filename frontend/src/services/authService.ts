// D:\socialadify\frontend\src\services\authService.ts
// Merged version

/* eslint-disable no-console */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// --- Interfaces ---

export interface SignupData {
    email: string;
    password: string;
    firstname: string;
    lastname: string;
}

export interface LoginFormData {
    email: string;
    password: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
}

export interface UserPublic {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    profile_picture_url?: string | null;
    is_admin: boolean;

    google_ad_account_id?: string | null;
    meta_ad_account_id?: string | null;
    linked_page_id?: string | null;
    linked_page_name?: string | null;
    linked_instagram_id?: string | null;
    linked_instagram_username?: string | null;
}

export interface UserProfileUpdateData {
    firstname?: string;
    lastname?: string;
    new_email?: string;
}

export interface RequestPasswordResetPayloadFE {
    email: string;
}

export interface ResetPasswordPayloadFE {
    token: string;
    new_password: string;
}

export interface ChangePasswordData {
    current_password: string;
    new_password: string;
}

export interface DeleteAccountData {
    password: string;
}

export interface MetaCredentialsPayload {
    meta_ad_account_id: string;
    meta_access_token: string;
}

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

// --- API Functions ---

// --- NEW: Functions for Password Reset ---
export async function requestPasswordReset(payload: RequestPasswordResetPayloadFE): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) return handleApiError(response, 'Failed to request password reset.');
    return response.json();
}

export async function resetPassword(payload: ResetPasswordPayloadFE): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) return handleApiError(response, 'Failed to reset password.');
    return response.json();
}
// --- END of new functions ---


export async function signupUser(userData: SignupData): Promise<UserPublic> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    if (!response.ok) return handleApiError(response, 'Signup failed.');
    return response.json();
}

export async function loginUser(credentials: LoginFormData): Promise<TokenResponse> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
    });
    if (!response.ok) return handleApiError(response, 'Login failed.');
    return response.json();
}

export async function getUserProfile(token: string): Promise<UserPublic> {
    const response = await fetch(`${API_BASE_URL}/auth/users/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) return handleApiError(response, 'Failed to fetch user profile.');
    return response.json();
}

export async function getGoogleAuthUrl(token: string): Promise<{ authorization_url: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/google/auth-url`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) return handleApiError(response, 'Failed to get Google auth URL.');
    return response.json();
}

export async function getMetaAuthUrl(token: string): Promise<{ authorization_url: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/meta/auth-url`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) return handleApiError(response, 'Failed to get Meta auth URL.');
    return response.json();
}

export async function apiUpdateUserProfileText(token: string, profileData: UserProfileUpdateData): Promise<UserPublic> {
    const formData = new URLSearchParams();
    if (profileData.firstname) formData.append('firstname', profileData.firstname);
    if (profileData.lastname) formData.append('lastname', profileData.lastname);
    if (profileData.new_email) formData.append('new_email', profileData.new_email);
    const response = await fetch(`${API_BASE_URL}/auth/users/me/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
    });
    if (!response.ok) return handleApiError(response, 'Failed to update profile.');
    return response.json();
}

export async function apiUploadProfilePicture(token: string, imageFile: File): Promise<UserPublic> {
    const formData = new FormData();
    formData.append('profile_picture', imageFile);
    const response = await fetch(`${API_BASE_URL}/auth/users/me/profile-picture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });
    if (!response.ok) return handleApiError(response, 'Failed to upload picture.');
    return response.json();
}

export async function apiChangePassword(token: string, payload: ChangePasswordData): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/users/me/change-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) return handleApiError(response, 'Failed to change password.');
    return response.json();
}

export async function apiDeleteAccount(token: string, payload: DeleteAccountData): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/users/me/delete-account`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) return handleApiError(response, 'Failed to delete account.');
    return response.json();
}

export async function apiSaveMetaCredentials(token: string, payload: MetaCredentialsPayload): Promise<UserPublic> {
    const response = await fetch(`${API_BASE_URL}/auth/users/me/meta-credentials`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) return handleApiError(response, 'Failed to save Meta credentials.');
    return response.json();
}

