// D:/socialadify/frontend/src/app/connections/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MetaIntegration } from '../../components/MetaIntegration';
import { useAuth } from '../../context/AuthContext';
import { getGoogleAuthUrl } from '../../services/authService';
import { getGoogleAdAccounts, saveGoogleAdAccount, GoogleAdAccount } from '../../services/insightsService';

// --- SVG Icons (remain the same) ---
const GoogleLogoIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.19,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.19,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.19,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1Z" /></svg> );
const ArrowLeftIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg> );
const CheckCircleIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> );
const LoadingSpinner = () => ( <svg className="animate-spin h-5 w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);


export default function ConnectionsPage() {
    const { user, token, fetchAndUpdateUser } = useAuth();
    const searchParams = useSearchParams();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    const [adAccounts, setAdAccounts] = useState<GoogleAdAccount[]>([]);
    const [selectedAdAccount, setSelectedAdAccount] = useState<string>('');
    const [isFetchingAccounts, setIsFetchingAccounts] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const isGoogleConnected = !!user?.google_ad_account_id;

    const fetchAdAccounts = useCallback(async () => {
        if (!token) return;
        setIsFetchingAccounts(true);
        setError(null);
        try {
            const response = await getGoogleAdAccounts(token);
            setAdAccounts(response.accounts || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not fetch Google Ad accounts.");
        } finally {
            setIsFetchingAccounts(false);
        }
    }, [token]);

    useEffect(() => {
        const authStatus = searchParams.get('google_auth');
        if (authStatus === 'success' && !isGoogleConnected) {
            setSuccessMessage("Google account connected! Please select your Ad Account.");
            fetchAndUpdateUser().then(() => {
                fetchAdAccounts();
            });
        } else if (authStatus === 'error') {
            setError("Failed to connect Google account. Please try again.");
        }
    }, [searchParams, fetchAndUpdateUser, fetchAdAccounts, isGoogleConnected]);

    const handleGoogleConnect = async () => {
        if (!token) {
            setError("Authentication error. Please log in again.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await getGoogleAuthUrl(token);
            window.location.href = response.authorization_url;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not start Google connection process.");
            setIsLoading(false);
        }
    };
    
    const handleSaveAdAccount = async () => {
        if (!selectedAdAccount || !token) {
            setError("Please select an ad account to continue.");
            return;
        }
        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await saveGoogleAdAccount(token, selectedAdAccount);
            await fetchAndUpdateUser();
            setSuccessMessage("Google Ad Account saved successfully!");
            setAdAccounts([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save the selected Ad Account.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-slate-800 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
               
                <div className="mb-10 md:mb-12">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-50 tracking-tight">Connected Accounts</h1>
                    <p className="mt-3 text-md text-slate-300">Manage your third-party account integrations.</p>
                </div>

                <div className="space-y-6">
                    <MetaIntegration />

                    <div className="bg-slate-900 backdrop-blur-md shadow-xl rounded-2xl p-6 sm:p-8 border border-slate-400/50">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-100">Google Ads Integration</h3>
                            {isGoogleConnected && ( <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-900/50 px-2 py-1 rounded-full"><CheckCircleIcon className="w-4 h-4" /> Connected</span> )}
                        </div>
                        
                        {adAccounts.length > 0 && !isGoogleConnected && (
                            <div className="space-y-4 mb-6">
                                <p className="text-sm text-slate-900">Please select the Google Ads account you want to use with SocialAdify.</p>
                                <select
                                    value={selectedAdAccount}
                                    onChange={(e) => setSelectedAdAccount(e.target.value)}
                                    className="w-full p-2.5 bg-slate-800 border border-slate-800 rounded-lg shadow-sm"
                                >
                                    <option value="" disabled>-- Select an Account --</option>
                                    {adAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.id}) {acc.is_manager ? '[Manager]' : ''} {acc.is_test_account ? '[Test]' : ''}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleSaveAdAccount}
                                    disabled={isSaving || !selectedAdAccount}
                                    className="w-full flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg shadow-md bg-slate-700 hover:bg-indigo-500 text-white disabled:opacity-70"
                                >
                                    {isSaving ? 'Saving...' : 'Save and Continue'}
                                </button>
                            </div>
                        )}

                        {isFetchingAccounts && <p className="text-sm text-slate-400 mb-6 animate-pulse">Fetching your ad accounts...</p>}

                        {!isGoogleConnected && adAccounts.length === 0 && (
                             <button onClick={handleGoogleConnect} disabled={isLoading} className="w-full flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg shadow-md bg-white hover:bg-gray-200 text-gray-800 disabled:opacity-70">
                                {isLoading ? <LoadingSpinner /> : <GoogleLogoIcon className="w-5 h-5 mr-2" />}
                                {isLoading ? 'Redirecting...' : "Connect Google Account"}
                            </button>
                        )}
                        
                        {isGoogleConnected && (
                             <button onClick={handleGoogleConnect} disabled={isLoading} className="w-full flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg shadow-md bg-white hover:bg-gray-200 text-gray-800 disabled:opacity-70">
                                {isLoading ? <LoadingSpinner /> : <GoogleLogoIcon className="w-5 h-5 mr-2" />}
                                {isLoading ? 'Redirecting...' : "Reconnect with a different Account"}
                            </button>
                        )}
                        
                        {error && <p className="text-sm text-red-400 mt-4">{error}</p>}
                        {successMessage && <p className="text-sm text-green-400 mt-4">{successMessage}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
