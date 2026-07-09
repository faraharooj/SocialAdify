'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { fetchNotifications, markAllNotificationsRead, NotificationItem } from '@/services/notificationService';

export default function NotificationBell() {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const loadData = async () => {
        if (!token) return;
        try {
            const data = await fetchNotifications(token);
            setNotifications(data);
        } catch (err) {
            console.error("Failed to load notifications", err);
        }
    };

    // Initial load + Poll every 60 seconds to check for completed posts
    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 60000);
        return () => clearInterval(interval);
    }, [token]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOpen = async () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0 && token) {
            // Mark as read locally immediately for better UX
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            // Sync with backend
            await markAllNotificationsRead(token);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleOpen}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-slate-800 animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                        <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
                        <span className="text-xs text-slate-500">{notifications.length} Recent</span>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                No notifications yet.
                            </div>
                        ) : (
                            notifications.map((note) => (
                                <div 
                                    key={note._id} 
                                    className={`p-4 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${!note.is_read ? 'bg-indigo-900/10' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                            note.type === 'success' ? 'bg-green-400' : 
                                            note.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
                                        }`} />
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-200 leading-snug">{note.message}</p>
                                            <p className="text-xs text-slate-500 mt-1.5">{formatTime(note.created_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}