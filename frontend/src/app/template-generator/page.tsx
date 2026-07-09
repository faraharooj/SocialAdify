// D:/socialadify/frontend/src/app/template-generator/page.tsx
'use client';

import React, { useState, FormEvent, useEffect, useRef, ChangeEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useImageContext } from '@/context/ImageContext';
import { 
    getTemplates, 
    generateFromTemplate, 
    Template, 
    EditableField
} from '@/services/postGeneratorService';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// --- NEW: Import the shared tabs component ---
import GeneratorTabs from '@/components/GeneratorTabs';

// --- Icon Components ---
const HomeIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125A2.25 2.25 0 0021 18.75V9.75M8.25 21h7.5" /></svg> );
const HistoryIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg> );
const CaptionIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-6.75 3h9m-9 3h9M3.375 3h17.25c1.034 0 1.875.841 1.875 1.875v17.25c0 1.034-.841 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 22.125V4.875C1.5 3.841 2.341 3 3.375 3z" /></svg> );
const LoadingSpinner = ({ className = "animate-spin h-5 w-5 text-white" }: {className?: string}) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
const UploadIcon = ({ className = "w-6 h-6 text-slate-400" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg> );

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type PageState = 'gallery' | 'editor' | 'loading' | 'result';

export default function TemplateGeneratorPage() {
    const { token } = useAuth();
    const { setSharedImage } = useImageContext();
    const router = useRouter();
    
    const [pageState, setPageState] = useState<PageState>('gallery');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedPost, setGeneratedPost] = useState<{imageUrl: string; templateName: string} | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    
    const [templateTextValues, setTemplateTextValues] = useState<Record<string, string>>({});
    const [templateImageFiles, setTemplateImageFiles] = useState<Record<string, File | null>>({});
    const [templateImagePreviews, setTemplateImagePreviews] = useState<Record<string, string>>({});

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (token) {
            getTemplates(token)
                .then(setTemplates)
                .catch((err: any) => {
                    console.error("Failed to fetch templates:", err);
                    setError("Could not load templates.");
                });
        }
    }, [token]);

    useEffect(() => {
        if (pageState === 'editor' && selectedTemplate && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const baseImage = new window.Image();
            baseImage.crossOrigin = "anonymous";
            baseImage.src = `${API_BASE_URL}/${selectedTemplate.base_image_path.replace('/static/', 'static/')}`;
            
            baseImage.onload = () => {
                canvas.width = baseImage.width;
                canvas.height = baseImage.height;
                ctx.drawImage(baseImage, 0, 0);

                const fields = selectedTemplate.editable_fields || [];
                const imageFields = fields.filter(f => f.type === 'image');
                const textFields = fields.filter(f => f.type === 'text');
                
                let imagesToLoad = imageFields.length;

                const drawText = () => {
                    textFields.forEach(field => {
                        if (field.type === 'text') {
                            const text = templateTextValues[field.key] || '';
                            ctx.font = `${field.font_size}px "${field.font.split('.')[0]}"`;
                            ctx.fillStyle = field.color;
                            ctx.textBaseline = 'top';
                            ctx.fillText(text, field.position.x, field.position.y);
                        }
                    });
                };
                
                if (imagesToLoad === 0) {
                    drawText();
                    return;
                }

                imageFields.forEach(field => {
                    if (field.type === 'image' && templateImagePreviews[field.key]) {
                        const logoImage = new window.Image();
                        logoImage.src = templateImagePreviews[field.key];
                        logoImage.onload = () => {
                            const ratio = Math.min(field.width / logoImage.width, field.height / logoImage.height);
                            const newWidth = logoImage.width * ratio;
                            const newHeight = logoImage.height * ratio;
                            ctx.drawImage(logoImage, field.position.x, field.position.y, newWidth, newHeight);
                            imagesToLoad--;
                            if (imagesToLoad === 0) {
                                drawText();
                            }
                        }
                    } else {
                        imagesToLoad--;
                        if (imagesToLoad === 0) {
                            drawText();
                        }
                    }
                });
            };
        }
    }, [selectedTemplate, templateTextValues, templateImagePreviews, pageState]);

    const handleTemplateInputChange = (key: string, value: string) => {
        setTemplateTextValues(prev => ({ ...prev, [key]: value }));
    };

    const handleTemplateFileChange = (key: string, file: File | null) => {
        setTemplateImageFiles(prev => ({ ...prev, [key]: file }));
        if (file) {
            if (templateImagePreviews[key]) {
                URL.revokeObjectURL(templateImagePreviews[key]);
            }
            setTemplateImagePreviews(prev => ({...prev, [key]: URL.createObjectURL(file)}));
        } else {
            setTemplateImagePreviews(prev => {
                const newPreviews = { ...prev };
                if (newPreviews[key]) {
                    URL.revokeObjectURL(newPreviews[key]);
                }
                delete newPreviews[key];
                return newPreviews;
            });
        }
    };
    
    const handleTemplateSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!token || !selectedTemplate) return;
        
        setIsLoading(true);
        setPageState('loading');
        setError(null);

        const formData = new FormData();

        for (const key in templateTextValues) {
            formData.append(key, templateTextValues[key]);
        }
        for (const key in templateImageFiles) {
            if (templateImageFiles[key]) {
                formData.append(key, templateImageFiles[key] as File);
            }
        }
        
        try {
            const response = await generateFromTemplate(token, selectedTemplate.id, formData);
            setGeneratedPost({
                imageUrl: `${API_BASE_URL}${response.generated_image_url}`,
                templateName: selectedTemplate.name
            });
            setPageState('result');
        } catch (err) {
             const errorMessage = err instanceof Error ? err.message : "Could not generate from template.";
            setError(errorMessage);
            setPageState('editor'); 
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectTemplate = (template: Template) => {
        setSelectedTemplate(template);
        const initialTextValues: Record<string, string> = {};
        template.editable_fields?.forEach(field => {
            if (field.type === 'text') {
                initialTextValues[field.key] = '';
            }
        });
        setTemplateTextValues(initialTextValues);
        setTemplateImageFiles({});
        setTemplateImagePreviews({});
        setPageState('editor');
    };
    
    const handleCreateAnother = () => {
        setPageState('gallery');
        setSelectedTemplate(null);
        setGeneratedPost(null);
    };

    const handleCreateCaption = async () => {
        if (!generatedPost) return;
        try {
            const response = await fetch(generatedPost.imageUrl, { cache: 'no-store' });
            const blob = await response.blob();
            const file = new File([blob], "template-post.png", { type: blob.type });
            setSharedImage(file);
            router.push('/caption-generator');
        } catch (err) {
            setError("Failed to load image for captioning.");
        }
    };

    const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";
    const inputClass = "w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-slate-100 placeholder-slate-400";
    const cardClass = "bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-700/80";

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <header className="text-center mb-10">
                <div className="flex justify-between items-center mb-4 px-2 sm:px-0">
                    <Link href="/home" className="text-sm text-sky-400 hover:text-sky-300 flex items-center gap-1.5">
                        <HomeIcon /> Back to Hub
                    </Link>
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
            
            {/* --- THIS IS THE FIX: Added the shared GeneratorTabs component --- */}
            <GeneratorTabs />

            <div className="max-w-7xl mx-auto">
                {pageState === 'loading' && (
                    <div className="flex justify-center items-center py-20"><LoadingSpinner className="w-12 h-12 text-sky-400"/></div>
                )}

                {pageState === 'gallery' && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-center text-slate-100 mb-6">Choose a Template</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {templates.map((template, index) => (
                                <div key={`${template.id || index}-${template.name}`} onClick={() => handleSelectTemplate(template)} className="cursor-pointer group relative block bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700 hover:border-sky-500 transition">
                                    <Image src={`${API_BASE_URL}/${template.preview_image_path.replace('/static/', 'static/')}`} alt={template.name} width={400} height={400} style={{objectFit:"cover"}} className="group-hover:opacity-80 transition"/>
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition"></div>
                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                        <h3 className="font-semibold text-white">{template.name}</h3>
                                        <p className="text-xs text-slate-300 line-clamp-2">{template.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {pageState === 'editor' && selectedTemplate && (
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-8">
                        <div className="lg:sticky lg:top-28">
                            <h2 className="text-2xl font-bold text-slate-100 mb-2">Live Preview</h2>
                            <p className="text-sm text-slate-400 mb-4">Your changes will appear on the canvas below as you type.</p>
                            <canvas ref={canvasRef} className="w-full h-auto rounded-lg border-2 border-slate-700 bg-slate-800" />
                        </div>
                        <div className={cardClass}>
                            <button onClick={() => setPageState('gallery')} className="text-sm text-sky-400 mb-4">&larr; Back to Templates</button>
                            <h2 className="text-2xl font-bold text-slate-100 mb-4">Edit "{selectedTemplate.name}"</h2>
                            <form onSubmit={handleTemplateSubmit} className="space-y-4">
                                {selectedTemplate.editable_fields?.map((field) => {
                                    if (field.type === 'image') {
                                        return (
                                            <div key={`${selectedTemplate.id}-${field.key}`}>
                                                <label htmlFor={field.key} className={labelClass}>{field.label}</label>
                                                <p className="text-xs text-slate-400 mb-2">For best results, use a logo with a transparent background (.PNG).</p>
                                                <div className="mt-1 flex items-center gap-4">
                                                    <div className="w-20 h-20 rounded-md bg-slate-700/50 border border-slate-600 flex items-center justify-center overflow-hidden">
                                                        {templateImagePreviews[field.key] ? (
                                                            <Image src={templateImagePreviews[field.key]} alt="logo preview" width={80} height={80} objectFit="contain" />
                                                        ) : (
                                                            <UploadIcon />
                                                        )}
                                                    </div>
                                                    <input
                                                        type="file" id={field.key}
                                                        className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200"
                                                        accept="image/png, image/jpeg"
                                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleTemplateFileChange(field.key, e.target.files ? e.target.files[0] : null)}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    }
                                    
                                    if (field.type === 'text') {
                                        return (
                                            <div key={`${selectedTemplate.id}-${field.key}`}>
                                                <label htmlFor={field.key} className={labelClass}>{field.label}</label>
                                                <input
                                                    type="text" id={field.key} value={templateTextValues[field.key] || ''}
                                                    onChange={e => handleTemplateInputChange(field.key, e.target.value)}
                                                    className={inputClass} placeholder={`Enter ${field.label.toLowerCase()}`}
                                                    maxLength={field.max_length} required
                                                />
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                                <div className="pt-4">
                                    <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg shadow-md transition bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50">
                                        {isLoading ? <LoadingSpinner/> : 'Generate Post'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {pageState === 'result' && generatedPost && (
                    <div className={`${cardClass} max-w-lg mx-auto text-center`}>
                        <h2 className="text-2xl font-bold text-slate-100 mb-2">Success!</h2>
                        <p className="text-slate-400 mb-6">Your post has been generated and saved to your history.</p>
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-slate-700 mb-6">
                            <Image src={generatedPost.imageUrl} alt={`Generated from ${generatedPost.templateName}`} layout="fill" objectFit="contain" />
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <button onClick={handleCreateCaption} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg shadow-md transition-colors bg-teal-600 hover:bg-teal-500 text-white">
                                <CaptionIcon /> Create Caption
                            </button>
                             <Link href="/history" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg shadow-md transition-colors bg-indigo-600 hover:bg-indigo-500 text-white">
                                <HistoryIcon className="w-4 h-4" /> View History
                            </Link>
                             <button onClick={handleCreateAnother} className="px-5 py-2.5 text-sm font-medium bg-sky-600 hover:bg-sky-500 rounded-lg">
                                Create Another
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className={`${cardClass} mt-6 text-center max-w-md mx-auto`}>
                        <h3 className="text-lg font-semibold text-red-400">An Error Occurred</h3>
                        <p className="mt-2 text-sm text-slate-400 bg-slate-700/50 p-3 rounded-md">{error}</p>
                        <button onClick={() => { setError(null); }} className="mt-4 px-4 py-2 text-sm font-medium bg-sky-600 hover:bg-sky-500 rounded-md">
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

