// D:/socialadify/frontend/src/app/history/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useImageContext } from '@/context/ImageContext';
import { useRouter } from 'next/navigation';
import { fetchHistory, deleteVisualPost, HistoryItem, PostHistoryItem, CaptionHistoryItem } from '../../services/historyService';
import { updateSavedCaptionInDB, deleteSavedCaptionFromDB } from '@/services/captionService';
import Link from 'next/link';
import Image from 'next/image';

// --- REDESIGNED ICONS for a fresh look ---
const EditIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg> );
const DeleteIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.927a2.25 2.25 0 01-2.244-2.077L5.09 5.93a1.95 1.95 0 00-1.022-.682l-.342-.052m1.022.165L5.09 5.93m1.022.165h.008v.008h-.008V6.182zm4.788 0h.008v.008h-.008V6.182zm4.788 0h.008v.008h-.008V6.182z" /></svg> );
const SaveIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> );
const CancelIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> );
const LoadingSpinner = ({ className = "animate-spin h-5 w-5 text-slate-100" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> );
const ClockIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> );
const CaptionIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-6.75 3h9m-9 3h9M3.375 3h17.25c1.034 0 1.875.841 1.875 1.875v17.25c0 1.034-.841 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 22.125V4.875C1.5 3.841 2.341 3 3.375 3z" /></svg> );
const DownloadIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg> );
const ImageIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg> );

const API_BASE_URL_STATIC = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-PK', {
        timeZone: 'Asia/Karachi',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

const CaptionHistoryCard: React.FC<{ caption: CaptionHistoryItem; onEdit: (caption: CaptionHistoryItem) => void; onDelete: (id: string) => void; isEditing: boolean; editingText: string; onEditingTextChange: (text: string) => void; onSaveUpdate: () => void; onCancelEdit: () => void; isLoading: boolean; }> = ({ caption, onEdit, onDelete, isEditing, editingText, onEditingTextChange, onSaveUpdate, onCancelEdit, isLoading }) => {
    return (
        <div className="bg-slate-800/50 backdrop-blur-md shadow-lg rounded-xl p-5 border border-slate-700 flex flex-col h-full">
            <div className="flex-grow">
                {isEditing ? (
                    <div className="space-y-3 flex flex-col h-full">
                        <textarea value={editingText} onChange={(e) => onEditingTextChange(e.target.value)} className="w-full p-3 text-sm border border-sky-500 rounded-md bg-slate-700 text-slate-100 focus:ring-2 focus:ring-sky-400 outline-none flex-grow" rows={5} />
                        <div className="flex justify-end space-x-2">
                            <button onClick={onCancelEdit} className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md flex items-center gap-1" disabled={isLoading}><CancelIcon className="w-4 h-4"/>Cancel</button>
                            <button onClick={onSaveUpdate} className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-500 rounded-md flex items-center gap-1" disabled={isLoading}>{isLoading ? <LoadingSpinner className="w-4 h-4"/> : <SaveIcon className="w-4 h-4"/>} Save</button>
                        </div>
                    </div>
                ) : (
                    <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{caption.caption}</p>
                )}
            </div>
            {!isEditing && (
                <div className="flex justify-between items-center text-xs text-slate-500 mt-4 pt-3 border-t border-slate-700">
                    <span className="flex items-center gap-1.5"><ClockIcon/> {formatDate(caption.created_at)}</span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => onEdit(caption)} className="p-2 text-slate-400 hover:text-sky-400 rounded-md hover:bg-slate-700/50 transition-colors" disabled={isLoading} title="Edit Caption"><EditIcon /></button>
                        <button onClick={() => onDelete(caption.id)} className="p-2 text-slate-400 hover:text-red-400 rounded-md hover:bg-slate-700/50 transition-colors" disabled={isLoading} title="Delete Caption"><DeleteIcon /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

const PostHistoryCard: React.FC<{ post: PostHistoryItem; onDelete: (id: string) => void; onCreateCaption: (post: PostHistoryItem) => void; isLoading: boolean; }> = ({ post, onDelete, onCreateCaption, isLoading }) => {
    const imageUrl = `${API_BASE_URL_STATIC}${post.image_url}`;
    
    // --- NEW: Proper Download Handler ---
    const handleDownload = async () => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `socialadify-post-${post.id}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download image. Please try again.');
        }
    };

    return (
        <div className="group relative bg-slate-800/50 backdrop-blur-md shadow-lg rounded-xl border border-slate-700 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-purple-900/50 hover:border-purple-700">
            <div className="relative aspect-square w-full">
                <Image src={imageUrl} alt="Generated ad" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-100 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     {/* --- CHANGED: Replaced <a> with <button> and added handler --- */}
                     <button onClick={handleDownload} className="p-2 bg-slate-800/70 text-slate-300 hover:text-green-400 rounded-full backdrop-blur-sm" title="Download Post">
                        <DownloadIcon />
                     </button>
                     <button onClick={() => onCreateCaption(post)} className="p-2 bg-slate-800/70 text-slate-300 hover:text-teal-400 rounded-full backdrop-blur-sm" disabled={isLoading} title="Create Caption"><CaptionIcon /></button>
                     <button onClick={() => onDelete(post.id)} className="p-2 bg-slate-800/70 text-slate-300 hover:text-red-400 rounded-full backdrop-blur-sm" disabled={isLoading} title="Delete Post"><DeleteIcon /></button>
                </div>
            </div>
             <div className="p-4 flex-grow flex flex-col">
                <p className="text-xs text-slate-400 uppercase tracking-wider">AI Prompt Used</p>
                <p className="text-sm text-slate-200 mt-1 flex-grow line-clamp-3">{post.caption}</p>
                <div className="flex justify-between items-center text-xs text-slate-500 mt-3 pt-3 border-t border-slate-700">
                    <span className="flex items-center gap-1.5"><ClockIcon/> {formatDate(post.created_at)}</span>
                </div>
            </div>
        </div>
    );
};

export default function HistoryPage() {
    const { token, logout, isAuthReady, isAuthenticated } = useAuth();
    const { setSharedImage } = useImageContext();
    const router = useRouter();

    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState("");
    
    const [filter, setFilter] = useState<'all' | 'posts' | 'captions'>('all');

    const loadHistory = useCallback(async () => {
        if (!token) { setError("Authentication required."); setIsLoading(false); return; }
        setIsLoading(true); setError(null);
        try {
            const data = await fetchHistory(token);
            setHistoryItems(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load history.";
            setError(errorMessage);
            if (errorMessage.toLowerCase().includes("unauthorized")) logout();
        } finally { setIsLoading(false); }
    }, [token, logout]);

    useEffect(() => {
        if (isAuthReady && isAuthenticated) { loadHistory(); }
        else if (isAuthReady && !isAuthenticated) { setError("Please log in to view your history."); setIsLoading(false); }
    }, [isAuthReady, isAuthenticated, loadHistory]);

    // --- (All handler functions remain unchanged) ---
    const handleEditCaption = (caption: CaptionHistoryItem) => { setEditingCaptionId(caption.id); setEditingText(caption.caption); };
    const handleCancelEdit = () => { setEditingCaptionId(null); setEditingText(""); };
    const handleSaveUpdate = async () => {
        if (!token || !editingCaptionId) return;
        setIsLoading(true);
        try {
            await updateSavedCaptionInDB(token, editingCaptionId, { caption_text: editingText });
            setEditingCaptionId(null); setEditingText("");
            await loadHistory();
        } catch (err) { setError(err instanceof Error ? err.message : "Failed to update caption."); } 
        finally { setIsLoading(false); }
    };
    const handleDeleteCaption = async (captionId: string) => {
        if (!window.confirm("Are you sure you want to delete this caption?")) return;
        if (!token) return;
        setIsLoading(true);
        try {
            await deleteSavedCaptionFromDB(token, captionId);
            await loadHistory();
        } catch (err) { setError(err instanceof Error ? err.message : "Failed to delete caption."); } 
        finally { setIsLoading(false); }
    };
    const handleDeletePost = async (postId: string) => {
        if (!window.confirm("Are you sure you want to delete this visual post?")) return;
        if (!token) return;
        setIsLoading(true);
        try {
            await deleteVisualPost(token, postId);
            await loadHistory();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete visual post.");
        } finally {
            setIsLoading(false);
        }
    };
    const handleCreateCaptionFromHistory = async (post: PostHistoryItem) => {
        try {
            const response = await fetch(`${API_BASE_URL_STATIC}${post.image_url}`);
            const blob = await response.blob();
            const file = new File([blob], "saved-post.png", { type: blob.type });
            
            setSharedImage(file);
            router.push('/caption-generator');
        } catch (err) {
            setError("Failed to load image for captioning.");
        }
    };

    if (!isAuthReady) {
        return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><LoadingSpinner className="w-10 h-10 text-purple-400"/></div>;
    }
    
    const filteredItems = historyItems.filter(item => {
        if (filter === 'posts') return item.item_type === 'post';
        if (filter === 'captions') return item.item_type === 'caption';
        return true;
    });

    return (
        <div className="space-y-8">
            <header className="text-center">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 pb-2">
                    Content History
                </h1>
                <p className="mt-2 text-md text-slate-400 max-w-2xl mx-auto">
                    Review, edit, and manage all your previously generated AI content in one place.
                </p>
            </header>

            <div className="flex justify-center items-center gap-2 p-1 rounded-full bg-slate-800/80 border border-slate-700 max-w-sm mx-auto">
                <button onClick={() => setFilter('all')} className={`w-full px-4 py-2 text-sm font-semibold rounded-full transition-colors ${filter === 'all' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}>All</button>
                <button onClick={() => setFilter('posts')} className={`w-full px-4 py-2 text-sm font-semibold rounded-full transition-colors flex items-center justify-center gap-2 ${filter === 'posts' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}><ImageIcon className="w-5 h-5"/> Visuals</button>
                <button onClick={() => setFilter('captions')} className={`w-full px-4 py-2 text-sm font-semibold rounded-full transition-colors flex items-center justify-center gap-2 ${filter === 'captions' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}><CaptionIcon className="w-5 h-5"/> Captions</button>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center py-20"><LoadingSpinner className="w-12 h-12 text-purple-400"/></div>
            )}
            {error && (
                <div className="bg-red-800/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg max-w-2xl mx-auto" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span>{error}</span>
                </div>
            )}
            {!isLoading && !error && historyItems.length === 0 && (
                <div className="text-center py-16 bg-slate-800/50 rounded-2xl shadow-lg border border-slate-700">
                    <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                    <h3 className="mt-2 text-lg font-medium text-slate-200">No Saved Content Yet</h3>
                    <p className="mt-1 text-sm text-slate-400">Start by generating some captions or visual posts!</p>
                </div>
            )}
            
            {!isLoading && filteredItems.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map(item => (
                        item.item_type === 'post' ? (
                            <PostHistoryCard 
                                key={`post-${item.id}`} 
                                post={item} 
                                onDelete={handleDeletePost} 
                                onCreateCaption={handleCreateCaptionFromHistory}
                                isLoading={isLoading} 
                            />
                        ) : (
                            <CaptionHistoryCard
                                key={`caption-${item.id}`}
                                caption={item}
                                onEdit={handleEditCaption}
                                onDelete={handleDeleteCaption}
                                isEditing={editingCaptionId === item.id}
                                editingText={editingText}
                                onEditingTextChange={setEditingText}
                                onSaveUpdate={handleSaveUpdate}
                                onCancelEdit={handleCancelEdit}
                                isLoading={isLoading}
                            />
                        )
                    ))}
                </div>
            )}
        </div>
    );
}