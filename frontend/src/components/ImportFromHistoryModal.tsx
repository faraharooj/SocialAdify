// D:/socialadify/frontend/src/components/ImportFromHistoryModal.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { fetchHistory, HistoryItem, PostHistoryItem, CaptionHistoryItem } from '../services/historyService';

const API_BASE_URL_STATIC = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full">
        <svg className="animate-spin h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

interface ImportFromHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: HistoryItem) => void;
}

const ImportFromHistoryModal: React.FC<ImportFromHistoryModalProps> = ({ isOpen, onClose, onSelect }) => {
    const { token } = useAuth();
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'posts' | 'captions'>('all');

    const loadHistory = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchHistory(token);
            setHistoryItems(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load history.");
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen, loadHistory]);

    if (!isOpen) return null;

    const filteredItems = historyItems.filter(item => {
        if (filter === 'posts') return item.item_type === 'post';
        if (filter === 'captions') return item.item_type === 'caption';
        return true;
    });

    const handleImportItem = (item: HistoryItem) => {
        onSelect(item);
        onClose();
    };

    const handleSaveVisual = async (item: PostHistoryItem) => {
        try {
            const response = await fetch(`${API_BASE_URL_STATIC}${item.image_url}`);
            if (!response.ok) throw new Error("Failed to fetch image.");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `socialadify-visual-${item.id}.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            alert("Visual has been saved to your device. Please remember to re-upload the file in the scheduler.");

        } catch (err) {
            console.error("Failed to download image:", err);
            alert("Could not save the visual. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col border border-slate-700">
                <header className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white">Import from History</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
                </header>
                
                <div className="p-4 border-b border-slate-700">
                    <div className="flex space-x-2">
                        <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-md ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>All</button>
                        <button onClick={() => setFilter('posts')} className={`px-3 py-1 text-sm rounded-md ${filter === 'posts' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Visuals</button>
                        <button onClick={() => setFilter('captions')} className={`px-3 py-1 text-sm rounded-md ${filter === 'captions' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Captions</button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-4">
                    {isLoading ? <LoadingSpinner /> : error ? <p className="text-red-400">{error}</p> : (
                        <div className="space-y-3">
                            {filteredItems.length > 0 ? filteredItems.map(item => (
                                <div key={`${item.item_type}-${item.id}`} className="bg-slate-900/50 p-3 rounded-lg flex items-center gap-4 border border-slate-700">
                                    {item.item_type === 'post' && (
                                        <div className="w-16 h-16 relative rounded-md overflow-hidden flex-shrink-0">
                                            <Image src={`${API_BASE_URL_STATIC}${item.image_url}`} alt="Post visual" fill className="object-cover" sizes="10vw" />
                                        </div>
                                    )}
                                    <div className="flex-grow min-w-0">
                                        <p className="text-sm text-slate-300 whitespace-pre-wrap break-words">{item.caption}</p>
                                        <p className="text-xs text-slate-500 mt-1">{item.item_type === 'post' ? 'Visual Post' : 'Caption'}</p>
                                    </div>
                                    
                                    {/* --- THIS IS THE FIX --- */}
                                    {item.item_type === 'post' ? (
                                        <button onClick={() => handleSaveVisual(item as PostHistoryItem)} className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded-md flex-shrink-0">
                                            Import
                                        </button>
                                    ) : (
                                        <button onClick={() => handleImportItem(item)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-md flex-shrink-0">
                                            Import
                                        </button>
                                    )}
                                </div>
                            )) : <p className="text-center text-slate-400">No items found.</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportFromHistoryModal;
