'use client';

import React, { useState, FormEvent, ChangeEvent } from 'react';
import {
    getAIPlatformSuggestion,
    AIPlatformSuggestionRequest
} from '../services/adCreatorService'; // <-- FIX: Changed to relative path

// --- Icons ---
const WandIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L17 13.75M17 13.75L15.75 12M17 13.75L18.25 15M15.75 12L17 10.25" /></svg> );
const LoadingSpinner = ({ className = "animate-spin h-5 w-5 text-white" }: {className?: string}) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
const GoogleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="m24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path></svg>);
const MetaIcon = ({ className = "w-5 h-5" }: { className?: string }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22.002 10.119c-.066-1.57-.37-2.923-.834-4.052a5.42 5.42 0 0 0-1.87-2.344C18.25.922 17.006.46 15.65.21a19.43 19.43 0 0 0-7.298 0c-1.357.25-2.602.712-3.65 1.513a5.42 5.42 0 0 0-1.87 2.344c-.464 1.13-.768 2.482-.834 4.052a19.53 19.53 0 0 0 0 3.764c.066 1.57.37 2.923.834 4.051a5.42 5.42 0 0 0 1.87 2.345c1.048.8 2.293 1.263 3.65 1.513a19.43 19.43 0 0 0 7.298 0c1.357-.25 2.602-.713 3.65-1.513a5.42 5.42 0 0 0 1.87-2.345c.464-1.128.768-2.481.834-4.051a19.53 19.53 0 0 0 0-3.764Zm-10.02 7.02c-3.15 0-5.703-2.62-5.703-5.86s2.554-5.86 5.704-5.86c3.149 0 5.703 2.62 5.703 5.86s-2.554 5.86-5.704 5.86Z"></path></svg>);

// --- Default State ---
const defaultFormData: AIPlatformSuggestionRequest = {
    product_description: '',
    ad_goal: 'TRAFFIC',
    audience_description: '',
};

interface AIPlatformSuggestorProps {
    token: string | null;
    onPlatformSelected: (platform: 'google' | 'meta') => void;
    onCancel: () => void;
    cardClass: string;
}

export const AIPlatformSuggestor: React.FC<AIPlatformSuggestorProps> = ({
    token,
    onPlatformSelected,
    onCancel,
    cardClass
}) => {
    const [formData, setFormData] = useState(defaultFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestion, setSuggestion] = useState<{ platform: string; reasoning: string } | null>(null);

    // --- Form Styling Classes ---
    const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";
    const inputClass = "w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-slate-100 placeholder-slate-400 disabled:opacity-50";

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData((prev: AIPlatformSuggestionRequest) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // --- AI Suggestion Handler ---
    const handleGetSuggestion = async (event: FormEvent) => {
        event.preventDefault();
        if (!token) {
            setError("Authentication session is invalid. Please log in again.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuggestion(null);

        try {
            const result = await getAIPlatformSuggestion(token, formData);
            setSuggestion({ platform: result.recommended_platform, reasoning: result.recommendation });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to get AI suggestion.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`${cardClass} max-w-3xl mx-auto`}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-100">AI Platform Suggestor</h2>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-sm text-slate-400 hover:text-slate-200"
                >
                    &larr; Back to Dashboard
                </button>
            </div>

            <p className="text-slate-400 mb-6">
                Not sure where to start? Describe your ad and let our AI recommend the best platform for your goal.
            </p>

            {error && (
                <div className="mb-4 p-3 text-center bg-red-900/50 border border-red-700 rounded-lg">
                    <p className="text-sm text-red-300">{error}</p>
                </div>
            )}

            {/* --- AI Suggestion Form --- */}
            <form onSubmit={handleGetSuggestion} className="space-y-6">
                <div>
                    <label htmlFor="product_description" className={labelClass}>Product / Service Description*</label>
                    <textarea
                        id="product_description"
                        name="product_description"
                        rows={3}
                        value={formData.product_description}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="e.g., High-fidelity wireless headphones for gamers"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="audience_description" className={labelClass}>Target Audience*</label>
                    <textarea
                        id="audience_description"
                        name="audience_description"
                        rows={2}
                        value={formData.audience_description}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="e.g., Gamers and tech enthusiasts in Pakistan"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="ad_goal" className={labelClass}>Primary Ad Goal*</label>
                    <select 
                        id="ad_goal"
                        name="ad_goal"
                        value={formData.ad_goal}
                        onChange={handleChange} 
                        className={inputClass}
                    >
                        <option value="TRAFFIC">Website Traffic</option>
                        <option value="AWARENESS">Brand Awareness</option>
                        <option value="LEADS">Lead Generation</option>
                    </select>
                </div>

                <div className="pt-2">
                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition duration-150 ease-in-out bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                    >
                        {isLoading ? <LoadingSpinner /> : <WandIcon />}
                        {isLoading ? 'Analyzing...' : 'Get AI Suggestion'}
                    </button>
                </div>
            </form>

            {/* --- Suggestion Result --- */}
            {suggestion && (
                <div className="mt-8 pt-6 border-t border-slate-700">
                    <h3 className="text-2xl font-bold text-center text-slate-100 mb-4">
                        AI Recommendation: 
                        <span className={`ml-2 ${suggestion.platform === 'GOOGLE' ? 'text-sky-400' : 'text-blue-500'}`}>
                            {suggestion.platform === 'GOOGLE' ? 'Google Ads' : 'Meta Ads'}
                        </span>
                    </h3>
                    <p className="text-slate-300 text-center bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        {suggestion.reasoning}
                    </p>
                </div>
            )}
            
            {/* --- UPDATED: Platform selection buttons are now always visible --- */}
            <div className="mt-8 pt-6 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-center text-slate-400 mb-4">
                    Or, choose your platform directly:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={() => onPlatformSelected('google')}
                        type="button"
                        className={`flex items-center justify-center gap-3 px-6 py-3 text-base font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out
                                    ${(suggestion && suggestion.platform === 'GOOGLE') 
                                        ? 'bg-sky-500 hover:bg-sky-400 text-white ring-2 ring-sky-300' 
                                        : 'bg-slate-700 hover:bg-slate-600 text-slate-100'}`}
                    >
                        <GoogleIcon /> Continue with Google
                    </button>
                    <button
                        onClick={() => onPlatformSelected('meta')}
                        type="button"
                        className={`flex items-center justify-center gap-3 px-6 py-3 text-base font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out
                                    ${(suggestion && suggestion.platform === 'META') 
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white ring-2 ring-blue-400' 
                                        : 'bg-slate-700 hover:bg-slate-600 text-slate-100'}`}
                    >
                        <MetaIcon /> Continue with Meta
                    </button>
                </div>
            </div>
        </div>
    );
};