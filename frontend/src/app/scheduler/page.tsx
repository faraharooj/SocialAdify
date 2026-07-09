// D:\socialadify\frontend\src\app\scheduler\page.tsx

'use client';

import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import {
    createScheduledPost,
    fetchScheduledPosts,
    deleteScheduledPost,
    ScheduledPost,
    SchedulePostPayload,
    getAISuggestion,
} from '../../services/schedulerService';
import { HistoryItem } from '../../services/historyService';
import Link from 'next/link';
import EditScheduledPostModal from '../../components/EditScheduledPostModal';
import ImportFromHistoryModal from '../../components/ImportFromHistoryModal';

// --- (Components and Icons) ---
interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    post: ScheduledPost | null;
}
const DeletePostConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, post }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full text-center border border-slate-700">
                <h3 className="text-xl font-bold text-red-400 mb-4">Confirm Deletion</h3>
                <p className="text-slate-300 mb-6">
                    Are you sure you want to delete the post scheduled for: <br />
                    <span className="font-semibold text-orange-300">{post ? new Date(post.scheduled_at).toLocaleString("en-PK", { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : 'this post'}</span>?
                </p>
                <div className="flex justify-center gap-4">
                    <button onClick={onClose} className="px-5 py-2.5 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600">Cancel</button>
                    <button onClick={onConfirm} className="px-5 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700">Delete</button>
                </div>
            </div>
        </div>
    );
};
const UploadIcon = ({ className = "w-10 h-10 text-slate-500 group-hover:text-orange-400" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg> );
const LoadingSpinner = ({ className = "animate-spin h-5 w-5 text-white" }: {className?: string}) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> );
const EditIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg> );
const DeleteIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> );
const SparklesIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L17 13.75M17 13.75L15.75 12M17 13.75L18.25 15M15.75 12L17 10.25" /></svg> );
const ImportIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> );

const API_BASE_URL_STATIC = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// --- TIMEZONE HELPERS FOR PAKISTAN (PKT) ---

/**
 * Gets the current time in Asia/Karachi formatted as YYYY-MM-DDTHH:MM
 * This is used for the 'min' attribute of the datetime input.
 */
const getCurrentPKTISOString = (): string => {
    // Get current date, force it to PKT string
    const now = new Date();
    // Use Intl to get PKT parts
    const pktString = now.toLocaleString("en-US", { timeZone: "Asia/Karachi", hour12: false });
    const pktDate = new Date(pktString);
    
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${pktDate.getFullYear()}-${pad(pktDate.getMonth() + 1)}-${pad(pktDate.getDate())}T${pad(pktDate.getHours())}:${pad(pktDate.getMinutes())}`;
};

/**
 * Converts a string selected by the user (which they intend to be PKT)
 * into a UTC Date Object.
 * Logic: User Input -> Treat as PKT -> Subtract 5 hours -> Result is UTC.
 */
const convertInputPKTToUTC = (dateTimeStr: string): Date => {
    const [datePart, timePart] = dateTimeStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);

    // Create a Date object assuming UTC first
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
    
    // PKT is UTC+5. To get strict UTC from PKT, we subtract 5 hours.
    // 5 hours * 60 min * 60 sec * 1000 ms
    const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
    
    return new Date(utcDate.getTime() - PKT_OFFSET_MS);
};

// Formats a Date object back to the string the input expects (Local representation)
const formatToInputString = (date: Date): string => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};


export default function SchedulerPage() {
    const { token, isAuthReady, isAuthenticated } = useAuth();

    const [caption, setCaption] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [scheduledDateTime, setScheduledDateTime] = useState('');
    const [targetPlatform, setTargetPlatform] = useState('Facebook');
    const [aiReasoning, setAiReasoning] = useState<string | null>(null);
    
    const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingPosts, setIsFetchingPosts] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentEditingPost, setCurrentEditingPost] = useState<ScheduledPost | null>(null);
    const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<ScheduledPost | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isGettingSuggestion, setIsGettingSuggestion] = useState(false);

    // Load posts
    const loadScheduledPosts = useCallback(async () => {
        if (!token) return;
        setIsFetchingPosts(true);
        try {
            const posts = await fetchScheduledPosts(token);
            // Sort: Latest scheduled time first
            const sortedPosts = posts.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
            setScheduledPosts(sortedPosts);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load posts.");
        } finally {
            setIsFetchingPosts(false);
        }
    }, [token]);

    useEffect(() => { 
        if(isAuthenticated) {
            loadScheduledPosts();
        }
    }, [isAuthenticated, loadScheduledPosts, token]);

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => { 
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSchedulePost = async (event: FormEvent) => { 
        event.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!token || !imageFile || !caption || !scheduledDateTime) {
            setError("Image, caption, and schedule date/time are required.");
            return;
        }

        // --- TIME VALIDATION LOGIC ---
        // 1. Convert user's input (assumed PKT) to absolute UTC
        const plannedDateUTC = convertInputPKTToUTC(scheduledDateTime);
        const nowUTC = new Date();

        // 2. Strict Check: Is the calculated UTC time in the past?
        if (plannedDateUTC.getTime() <= nowUTC.getTime()) {
            setError("You cannot schedule a post in the past (Timezone: PKT). Please select a future time.");
            return;
        }

        setIsLoading(true);

        const payload: SchedulePostPayload = {
            caption,
            scheduled_at_str: plannedDateUTC.toISOString(), // Send Strict UTC to backend
            image_file: imageFile,
            target_platform: targetPlatform || undefined,
            auto_post: true,
            auto_boost: false,
        };

        try {
            await createScheduledPost(token, payload);
            setSuccessMessage("Post scheduled successfully!");
            
            // Reset Form
            setCaption('');
            setImageFile(null);
            setImagePreviewUrl(null);
            setScheduledDateTime('');
            setTargetPlatform('');
            
            // Refresh List
            loadScheduledPosts();
        } catch(err) {
            setError(err instanceof Error ? err.message : "Failed to schedule post.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetAISuggestion = async () => {
        if (!token) {
            setError("You must be logged in to use this feature.");
            return;
        }
        if (!caption || !targetPlatform) {
            setError("Please provide a caption and select a target platform before getting a suggestion.");
            return;
        }
        setIsGettingSuggestion(true);
        setError(null);
        try {
            const response = await getAISuggestion(token, {
                caption: caption,
                target_platform: targetPlatform,
                is_boosted: false
            });

            // AI returns UTC string. We need to display this as local (PKT-like) time in the input.
            const suggestedUTCDate = new Date(response.suggested_time_utc.endsWith('Z') ? response.suggested_time_utc : response.suggested_time_utc + 'Z');
            
            // Convert UTC Date -> PKT String for Input
            // Logic: Add 5 hours to UTC to get PKT display time
            const pktDisplayDate = new Date(suggestedUTCDate.getTime() + (5 * 60 * 60 * 1000));
            const inputString = formatToInputString(pktDisplayDate);
            
            setScheduledDateTime(inputString);
            setAiReasoning(response.reasoning || null);

            setTimeout(() => {
                setAiReasoning(null);
            }, 15000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "AI suggestion failed.");
        } finally {
            setIsGettingSuggestion(false);
        }
    };

    const confirmDeletePost = async () => { 
        if (!postToDelete || !token) return;
        setDeletingPostId(postToDelete.id);
        try {
            await deleteScheduledPost(token, postToDelete.id);
            setScheduledPosts(prev => prev.filter(p => p.id !== postToDelete.id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete post.");
        } finally {
            setDeletingPostId(null);
            setIsDeleteConfirmModalOpen(false);
        }
    };

    const handleOpenEditModal = (post: ScheduledPost) => { 
        setCurrentEditingPost(post);
        setIsEditModalOpen(true);
    };

    const handlePostUpdated = (updatedPost: ScheduledPost) => { 
        setScheduledPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    };

    // Format for display (list view)
    const formatDisplayDate = (dateString: string) => {  
        const date = new Date(dateString);
        return date.toLocaleString("en-PK", {
            timeZone: "Asia/Karachi",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });
    };

    const handleSelectFromHistory = (item: HistoryItem) => {
        setCaption(item.caption);
        if (item.item_type === 'post' && item.image_url) {
            setImagePreviewUrl(`${API_BASE_URL_STATIC}${item.image_url}`);
            setImageFile(null);
            setSuccessMessage("Visual imported! Please re-upload the image file to finalize.");
            setTimeout(() => setSuccessMessage(null), 4000);
        }
    };

    const inputBaseClass = "w-full px-4 py-2.5 text-sm border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-400 outline-none transition bg-slate-700/50 text-slate-100";
    const labelBaseClass = "block text-sm font-medium text-slate-300 mb-1.5";
    const cardBaseClass = "bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-700/80";

    if (!isAuthReady) { return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner/></div>; }
    if (!isAuthenticated && isAuthReady) { return <div className="text-center py-10"><Link href="/login">Please log in</Link></div>; }

    return (
        <>
            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="space-y-10">
                    <header className="text-center">
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-red-400 pb-2">Post Scheduler</h1>
                        <p className="mt-3 text-md text-slate-400 max-w-2xl mx-auto">Plan and automate your social media content.</p>
                    </header>
                    
                    <section className={`${cardBaseClass} max-w-2xl mx-auto`}>
                        <h2 className="text-xl font-semibold text-slate-100 mb-6 text-center">Schedule a New Post</h2>
                        <form onSubmit={handleSchedulePost} className="space-y-6">
                            {/* Image Upload */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label htmlFor="imageUploadScheduler" className={labelBaseClass}>Upload Image*</label>
                                    <button type="button" onClick={() => setIsImportModalOpen(true)} className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
                                        <ImportIcon className="w-3.5 h-3.5"/> Import Visual
                                    </button>
                                </div>
                                <label htmlFor="imageUploadScheduler" className="mt-1 flex flex-col items-center justify-center w-full h-48 px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-xl group hover:border-orange-500 transition-colors bg-slate-700/30 cursor-pointer">
                                    {imagePreviewUrl ? ( <div className="relative w-full h-full max-h-40"><Image src={imagePreviewUrl} alt="Selected preview" fill style={{objectFit: "contain"}} className="rounded-md" sizes="30vw" /></div>)
                                    : ( <div className="space-y-1 text-center"><UploadIcon /><p className="text-xs text-slate-400">Click to upload</p><p className="text-xs text-slate-500">PNG, JPG up to 10MB</p></div> )}
                                </label>
                                <input id="imageUploadScheduler" name="imageUploadScheduler" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" required />
                            </div>
                            
                            {/* Caption */}
                            <div>
                                <div className="flex justify-between items-center">
                                    <label htmlFor="caption" className={labelBaseClass}>Caption*</label>
                                    <button type="button" onClick={() => setIsImportModalOpen(true)} className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
                                        <ImportIcon className="w-3.5 h-3.5"/> Import Caption
                                    </button>
                                </div>
                                <textarea id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} className={`${inputBaseClass} min-h-[100px]`} placeholder="Write your engaging caption here..." rows={4} required />
                            </div>
                            
                            {/* Schedule Date & Time */}
                            <div>
                                <div className="flex justify-between items-center">
                                    <label htmlFor="scheduledDateTime" className={`${labelBaseClass} mb-0`}>
                                        Schedule Date & Time <span className="text-orange-400 text-xs ml-1">(GMT+5 PKT)</span>*
                                    </label>
                                    <button 
                                        type="button" 
                                        onClick={handleGetAISuggestion} 
                                        disabled={isGettingSuggestion}
                                        className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {isGettingSuggestion ? (
                                            <> <LoadingSpinner className="w-3.5 h-3.5" /> Getting suggestion... </>
                                        ) : (
                                            <> <SparklesIcon className="w-3.5 h-3.5"/> Get AI Suggestion </>
                                        )}
                                    </button>
                                </div>
                                <input 
                                    type="datetime-local" 
                                    id="scheduledDateTime" 
                                    value={scheduledDateTime} 
                                    onChange={(e) => setScheduledDateTime(e.target.value)} 
                                    className={inputBaseClass} 
                                    required 
                                    // Use the specific PKT helper here for the min attribute
                                    min={getCurrentPKTISOString()}
                                />
                                {aiReasoning && (
                                    <p className="text-xs text-slate-400 mt-2 p-2 bg-slate-700/50 rounded-md italic">
                                        <strong>AI Suggestion:</strong> {aiReasoning}
                                    </p>
                                )}
                            </div>

                            {/* Target Platform */}
                            <div>
                                <label htmlFor="targetPlatform" className={labelBaseClass}>Target Platform </label>
                                <select id="targetPlatform" value={targetPlatform} onChange={(e) => setTargetPlatform(e.target.value)} className={inputBaseClass}>
                                    <option value="Instagram" className="bg-slate-700">Instagram</option>
                                    <option value="Facebook" className="bg-slate-700">Facebook</option>
                                </select>
                            </div>
                            
                            {error && <p className="text-sm text-red-400 text-center bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>}
                            {successMessage && <p className="text-sm text-green-400 text-center bg-green-900/20 p-2 rounded border border-green-900/50">{successMessage}</p>}
                            
                            <div className="pt-2">
                                <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition disabled:opacity-60 bg-orange-600 hover:bg-orange-500 text-white">
                                    {isLoading && <LoadingSpinner className="mr-1 h-5 w-5"/>}
                                    {isLoading ? 'Scheduling...' : 'Schedule Post'}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className={`${cardBaseClass} max-w-4xl mx-auto`}>
                        <h2 className="text-xl font-semibold text-slate-100 mb-6 sticky top-0 bg-slate-800/90 py-2 z-10 backdrop-blur">
                            Your Scheduled Posts ({scheduledPosts.length})
                        </h2>
                        {isFetchingPosts ? (
                            <div className="flex justify-center items-center py-10"><LoadingSpinner className="h-8 w-8 text-orange-400" /></div>
                        ) : scheduledPosts.length > 0 ? (
                            // Wrapper for "No Limit" scrollable list
                            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                                {scheduledPosts.map(post => (
                                    <div key={post.id} className="flex items-center bg-slate-900/50 p-4 rounded-lg border border-slate-700 transition hover:border-slate-600">
                                        <div className="w-16 h-16 relative rounded-md overflow-hidden flex-shrink-0 mr-4 border border-slate-700">
                                            <Image src={`${API_BASE_URL_STATIC}${post.image_url}`} alt="Scheduled post" fill className="object-cover" sizes="10vw" />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <p className="text-sm text-slate-300 whitespace-pre-wrap break-words line-clamp-2">{post.caption}</p>
                                            <div className="mt-2 pt-2 border-t border-slate-700/50 flex flex-wrap gap-x-4 gap-y-1">
                                                <p className="text-xs text-slate-400">To: <span className="font-medium text-slate-200">{post.target_platform || 'Not Specified'}</span></p>
                                                <p className="text-xs text-slate-400">On: <span className="font-medium text-orange-300">{formatDisplayDate(post.scheduled_at)} (PKT)</span></p>
                                                <p className={`text-xs font-semibold ${post.status === 'completed' ? 'text-green-400' : 'text-cyan-400'}`}>Status: <span className="capitalize">{post.status}</span></p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            {post.status !== 'completed' && (
                                                <button onClick={() => handleOpenEditModal(post)} className="p-2 text-slate-400 hover:text-sky-400 rounded-md hover:bg-slate-700 transition" title="Edit Post"><EditIcon /></button>
                                            )}
                                            <button onClick={() => { setPostToDelete(post); setIsDeleteConfirmModalOpen(true); }} className="p-2 text-slate-400 hover:text-red-400 rounded-md hover:bg-slate-700 transition" title="Delete Post" disabled={deletingPostId === post.id}>
                                                {deletingPostId === post.id ? <LoadingSpinner className="h-4 w-4" /> : <DeleteIcon />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10"><p className="text-slate-400">You have no posts scheduled.</p></div>
                        )}
                    </section>
                </div>
            </div>
            
            {/* Modals */}
            <EditScheduledPostModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} post={currentEditingPost} onPostUpdated={handlePostUpdated} />
            <DeletePostConfirmationModal isOpen={isDeleteConfirmModalOpen} onClose={() => setIsDeleteConfirmModalOpen(false)} onConfirm={confirmDeletePost} post={postToDelete} />
            <ImportFromHistoryModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSelect={handleSelectFromHistory} />
        </>
    );
}