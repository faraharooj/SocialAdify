// D:/socialadify/frontend/src/components/MetaIntegration.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { getMetaAuthUrl, getMetaPages, saveLinkedMetaAccount, disconnectMetaAccount, MetaAccount } from '../services/metaService';

// --- (SVG Icon Components are unchanged) ---
const FacebookIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33V21.878A10.003 10.003 0 0022 12z" /></svg> );
const CheckCircleIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> );
const LoadingSpinner = () => ( <svg className="animate-spin h-5 w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);

export function MetaIntegration() {
    const { user, token, fetchAndUpdateUser } = useAuth();
    const searchParams = useSearchParams();

    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingAccounts, setIsFetchingAccounts] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [accounts, setAccounts] = useState<MetaAccount[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');

    // --- DEBUGGER LINE ---
    console.log("MetaIntegration component is using this user object:", user);

    // --- THE FIX: Check the correct 'linked_' property ---
    const isMetaConnected = !!user?.linked_page_id;

    const fetchAccounts = useCallback(async () => {
        if (!token) return;
        setIsFetchingAccounts(true);
        setError(null);
        try {
            const response = await getMetaPages(token);
            setAccounts(response.accounts || []);
            if (response.accounts.length > 0) {
                setSuccessMessage("Connection successful! Please select an account to link.");
            } else {
                setError("No Facebook Pages found. Please ensure your account manages at least one page.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not fetch your Meta accounts.");
        } finally {
            setIsFetchingAccounts(false);
        }
    }, [token]);

    useEffect(() => {
        const authStatus = searchParams.get('meta_auth');
        if (authStatus === 'success' && !isMetaConnected) {
            fetchAccounts();
        } else if (authStatus === 'error') {
            const detail = searchParams.get('detail') || "An unknown error occurred.";
            setError(`Failed to connect Meta account: ${detail.replace(/_/g, ' ')}`);
        }
    }, [searchParams, isMetaConnected, fetchAccounts]);
    
    const handleConnectClick = async () => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await getMetaAuthUrl(token);
            window.location.href = response.authorization_url;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not start the Meta connection process.");
            setIsLoading(false);
        }
    };

    const handleSaveAccount = async () => {
        if (!selectedAccountId || !token) return;
        const selectedAccount = accounts.find(acc => acc.page_id === selectedAccountId);
        if (!selectedAccount) return;

        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await saveLinkedMetaAccount(token, selectedAccount);
            await fetchAndUpdateUser();
            setSuccessMessage("Meta account linked successfully!");
            setAccounts([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save the selected account.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDisconnect = async () => {
        if (!token) return;
        setIsDisconnecting(true);
        try {
            await disconnectMetaAccount(token);
            await fetchAndUpdateUser();
            setSuccessMessage("Meta account disconnected successfully.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to disconnect account.");
        } finally {
            setIsDisconnecting(false);
        }
     };

    // --- UI Rendering Logic ---
    const renderContent = () => {
        if (isMetaConnected) {
            return (
                <div>
                    {/* --- THE FIX: Display the correct 'linked_' properties --- */}
                    <p className="text-sm text-slate-300 mb-4">
                        Connected to Page: <span className="font-semibold text-white">{user.linked_page_name}</span>
                        {user.linked_instagram_username && (
                            <> & Instagram: <span className="font-semibold text-white">@{user.linked_instagram_username}</span></>
                        )}
                    </p>
                    <button onClick={handleDisconnect} disabled={isDisconnecting} className="w-full px-5 py-2.5 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg disabled:opacity-70">
                        {isDisconnecting ? 'Disconnecting...' : 'Disconnect Meta Account'}
                    </button>
                </div>
            );
        }
        if (isFetchingAccounts) {
            return <p className="text-sm text-slate-400 animate-pulse">Fetching your accounts from Meta...</p>;
        }
        if (accounts.length > 0) {
            return (
                <div className="space-y-4">
                    <p className="text-sm text-slate-300">Select the Facebook Page to manage. We'll link the Instagram Business account if it's connected.</p>
                    <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} className="w-full p-2.5 bg-slate-700/50 border border-slate-600 rounded-lg shadow-sm text-white">
                        <option value="" disabled>-- Select an Account --</option>
                        {accounts.map(acc => (
                            <option key={acc.page_id} value={acc.page_id}>
                                {acc.page_name}{acc.instagram_username ? ` (@${acc.instagram_username})` : ''}
                            </option>
                        ))}
                    </select>
                    <button onClick={handleSaveAccount} disabled={isSaving || !selectedAccountId} className="w-full flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg shadow-md bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-70">
                        {isSaving ? 'Linking Account...' : 'Link Selected Account'}
                    </button>
                </div>
            );
        }
        return (
            <button onClick={handleConnectClick} disabled={isLoading} className="w-full flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg shadow-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-70">
                {isLoading ? <LoadingSpinner /> : <FacebookIcon className="w-5 h-5 mr-2" />}
                {isLoading ? 'Redirecting...' : 'Connect Facebook Account'}
            </button>
        );
    };

    return (
        <div className="bg-slate-900 backdrop-blur-md shadow-xl rounded-2xl p-6 sm:p-8 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-100">Meta (Facebook & Instagram)</h3>
                {isMetaConnected && <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-900/50 px-2 py-1 rounded-full"><CheckCircleIcon className="w-4 h-4" /> Connected</span>}
            </div>
            {renderContent()}
            {error && <p className="text-sm text-red-400 mt-4">{error}</p>}
            {successMessage && !isMetaConnected && <p className="text-sm text-green-400 mt-4">{successMessage}</p>}
        </div>
    );
}

