// D:/socialadify/frontend/src/app/post-generator/page.tsx
'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useImageContext } from '@/context/ImageContext';
import { 
    generateVisualPost, 
    saveVisualPost, 
    PostGenerationPayload, 
    PostGenerationResult
} from '@/services/postGeneratorService';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
// --- NEW: Import the shared tabs component ---
import GeneratorTabs from '@/components/GeneratorTabs';

// --- (Icon Components remain the same) ---
const PlusIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> );
const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.927a2.25 2.25 0 01-2.244-2.077L5.09 5.93c-.3-.058-.6-.117-.9-.176M4.5 5.25a2.25 2.25 0 012.25-2.25h1.5A2.25 2.25 0 0112 5.25m-3 0h3.75" /></svg> );
const WandIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L17 13.75M17 13.75L15.75 12M17 13.75L18.25 15M15.75 12L17 10.25" /></svg> );
const DownloadIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg> );
const HomeIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125A2.25 2.25 0 0021 18.75V9.75M8.25 21h7.5" /></svg> );
const SaveIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg> );
const LoadingSpinner = ({ className = "animate-spin h-5 w-5 text-white" }: {className?: string}) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
const HistoryIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg> );
const EditIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg> );
const CaptionIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-6.75 3h9m-9 3h9M3.375 3h17.25c1.034 0 1.875.841 1.875 1.875v17.25c0 1.034-.841 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 22.125V4.875C1.5 3.841 2.341 3 3.375 3z" /></svg> );

const ImageEditor = dynamic(() => import('@/components/ImageEditor'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"><p className="text-white">Loading Editor...</p></div>,
});

const GeneratingAnimation = () => (
    <div className="text-center p-8 bg-slate-900 rounded-xl border border-slate-700">
        <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-t-sky-400 border-slate-700 rounded-full animate-spin"></div>
            <div className="w-full h-full flex items-center justify-center">
                <WandIcon className="w-10 h-10 text-sky-400 animate-pulse" />
            </div>
        </div>
        <p className="mt-6 text-lg font-semibold text-slate-200">Generating Your Visual Ad...</p>
        <p className="mt-2 text-sm text-slate-400">This can take up to a minute. The AI is hard at work!</p>
    </div>
);

type PageState = 'form' | 'loading' | 'generated' | 'editing' | 'result';

export default function PostGeneratorPage() {
    const { token, logout } = useAuth();
    const { setSharedImage } = useImageContext();
    const router = useRouter();
    
    const [formState, setFormState] = useState<PostGenerationPayload>({
        product_name: '', target_audience: '', key_features: [''],
        tone: 'Professional', platform: 'Instagram', call_to_action: '', aspect_ratio: '1:1',
    });

    const [pageState, setPageState] = useState<PageState>('form');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<PostGenerationResult | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    
    const [promptUsed, setPromptUsed] = useState<string | null>(null);

    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true); }, []);


    const handleInputChange = (field: keyof PostGenerationPayload, value: string) => setFormState(prev => ({ ...prev, [field]: value }));
    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...formState.key_features];
        newFeatures[index] = value;
        setFormState(prev => ({ ...prev, key_features: newFeatures }));
    };
    const addFeature = () => setFormState(prev => ({ ...prev, key_features: [...prev.key_features, ''] }));
    const removeFeature = (index: number) => {
        if (formState.key_features.length > 1) {
            setFormState(prev => ({ ...prev, key_features: prev.key_features.filter((_, i) => i !== index) }));
        }
    };

    const handleAiSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!token) { setError("Authentication error."); logout(); return; }
        
        setPageState('loading');
        setError(null);
        setResult(null);
        setPromptUsed(null);

        const payload: PostGenerationPayload = {
            ...formState,
            key_features: formState.key_features.filter(f => f.trim() !== ''),
        };

        try {
            const generatedResult = await generateVisualPost(token, payload);
            setResult(generatedResult);
            setPromptUsed(generatedResult.prompt_used);
            setPageState('generated');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(errorMessage);
            setPageState('form');
        }
    };

    const handleFinishEditing = (editedImageDataUrl: string) => {
        if (result) {
            setResult({ ...result, image_data_url: editedImageDataUrl });
        }
        setPageState('result');
    };
    
    const handleSavePost = async () => {
        if (!token || !result) return;
        setIsSaving(true);
        setError(null);
        setSaveSuccess(false);

        try {
            await saveVisualPost(token, {
                image_data_url: result.image_data_url,
                prompt_used: result.prompt_used,
                original_request: formState
            });
            setSaveSuccess(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Could not save the post.";
            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateAnother = () => {
        setResult(null);
        setSaveSuccess(false);
        setPromptUsed(null);
        setPageState('form');
    };
    
    const handleCreateCaption = async () => {
        if (!result) return;
        const blob = await (await fetch(result.image_data_url)).blob();
        const file = new File([blob], "generated-ad.png", { type: blob.type });
        setSharedImage(file);
        router.push('/caption-generator');
    };

    const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";
    const inputClass = "w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-slate-100 placeholder-slate-400";
    const cardClass = "bg-slate-900 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-700/80";

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <header className="text-center mb-10">
                <div className="flex justify-between items-center mb-4 px-2 sm:px-0">
                    
                    <Link href="/history" className="text-sm text-sky-400 hover:text-sky-300 flex items-center gap-1.5">
                        <HistoryIcon /> View History
                    </Link>
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-green-300 via-sky-400 to-blue-400 bg-clip-text text-transparent pb-2">
                    Visual Ad Generator
                </h1>
                <p className="mt-3 text-md text-slate-400 max-w-2xl mx-auto">
                    Create a stunning visual ad in seconds. Choose to generate with our powerful AI or select a pre-designed, editable template.
                </p>
            </header>

            {/* --- NEW: Use the shared tabs component --- */}
            <GeneratorTabs />

            <div className="max-w-4xl mx-auto">
                {pageState === 'form' && (
                    <form onSubmit={handleAiSubmit} className={`${cardClass} max-w-2xl mx-auto space-y-6`}>
                        {/* (AI Form fields remain the same) */}
                        <div>
                            <label htmlFor="productName" className={labelClass}>Product or Service Name*</label>
                            <input type="text" id="productName" value={formState.product_name} onChange={e => handleInputChange('product_name', e.target.value)} className={inputClass} placeholder="e.g., Aura Smart Watch" required />
                        </div>
                        <div>
                            <label htmlFor="targetAudience" className={labelClass}>Who is your Target Audience?*</label>
                            <input type="text" id="targetAudience" value={formState.target_audience} onChange={e => handleInputChange('target_audience', e.target.value)} className={inputClass} placeholder="e.g., Fitness enthusiasts aged 25-45" required />
                        </div>
                        <div>
                            <label className={labelClass}>Key Features or Selling Points*</label>
                            <div className="space-y-2">
                                {formState.key_features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input type="text" value={feature} onChange={e => handleFeatureChange(index, e.target.value)} className={inputClass} placeholder={`Feature #${index + 1}`} required />
                                        <button type="button" onClick={() => removeFeature(index)} disabled={formState.key_features.length <= 1} className="p-2 text-red-400 hover:text-red-300 bg-slate-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addFeature} className="mt-2 text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1.5">
                                <PlusIcon /> Add another feature
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="aspectRatio" className={labelClass}>Dimensions*</label>
                                <select id="aspectRatio" value={formState.aspect_ratio} onChange={e => handleInputChange('aspect_ratio', e.target.value)} className={inputClass}>
                                    <option value="1:1">Square (1:1)</option>
                                    <option value="16:9">Landscape (16:9)</option>
                                    <option value="9:16">Portrait (9:16)</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="tone" className={labelClass}>Tone*</label>
                                <select id="tone" value={formState.tone} onChange={e => handleInputChange('tone', e.target.value)} className={inputClass}>
                                    <option>Professional</option>
                                    <option>Inspirational</option>
                                    <option>Witty</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="platform" className={labelClass}>Platform*</label>
                                <select id="platform" value={formState.platform} onChange={e => handleInputChange('platform', e.target.value)} className={inputClass}>
                                    <option>Instagram</option>
                                    <option>Facebook</option>
                                    <option>Google Ads</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="callToAction" className={labelClass}>Call to Action Text*</label>
                            <input type="text" id="callToAction" value={formState.call_to_action} onChange={e => handleInputChange('call_to_action', e.target.value)} className={inputClass} placeholder="e.g., Shop Now & Get 15% Off" required />
                        </div>
                        <div className="pt-4">
                            <button type="submit" className="w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition duration-150 ease-in-out bg-sky-600 hover:bg-sky-500 text-white">
                                <WandIcon /> Generate Ad
                            </button>
                        </div>
                    </form>
                )}
                
                {pageState === 'loading' && <GeneratingAnimation />}

                {(pageState === 'generated' || pageState === 'result') && result && (
                    <div className={`${cardClass} text-center`}>
                        <h2 className="text-2xl font-bold text-slate-100 mb-4">
                            {pageState === 'result' ? 'Your Final Ad is Ready!' : 'AI Generated Image'}
                        </h2>
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-slate-700 mb-6">
                            <Image src={result.image_data_url} alt="Generated AI ad" layout="fill" objectFit="contain" />
                        </div>

                        {promptUsed && (
                            <div className="text-left mb-6">
                                <label htmlFor="promptDisplay" className="block text-sm font-medium text-slate-300 mb-1.5">
                                    AI Prompt Used
                                </label>
                                <textarea
                                    id="promptDisplay"
                                    readOnly
                                    value={promptUsed}
                                    className="w-full p-3 text-xs font-mono border border-slate-600 rounded-md bg-slate-900/50 text-slate-300 focus:ring-2 focus:ring-sky-500 outline-none resize-none"
                                    rows={4}
                                />
                                <p className="text-xs text-slate-500 mt-1">You can copy this prompt to refine it or use it elsewhere.</p>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-center gap-4">
                            {pageState === 'generated' ? (
                                <button onClick={() => setPageState('editing')} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg shadow-md transition-colors bg-indigo-600 hover:bg-indigo-500 text-white">
                                    <EditIcon className="w-4 h-4" /> Edit Image
                                </button>
                            ) : (
                                <a href={result.image_data_url} download="socialadify-ad.png" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg shadow-md transition-colors bg-slate-600 hover:bg-slate-500 text-white">
                                    <DownloadIcon /> Download
                                </a>
                            )}
                            <button onClick={handleSavePost} disabled={isSaving || saveSuccess} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg shadow-md transition-colors bg-green-600 hover:bg-green-500 text-white disabled:opacity-70 disabled:cursor-not-allowed">
                                {isSaving ? <LoadingSpinner className="w-4 h-4" /> : <SaveIcon />}
                                {isSaving ? 'Saving...' : (saveSuccess ? 'Saved!' : 'Save Post')}
                            </button>
                             <button onClick={handleCreateCaption} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg shadow-md transition-colors bg-teal-600 hover:bg-teal-500 text-white">
                                <CaptionIcon /> Create Caption
                            </button>
                             <button onClick={handleCreateAnother} className="px-5 py-2.5 text-sm font-medium bg-sky-600 hover:bg-sky-500 rounded-lg">
                                Create Another
                            </button>
                        </div>
                        {saveSuccess && <p className="text-xs text-green-400 mt-2">Post saved to your library!</p>}
                    </div>
                )}

                {isClient && pageState === 'editing' && result && (
                    <ImageEditor 
                        baseImage={result.image_data_url}
                        onFinishEditing={handleFinishEditing}
                        onClose={() => setPageState('generated')}
                    />
                )}

                {error && (
                    <div className={`${cardClass} mt-6 text-center`}>
                        <h3 className="text-lg font-semibold text-red-400">An Error Occurred</h3>
                        <p className="mt-2 text-sm text-slate-400 bg-slate-700/50 p-3 rounded-md">{error}</p>
                        <button onClick={() => { setError(null); setPageState('form'); }} className="mt-4 px-4 py-2 text-sm font-medium bg-sky-600 hover:bg-sky-500 rounded-md">
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

