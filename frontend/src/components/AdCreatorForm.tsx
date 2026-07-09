// D:\socialadify\frontend\src\components\AdCreatorForm.tsx

'use client';

import React, { useState, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image'; // Import Next.js Image component
import {
    createAdCreative,
    AdCreativePublic,
    AdCreativeFormPayload, 
} from '@/services/adCreatorService'; // Use correct alias path

// --- Icons ---
const PlusIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> );
const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.927a2.25 2.25 0 01-2.244-2.077L5.09 5.93c-.3-.058-.6-.117-.9-.176M4.5 5.25a2.25 2.25 0 012.25-2.25h1.5A2.25 2.25 0 0112 5.25m-3 0h3.75" /></svg> );
const LoadingSpinner = ({ className = "animate-spin h-5 w-5 text-white" }: {className?: string}) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
const ImageIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg> );

// --- Default States ---
const defaultAdCreative: AdCreativeFormPayload['ad_data'] = {
    campaign_name: '',
    ad_goal: 'TRAFFIC',
    platform: 'GOOGLE', // Defaulted to Google
    
    // --- ADDED: budget field ---
    budget: 1000, // Default budget, e.g., 1000 PKR
    // ---

    // Ad Details
    final_url: '',
    business_name: '',
    call_to_action_text: 'LEARN_MORE', // Default CTA
    headlines: [''], // At least 1
    long_headline: '', // At least 1
    descriptions: [''], // At least 1
};

interface AdCreatorFormProps {
    token: string | null;
    onDraftSaved: (newAd: AdCreativePublic) => void;
    onCancel: () => void;
    cardClass: string;
}

// Helper type for dynamic array field handlers
type ArrayFieldType = 'headlines' | 'descriptions';

export const AdCreatorForm: React.FC<AdCreatorFormProps> = ({
    token,
    onDraftSaved,
    onCancel,
    cardClass
}) => {
    const [formState, setFormState] = useState(defaultAdCreative);
    
    // --- State for two images ---
    const [imageFileSquare, setImageFileSquare] = useState<File | null>(null);
    const [imagePreviewSquare, setImagePreviewSquare] = useState<string | null>(null);
    const [imageFileLandscape, setImageFileLandscape] = useState<File | null>(null);
    const [imagePreviewLandscape, setImagePreviewLandscape] = useState<string | null>(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Form Styling Classes ---
    const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";
    const inputClass = "w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-slate-100 placeholder-slate-400 disabled:opacity-50";

    // --- Form Handlers ---
    const handleFormChange = (field: keyof typeof formState, value: any) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    // --- Generic handler for all array fields ---
    const handleArrayInputChange = (type: ArrayFieldType, index: number, value: string) => {
        // Handle headlines and descriptions
        const newArray = [...formState[type]];
        newArray[index] = value;
        handleFormChange(type, newArray);
    };
    
    const addArrayInput = (type: ArrayFieldType, limit: number) => {
        if (formState[type].length < limit) {
            handleFormChange(type, [...formState[type], '']);
        }
    };
    
    const removeArrayInput = (type: ArrayFieldType, index: number) => {
        if (formState[type].length > 1) {
            handleFormChange(type, formState[type].filter((_, i) => i !== index));
        }
    };

    // --- Helper: Check Aspect Ratio ---
    const checkAspectRatio = (file: File, targetRatio: number): Promise<boolean> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            const objectUrl = URL.createObjectURL(file);
            img.onload = () => {
                const ratio = img.width / img.height;
                URL.revokeObjectURL(objectUrl);
                // Allow small tolerance (e.g. 0.02)
                if (Math.abs(ratio - targetRatio) < 0.05) {
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
    
    // --- Two separate image handlers with Ratio Validation ---
    const handleImageChangeSquare = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check ratio for 1:1
            const isValid = await checkAspectRatio(file, 1.0);
            if (!isValid) {
                setError("Invalid Square Image. Please upload a perfect 1:1 ratio image (e.g., 1080x1080).");
                // Clear input
                e.target.value = "";
                setImageFileSquare(null);
                setImagePreviewSquare(null);
                return;
            }

            setImageFileSquare(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviewSquare(reader.result as string);
            };
            reader.readAsDataURL(file);
            setError(null);
        }
    };
    
    const handleImageChangeLandscape = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
             // Check ratio for 1.91:1
            const isValid = await checkAspectRatio(file, 1.91);
            if (!isValid) {
                setError("Invalid Landscape Image. Please upload a perfect 1.91:1 ratio image (e.g., 1200x628).");
                // Clear input
                e.target.value = "";
                setImageFileLandscape(null);
                setImagePreviewLandscape(null);
                return;
            }

            setImageFileLandscape(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviewLandscape(reader.result as string);
            };
            reader.readAsDataURL(file);
            setError(null);
        }
    };

    // --- Form Submission Handler ---
    const handleSaveDraft = async (event: FormEvent) => {
        event.preventDefault();
        if (!token) return;

        // --- Validate both images ---
        if (!imageFileSquare || !imageFileLandscape) {
            setError("Please select both a valid square (1:1) and landscape (1.91:1) image.");
            return;
        }

        // --- Validate URL Strict Format ---
        // Must start with https://www.
        const strictUrlPattern = /^https:\/\/www\..+/;
        if (!strictUrlPattern.test(formState.final_url)) {
            setError("Final URL must start with https://www. (e.g., https://www.example.com)");
            return;
        }

        // --- Validate Array Fields ---
        const validHeadlines = formState.headlines.filter(h => h.trim() !== '');
        const validDescriptions = formState.descriptions.filter(d => d.trim() !== '');

        if (validHeadlines.length === 0) {
            setError("Please provide at least one headline.");
            return;
        }
        if (validDescriptions.length === 0) {
             setError("Please provide at least one description.");
             return;
        }

        setIsSubmitting(true);
        setError(null);

        // Filter empty strings from arrays
        const ad_data: AdCreativeFormPayload['ad_data'] = {
            ...formState,
            // --- Ensure budget is a number ---
            budget: Number(formState.budget) || 0,
            headlines: validHeadlines,
            descriptions: validDescriptions,
        };

        try {
            // Use the updated service function
            const newAd = await createAdCreative(token, {
                ad_data,
                image_file_square: imageFileSquare,
                image_file_landscape: imageFileLandscape
            });
            onDraftSaved(newAd); // Pass the new ad up to the parent
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save draft.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSaveDraft} className={`${cardClass} max-w-3xl mx-auto`}>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-slate-100">Create New Ad Draft</h2>
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
                    <p className="text-sm text-red-300 font-semibold">{error}</p>
                </div>
            )}

            {/* --- Ad Details Section --- */}
            <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-200 border-b border-slate-700 pb-2">Campaign Details</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="campaign_name" className={labelClass}>Campaign Name*</label>
                        <input type="text" id="campaign_name" value={formState.campaign_name} onChange={e => handleFormChange('campaign_name', e.target.value)} className={inputClass} required />
                    </div>
                    <div>
                        <label htmlFor="ad_goal" className={labelClass}>Ad Goal*</label>
                        <select id="ad_goal" value={formState.ad_goal} onChange={e => handleFormChange('ad_goal', e.target.value)} className={inputClass}>
                            <option value="TRAFFIC">Website Traffic</option>
                            <option value="AWARENESS">Brand Awareness</option>
                            <option value="LEADS">Lead Generation</option>
                        </select>
                    </div>
                </div>

                {/* --- Changed to 2-col grid (Removed Platform Field) --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="business_name" className={labelClass}>Business Name*</label>
                        <input type="text" id="business_name" value={formState.business_name} onChange={e => handleFormChange('business_name', e.target.value)} className={inputClass} required placeholder="e.g., SocialAdify" />
                    </div>
                    {/* --- Budget Input Field --- */}
                    <div>
                        <label htmlFor="budget" className={labelClass}>Daily Budget (PKR)*</label>
                        <input 
                            type="number" 
                            id="budget" 
                            value={formState.budget} 
                            onChange={e => handleFormChange('budget', e.target.valueAsNumber)} 
                            className={inputClass} 
                            required 
                            placeholder="e.g., 1000"
                            min="100" 
                        />
                    </div>
                </div>
                
                <h3 className="text-xl font-semibold text-slate-200 border-b border-slate-700 pb-2 pt-4">Ad Creatives</h3>

                {/* --- Two Image Uploads --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Square Image */}
                    <div>
                        <label className={labelClass}>Square Image (1:1)*</label>
                        <div className="mt-2 flex items-center gap-4">
                            <div className="w-24 h-24 rounded-lg bg-slate-700/50 border border-slate-600 flex items-center justify-center overflow-hidden relative">
                                {imagePreviewSquare ? (
                                    <Image src={imagePreviewSquare} alt="Square preview" fill className="object-cover" />
                                ) : (
                                    <ImageIcon className="w-10 h-10 text-slate-500" />
                                )}
                            </div>
                            <label
                                htmlFor="image-upload-square"
                                className="relative cursor-pointer rounded-md bg-slate-700 px-3 py-2 text-sm font-semibold text-sky-400 shadow-sm hover:bg-slate-600 border border-slate-600"
                            >
                                <span>Change Image</span>
                                <input
                                    id="image-upload-square"
                                    type="file"
                                    className="sr-only"
                                    accept="image/png, image/jpeg"
                                    onChange={handleImageChangeSquare}
                                    required={!imageFileSquare} // Required if no file selected yet
                                />
                            </label>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5">Required: Perfect 1:1 ratio (e.g., 1080x1080).</p>
                    </div>
                    
                    {/* Landscape Image */}
                    <div>
                        <label className={labelClass}>Landscape Image (1.91:1)*</label>
                        <div className="mt-2 flex items-center gap-4">
                            <div className="w-24 h-24 rounded-lg bg-slate-700/50 border border-slate-600 flex items-center justify-center overflow-hidden relative">
                                {imagePreviewLandscape ? (
                                    <Image src={imagePreviewLandscape} alt="Landscape preview" fill className="object-cover" />
                                ) : (
                                    <ImageIcon className="w-10 h-10 text-slate-500" />
                                )}
                            </div>
                            <label
                                htmlFor="image-upload-landscape"
                                className="relative cursor-pointer rounded-md bg-slate-700 px-3 py-2 text-sm font-semibold text-sky-400 shadow-sm hover:bg-slate-600 border border-slate-600"
                            >
                                <span>Change Image</span>
                                <input
                                    id="image-upload-landscape"
                                    type="file"
                                    className="sr-only"
                                    accept="image/png, image/jpeg"
                                    onChange={handleImageChangeLandscape}
                                    required={!imageFileLandscape} // Required if no file selected yet
                                />
                            </label>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5">Required: Perfect 1.91:1 ratio (e.g., 1200x628).</p>
                    </div>
                </div>
                {/* --- End Image Uploads --- */}
                
                <div>
                    <label htmlFor="final_url" className={labelClass}>Final URL*</label>
                    {/* --- UPDATED: Added pattern and title for Strict URL validation --- */}
                    <input 
                        type="url" 
                        id="final_url" 
                        value={formState.final_url} 
                        onChange={e => handleFormChange('final_url', e.target.value)} 
                        className={inputClass} 
                        required 
                        placeholder="https://www.your-website.com" 
                        pattern="^https://www\..+"
                        title="URL must start with https://www."
                    />
                </div>

                {/* --- Headlines (Dynamic) --- */}
                <div>
                    <label className={labelClass}>Headlines (up to 5)*</label>
                    <div className="space-y-2">
                        {formState.headlines.map((headline, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input type="text" value={headline} onChange={e => handleArrayInputChange('headlines', index, e.target.value)} className={inputClass} placeholder={`Headline #${index + 1} (max 30 chars)`} required={index === 0} maxLength={30} />
                                <button type="button" onClick={() => removeArrayInput('headlines', index)} disabled={formState.headlines.length <= 1} className="p-2 text-red-400 hover:text-red-300 bg-slate-700 rounded-md disabled:opacity-50">
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={() => addArrayInput('headlines', 5)} disabled={formState.headlines.length >= 5} className="mt-2 text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1.5 disabled:opacity-50">
                        <PlusIcon /> Add headline
                    </button>
                </div>

                {/* --- Long Headline --- */}
                <div>
                    <label htmlFor="long_headline" className={labelClass}>Long Headline*</label>
                    <input type="text" id="long_headline" value={formState.long_headline} onChange={e => handleFormChange('long_headline', e.target.value)} className={inputClass} required placeholder="Your longer headline (max 90 chars)" maxLength={90} />
                </div>

                {/* --- Descriptions (Dynamic) --- */}
                <div>
                    <label className={labelClass}>Descriptions (up to 5)*</label>
                    <div className="space-y-2">
                        {formState.descriptions.map((desc, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input type="text" value={desc} onChange={e => handleArrayInputChange('descriptions', index, e.target.value)} className={inputClass} placeholder={`Description #${index + 1} (max 90 chars)`} required={index === 0} maxLength={90} />
                                <button type="button" onClick={() => removeArrayInput('descriptions', index)} disabled={formState.descriptions.length <= 1} className="p-2 text-red-400 hover:text-red-300 bg-slate-700 rounded-md disabled:opacity-50">
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={() => addArrayInput('descriptions', 5)} disabled={formState.descriptions.length >= 5} className="mt-2 text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1.5 disabled:opacity-50">
                        <PlusIcon /> Add description
                    </button>
                </div>

                <div>
                    <label htmlFor="call_to_action_text" className={labelClass}>Call to Action*</label>
                    <select id="call_to_action_text" value={formState.call_to_action_text} onChange={e => handleFormChange('call_to_action_text', e.target.value)} className={inputClass}>
                        <option value="LEARN_MORE">Learn More</option>
                        <option value="SHOP_NOW">Shop Now</option>
                        <option value="SIGN_UP">Sign Up</option>
                        <option value="CONTACT_US">Contact Us</option>
                        <option value="BOOK_NOW">Book Now</option>
                        <option value="DOWNLOAD">Download</option>
                        <option value="GET_QUOTE">Get Quote</option>
                    </select>
                </div>

                {/* --- Submission --- */}
                <div className="pt-4">
                    <button type="submit" disabled={isSubmitting || !imageFileSquare || !imageFileLandscape} className="w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition duration-150 ease-in-out bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50">
                        {isSubmitting ? <LoadingSpinner /> : 'Save Ad Draft'}
                    </button>
                    {(!imageFileSquare || !imageFileLandscape) && !isSubmitting && <p className="text-xs text-center text-yellow-400 mt-2">Please select both a square and landscape image to save.</p>}
                </div>
            </div>
        </form>
    );
};