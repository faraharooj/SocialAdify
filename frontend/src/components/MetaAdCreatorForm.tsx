// D:\socialadify\frontend\src\components\MetaAdCreatorForm.tsx
'use client';

import React, { useState, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import {
    createMetaAdDraft,
    MetaAdCreativePublic,
    MetaAdCreativeFormPayload,
    MetaAdCreativePayload
} from '@/services/adCreatorService'; // <-- FIX: Changed to relative path
// --- IMPORT 1: Import Modal and Type ---
import ImportFromHistoryModal from './ImportFromHistoryModal';
import { HistoryItem } from '../services/historyService';

// --- Icons ---
const LoadingSpinner = ({ className = "animate-spin h-5 w-5 text-white" }: {className?: string}) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
const ImageIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg> );
// --- IMPORT 2: Import Icon ---
const ImportIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> );

// --- Default State ---
const defaultAdCreative: MetaAdCreativePayload = {
    campaign_name: '',
    ad_goal: 'OUTCOME_TRAFFIC', // Default Meta Objective
    platform: 'META',
    
    // --- ADDED: budget field ---
    budget: 1000, // Default budget, e.g., 1000 PKR
    // ---
    
    primary_text: '',
    headline: '',
    website_url: '',
    call_to_action: 'LEARN_MORE', // Default Meta CTA
};

interface MetaAdCreatorFormProps {
    token: string | null;
    onDraftSaved: (newAd: MetaAdCreativePublic) => void;
    onCancel: () => void;
    cardClass: string;
}

export const MetaAdCreatorForm: React.FC<MetaAdCreatorFormProps> = ({
    token,
    onDraftSaved,
    onCancel,
    cardClass
}) => {
    const [formState, setFormState] = useState(defaultAdCreative);
    
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- STATE 1: Modal State ---
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // --- Form Styling Classes ---
    const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";
    const inputClass = "w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-slate-100 placeholder-slate-400 disabled:opacity-50";

    // --- MODIFIED: Form Handler to correctly parse numbers ---
    const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // Check input type to correctly handle numbers
        const type = (e.target as HTMLInputElement).type;
        
        setFormState(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? parseFloat(value) || 0 : value 
        }));
    };
    // ---

    // --- HANDLER 1: History Import Logic ---
    const handleHistoryImport = (item: HistoryItem) => {
        if (item.caption) {
            setFormState(prev => ({
                ...prev,
                primary_text: item.caption
            }));
        }
    };

    // --- Helper: Check Aspect Ratio ---
    const checkAspectRatio = (file: File): Promise<boolean> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            const objectUrl = URL.createObjectURL(file);
            img.onload = () => {
                const ratio = img.width / img.height;
                URL.revokeObjectURL(objectUrl);
                // Meta Square (1:1) or Landscape (1.91:1) tolerance
                // Let's be strict about it being roughly one of these two common formats
                // 1.0 +/- 0.05 OR 1.91 +/- 0.05
                if (Math.abs(ratio - 1.0) < 0.05 || Math.abs(ratio - 1.91) < 0.05) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                resolve(false);
            };
            img.src = objectUrl;
        });
    };

    const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // --- Check Aspect Ratio ---
            const isValid = await checkAspectRatio(file);
            if (!isValid) {
                setError("Invalid Image Ratio. Please upload an image with either 1:1 (Square) or 1.91:1 (Landscape) aspect ratio.");
                // Clear the input
                e.target.value = "";
                setImageFile(null);
                setImagePreview(null);
                return;
            }

            // ... (add size/type validation if needed) ...
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setError(null);
        }
    };

    // --- Form Submission Handler ---
    const handleSaveDraft = async (event: FormEvent) => {
        event.preventDefault();
        if (!token) return;

        if (!imageFile) {
            setError("Please select an image for the ad.");
            return;
        }
        
        // --- Validate URL Strict Format ---
        const strictUrlPattern = /^https:\/\/www\..+/;
        if (!strictUrlPattern.test(formState.website_url)) {
            setError("Website URL must start with https://www. (e.g., https://www.example.com)");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        // --- MODIFIED: Ensure budget is a number ---
        // (Handled by handleFormChange, but good to double-check)
        const adDataWithNumericBudget = {
            ...formState,
            budget: Number(formState.budget) || 0
        };
        // ---

        const payload: MetaAdCreativeFormPayload = {
            ad_data: adDataWithNumericBudget, // <-- Use the corrected data
            image_file: imageFile
        };

        try {
            const newAd = await createMetaAdDraft(token, payload);
            onDraftSaved(newAd); // Pass the new ad up to the parent
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save Meta draft.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`${cardClass} max-w-3xl mx-auto`}>
            <form onSubmit={handleSaveDraft}>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-100">Create New Meta Ad</h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-sm text-slate-400 hover:text-slate-200"
                    >
                        &larr; Back to Dashboard
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 text-center bg-red-900/50 border border-red-700 rounded-lg">
                        <p className="text-sm text-red-300">{error}</p>
                    </div>
                )}

                {/* --- Ad Details Section --- */}
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-slate-200 border-b border-slate-700 pb-2">Campaign Details</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="campaign_name" className={labelClass}>Campaign Name*</label>
                            <input type="text" id="campaign_name" name="campaign_name" value={formState.campaign_name} onChange={handleFormChange} className={inputClass} required />
                        </div>
                        <div>
                            <label htmlFor="ad_goal" className={labelClass}>Ad Goal*</label>
                            <select id="ad_goal" name="ad_goal" value={formState.ad_goal} onChange={handleFormChange} className={inputClass}>
                                <option value="OUTCOME_TRAFFIC">Website Traffic (Traffic)</option>
                                <option value="OUTCOME_AWARENESS">Brand Awareness (Awareness)</option>
                                <option value="OUTCOME_LEADS">Lead Generation (Leads)</option>
                                <option value="OUTCOME_SALES">Sales (Conversions)</option>
                                <option value="OUTCOME_ENGAGEMENT">Engagement</option>
                            </select>
                        </div>
                    </div>

                    {/* --- ADDED: Budget Input Field --- */}
                    <div>
                        <label htmlFor="budget" className={labelClass}>Daily Budget (PKR)*</label>
                        <input 
                            type="number" 
                            id="budget" 
                            name="budget" // <-- 'name' must match the state key
                            value={formState.budget} 
                            onChange={handleFormChange} 
                            className={inputClass} 
                            required 
                            placeholder="e.g., 1000"
                            min="100" 
                        />
                    </div>
                    {/* --- END: Budget Input Field --- */}

                    <h3 className="text-xl font-semibold text-slate-200 border-b border-slate-700 pb-2 pt-4">Ad Creative</h3>

                    {/* --- Single Image Upload (like scheduler) --- */}
                    <div>
                        <label className={labelClass}>Ad Image*</label>
                        <div className="mt-2 flex items-center gap-4">
                            <div className="w-24 h-24 rounded-lg bg-slate-700/50 border border-slate-600 flex items-center justify-center overflow-hidden">
                                {imagePreview ? (
                                    <Image src={imagePreview} alt="Ad preview" width={96} height={96} className="object-cover w-full h-full" />
                                ) : (
                                    <ImageIcon className="w-10 h-10 text-slate-500" />
                                )}
                            </div>
                            <label
                                htmlFor="image-upload-meta"
                                className="relative cursor-pointer rounded-md bg-slate-700 px-3 py-2 text-sm font-semibold text-blue-400 shadow-sm hover:bg-slate-600 border border-slate-600"
                            >
                                <span>Change Image</span>
                                <input
                                    id="image-upload-meta"
                                    type="file"
                                    className="sr-only"
                                    accept="image/png, image/jpeg"
                                    onChange={handleImageChange}
                                    required={!imageFile} // Required if not selected
                                />
                            </label>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5">PNG or JPG. Required: 1:1 (Square) or 1.91:1 (Landscape).</p>
                    </div>
                    
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label htmlFor="primary_text" className={`${labelClass} mb-0`}>Primary Text* (The main caption)</label>
                            {/* --- BUTTON 1: Import Button --- */}
                            <button 
                                type="button" 
                                onClick={() => setIsImportModalOpen(true)} 
                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                            >
                                <ImportIcon className="w-3.5 h-3.5"/> Import from History
                            </button>
                        </div>
                        <textarea id="primary_text" name="primary_text" value={formState.primary_text} onChange={handleFormChange} className={inputClass} rows={4} required placeholder="e.g., Check out our new collection! 50% off..."></textarea>
                    </div>

                    <div>
                        <label htmlFor="headline" className={labelClass}>Headline*</label>
                        <input type="text" id="headline" name="headline" value={formState.headline} onChange={handleFormChange} className={inputClass} required placeholder="e.g., Limited Time Offer" maxLength={40} />
                    </div>

                    <div>
                        <label htmlFor="website_url" className={labelClass}>Website URL*</label>
                        {/* --- UPDATED: Added pattern validation --- */}
                        <input 
                            type="url" 
                            id="website_url" 
                            name="website_url" 
                            value={formState.website_url} 
                            onChange={handleFormChange} 
                            className={inputClass} 
                            required 
                            placeholder="https://www.your-website.com" 
                            pattern="^https://www\..+"
                            title="URL must start with https://www."
                        />
                    </div>

                    <div>
                        <label htmlFor="call_to_action" className={labelClass}>Call to Action*</label>
                        <select id="call_to_action" name="call_to_action" value={formState.call_to_action} onChange={handleFormChange} className={inputClass}>
                            <option value="LEARN_MORE">Learn More</option>
                            <option value="SHOP_NOW">Shop Now</option>
                            <option value="SIGN_UP">Sign Up</option>
                            <option value="CONTACT_US">Contact Us</option>
                            <option value="BOOK_NOW">Book Now</option>
                            <option value="DOWNLOAD">Download</option>
                            <option value="GET_OFFER">Get Offer</option>
                        </select>
                    </div>

                    {/* --- Submission --- */}
                    <div className="pt-4">
                        <button type="submit" disabled={isSubmitting || !imageFile} className="w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition duration-150 ease-in-out bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50">
                            {isSubmitting ? <LoadingSpinner /> : 'Save Meta Draft'}
                        </button>
                        {!imageFile && !isSubmitting && <p className="text-xs text-center text-yellow-400 mt-2">Please select an image to save the draft.</p>}
                    </div>
                </div>
            </form>

            {/* --- COMPONENT 1: The Modal --- */}
            <ImportFromHistoryModal 
                isOpen={isImportModalOpen} 
                onClose={() => setIsImportModalOpen(false)} 
                onSelect={handleHistoryImport} 
            />
        </div>
    );
};