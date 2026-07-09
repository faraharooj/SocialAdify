// D:\socialadify\frontend\src\app\caption-generator\page.tsx
'use client';

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link'; // --- FIX: Added missing import for Link ---
import { useAuth } from '@/context/AuthContext';
import { useImageContext } from '@/context/ImageContext';
import { saveCaptionToDB, CaptionSaveData } from '@/services/captionService'; 

// --- Icon Components ---
const UploadIcon = ({ className = "w-10 h-10 text-slate-500 group-hover:text-indigo-400 transition-colors" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg> );
const SaveToDBIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg> );
const CopyIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg> );
const LoadingSpinner = ({ className = "animate-spin h-5 w-5 text-white" }: {className?: string}) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
const CookingPotLoader = ({ className = "w-12 h-12 text-slate-400" }: { className?: string }) => ( <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 10H5C3.89543 10 3 10.8954 3 12V17C3 18.6569 4.34315 20 6 20H18C19.6569 20 21 18.6569 21 17V12C21 10.8954 20.1046 10 19 10Z" stroke="currentColor" strokeWidth="1.5"/><path d="M7 10V8C7 6.89543 7.89543 6 9 6H15C16.1046 6 17 6.89543 17 8V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M7 5C7 4.44772 7.44772 4 8 4C8.55228 4 9 4.44772 9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><animate attributeName="d" values="M9 5 C9 4 8 3 7 4; M9 5 C9 3 8 2 7 3; M9 5 C9 4 8 3 7 4" dur="1.5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" /></path><path d="M12 5C12 4.44772 12.4477 4 13 4C13.5523 4 14 4.44772 14 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><animate attributeName="d" values="M14 5 C14 4 13 3 12 4; M14 5 C14 3 13 2 12 3; M14 5 C14 4 13 3 12 4" dur="1.5s" begin="0.2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0.2s" repeatCount="indefinite" /></path><path d="M17 5C17 4.44772 17.4477 4 18 4C18.5523 4 19 4.44772 19 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><animate attributeName="d" values="M19 5 C19 4 18 3 17 4; M19 5 C19 3 18 2 17 3; M19 5 C19 4 18 3 17 4" dur="1.5s" begin="0.4s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0.4s" repeatCount="indefinite" /></path></svg> );

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

const toneOptions = ["Professional", "Casual", "Witty", "Luxury", "Informative", "Storytelling", "Friendly", "Humorous", "Serious", "Inspirational"];
const categoryOptions = ["Product Launch", "Sale/Promotion", "Brand Story", "Event Announcement", "Educational Content", "Question/Poll", "Tip/Tutorial", "New Feature", "Company Update", "Testimonial"];

interface CaptionItem {
    id: string; 
    text: string;
    isSaving?: boolean; 
    isSaved?: boolean;   
    dbId?: string;       
}

export default function CaptionGeneratorPage() {
    const { isAuthReady, isAuthenticated, token, logout } = useAuth(); 
    const { sharedImage, setSharedImage } = useImageContext();

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [postCategory, setPostCategory] = useState<string>('Product Launch');
    const [tone, setTone] = useState<string>('Professional');
    const [includeHashtags, setIncludeHashtags] = useState<boolean>(true);
    const [includeEmojis, setIncludeEmojis] = useState<boolean>(true);

    const [generatedCaptions, setGeneratedCaptions] = useState<CaptionItem[]>([]); 
    
    const [isLoading, setIsLoading] = useState(false); 
    const [error, setError] = useState<string | null>(null);
    const [copySuccessId, setCopySuccessId] = useState<string | null>(null);

    useEffect(() => {
        if (sharedImage) {
            console.log("CaptionGenerator: Found an image in context, loading it now.");
            setImageFile(sharedImage);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(sharedImage);
            setSharedImage(null);
        }
    }, [sharedImage, setSharedImage]);
    
    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setError(null); 
        if (file) {
            if (file.size > 10 * 1024 * 1024) { 
                setError("Image size should not exceed 5MB.");
                setImageFile(null); setImagePreviewUrl(null);
                return;
            }
            if (!file.type.startsWith("image/")) {
                setError("Invalid file type. Please upload an image.");
                setImageFile(null); setImagePreviewUrl(null);
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => { setImagePreviewUrl(reader.result as string); };
            reader.readAsDataURL(file);
        } else {
            setImageFile(null); setImagePreviewUrl(null);
        }
    };

    const handleGenerateCaptions = async (event: FormEvent) => {
        event.preventDefault();
        if (!token) {
            setError("Authentication required. Please log in.");
            return;
        }
        setIsLoading(true); setError(null); setGeneratedCaptions([]);

        const formData = new FormData();
        if (imageFile) formData.append('image_file', imageFile);
        formData.append('category', postCategory);
        formData.append('tone', tone);
        formData.append('include_hashtags', String(includeHashtags));
        formData.append('include_emojis', String(includeEmojis));

        try {
            const response = await fetch(`${API_BASE_URL}/captions/generate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: `Server error: ${response.status}` }));
                throw new Error(errorData.detail || `Failed to generate captions.`);
            }

            const result = await response.json();
            const captionsFromApi: string[] = result.captions || [];

            setGeneratedCaptions(
                captionsFromApi.map((text, index) => ({
                    id: `caption-${Date.now()}-${index}`, 
                    text: text,
                }))
            );
        } catch (err: unknown) {
            console.error("Caption generation error:", err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred.");
            setGeneratedCaptions([]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccessId(id);
            setTimeout(() => setCopySuccessId(null), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            setError('Failed to copy caption.');
        });
    };

    const handleSaveCaptionToDB = async (captionItem: CaptionItem) => {
        if (!token) {
            setError("Authentication required to save captions.");
            logout(); 
            return;
        }
        setGeneratedCaptions(prev => prev.map(c => c.id === captionItem.id ? { ...c, isSaving: true } : c));
        setError(null);

        // --- FIX: Added the missing 'is_edited' property ---
        const saveData: CaptionSaveData = { 
            caption_text: captionItem.text,
            is_edited: false 
        };

        try {
            const savedCaption = await saveCaptionToDB(token, saveData);
            setGeneratedCaptions(prev => prev.map(c => c.id === captionItem.id ? { ...c, isSaving: false, isSaved: true, dbId: savedCaption.id } : c));
        } catch (err) {
            console.error("Failed to save caption:", err);
            setError(err instanceof Error ? err.message : "Could not save caption.");
            setGeneratedCaptions(prev => prev.map(c => c.id === captionItem.id ? { ...c, isSaving: false } : c));
        }
    };

    const inputBaseClass = "w-full px-4 py-2.5 text-sm border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 outline-none transition bg-slate-700/50 text-slate-100 placeholder-slate-400";
    const labelBaseClass = "block text-sm font-medium text-slate-300 mb-2";
    const cardBaseClass = "bg-slate-900 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-800";
    
    if (!isAuthReady) {
        return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner/></div>;
    }
    if (!isAuthenticated && isAuthReady) {
        return <div className="text-center py-20"><p className="text-slate-400">Please <Link href="/login" className="text-indigo-400 hover:underline">log in</Link> to use the Caption Generator.</p></div>;
    }

    return (
        <div>
            <header className="text-center mb-12"> 
                <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-pink-300 pb-2">
                    AI Caption Generator
                </h1>
                <p className="mt-3 text-md text-slate-400 max-w-2xl mx-auto">
                    Craft compelling social media captions in seconds. Upload an image, set your preferences, and let AI do the magic!
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                {/* Left Column: Inputs */}
                <div className={`${cardBaseClass} space-y-6 sticky top-28`}>
                    <h2 className="text-2xl font-bold text-slate-100 text-center">Create Your Caption</h2>
                    <form onSubmit={handleGenerateCaptions} className="space-y-6">
                        {/* Image Upload */}
                        <div>
                            <label htmlFor="imageUpload" className={labelBaseClass}>1. Upload Image </label>
                            <label htmlFor="imageUpload" className="mt-1 flex flex-col items-center justify-center w-full h-48 px-6 pt-5 pb-6 border-2 border-slate-600/80 border-dashed rounded-xl group hover:border-indigo-500 transition-colors bg-slate-700/30 cursor-pointer">
                                {imagePreviewUrl ? (
                                    <div className="relative w-full h-full max-h-40">
                                        <Image src={imagePreviewUrl} alt="Selected preview" layout="fill" objectFit="contain" className="rounded-md" />
                                    </div>
                                ) : (
                                    <div className="space-y-2 text-center">
                                        <UploadIcon />
                                        <p className="text-xs text-slate-400">Click to upload </p>
                                        <p className="text-xs text-slate-500">PNG, JPG, WEBP</p>
                                    </div>
                                )}
                            </label>
                            <input id="imageUpload" name="imageUpload" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg, image/gif, image/webp" />
                        </div>
                        
                        {/* Preferences */}
                        <div>
                            <label className={labelBaseClass}>2. Set Preferences</label>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <select id="postCategory" value={postCategory} onChange={(e) => setPostCategory(e.target.value)} className={inputBaseClass}>
                                        <option value="" disabled>Select Category...</option>
                                        {categoryOptions.map(opt => <option key={opt} value={opt} className="bg-slate-800">{opt}</option>)}
                                    </select>
                                    <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)} className={inputBaseClass}>
                                        <option value="" disabled>Select Tone...</option>
                                        {toneOptions.map(opt => <option key={opt} value={opt} className="bg-slate-800">{opt}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center space-x-6 pt-2">
                                    <div className="relative flex items-start">
                                        <div className="flex h-5 items-center"><input id="includeHashtags" type="checkbox" checked={includeHashtags} onChange={(e) => setIncludeHashtags(e.target.checked)} className="h-4 w-4 rounded border-slate-500 text-indigo-500 focus:ring-indigo-400 bg-slate-600" /></div>
                                        <div className="ml-3 text-sm"><label htmlFor="includeHashtags" className="font-medium text-slate-200">Include #Hashtags</label></div>
                                    </div>
                                    <div className="relative flex items-start">
                                        <div className="flex h-5 items-center"><input id="includeEmojis" type="checkbox" checked={includeEmojis} onChange={(e) => setIncludeEmojis(e.target.checked)} className="h-4 w-4 rounded border-slate-500 text-indigo-500 focus:ring-indigo-400 bg-slate-600" /></div>
                                        <div className="ml-3 text-sm"><label htmlFor="includeEmojis" className="font-medium text-slate-200">Include Emojis 😄</label></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-400 text-center p-3 bg-red-900/30 rounded-lg border border-red-700/50">{error}</p>}
                        
                        {/* Submit Button */}
                        <div className="pt-2">
                            <button type="submit" disabled={isLoading || !isAuthenticated} className="w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-500 text-white">
                                {isLoading ? <LoadingSpinner /> : '✨'}
                                {isLoading ? 'Generating Captions...' : 'Generate Captions'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right Column: Outputs */}
                <div className={`${cardBaseClass}`}>
                    <h2 className="text-2xl font-bold text-slate-100 mb-6 text-center">AI Generated Captions</h2>
                    <div className="space-y-4">
                        {isLoading && (
                            <div className="flex flex-col justify-center items-center h-64 space-y-4">
                                <CookingPotLoader /> 
                                <p className="text-slate-400 text-lg font-medium animate-pulse">Cooking up fresh captions...</p> 
                            </div>
                        )}
                        {!isLoading && generatedCaptions.length === 0 && (
                            <div className="text-center py-16 text-slate-400">
                                <p>Your generated captions will appear here.</p>
                            </div>
                        )}
                        {generatedCaptions.map((captionItem) => (
                            <div key={captionItem.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/90 shadow-lg">
                                <p className="text-slate-100 text-base mb-4 whitespace-pre-wrap leading-relaxed">{captionItem.text}</p>
                                <div className="flex justify-end items-center space-x-2 mt-2 border-t border-slate-600/70 pt-3">
                                    <button 
                                        title="Copy Caption" 
                                        onClick={() => copyToClipboard(captionItem.text, captionItem.id)} 
                                        className="p-2 text-slate-300 hover:text-white hover:bg-slate-600/70 rounded-md transition-colors"
                                    >
                                        {copySuccessId === captionItem.id ? 'Copied!' : <CopyIcon/>}
                                    </button>
                                    <button
                                        title={captionItem.isSaved ? "Saved!" : "Save to History"}
                                        onClick={() => handleSaveCaptionToDB(captionItem)}
                                        disabled={captionItem.isSaving || captionItem.isSaved}
                                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${
                                            captionItem.isSaved ? 'bg-green-600 text-white' : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
                                        }`}
                                    >
                                        {captionItem.isSaving ? <LoadingSpinner className="w-4 h-4"/> : <SaveToDBIcon className="w-4 h-4"/>}
                                        {captionItem.isSaving ? 'Saving...' : (captionItem.isSaved ? 'Saved' : 'Save')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

