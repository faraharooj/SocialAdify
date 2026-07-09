//D:\socialadify\frontend\src\app\account\page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import React, { useState } from 'react';
import EditProfileModal from '@/components/EditProfileModal';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import DeleteAccountModal from '@/components/DeleteAccountModal';
import Image from 'next/image';
// Import icons from lucide-react for a modern look
import { 
    User, 
    Pencil, 
    Home, 
    History, 
    Link2, 
    LogOut, 
    KeyRound, 
    Trash2, 
    ChevronRight, 
    ShieldAlert 
} from 'lucide-react';

const API_BASE_URL_STATIC = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// A reusable component for settings list items
const SettingsItem = ({ 
    children, 
    onClick, 
    href,
    isDestructive = false
}: { 
    children: React.ReactNode, 
    onClick?: () => void, 
    href?: string,
    isDestructive?: boolean
}) => {
    const content = (
        <div className={`flex items-center justify-between p-4 ${isDestructive ? 'hover:bg-red-900/20' : 'hover:bg-slate-700/50'} transition-colors duration-150`}>
            {children}
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }
    return <button onClick={onClick} className="w-full text-left">{content}</button>;
};


export default function AccountPage() {
    const { user, logout, isAuthReady } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
    const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
    const [profileImageError, setProfileImageError] = useState(false);

    if (!isAuthReady) {
        return ( <div className="flex items-center justify-center min-h-screen"><p>Loading account...</p></div> );
    }

    const handleLogout = () => { logout(); };

    // Profile picture logic is unchanged
    const profilePicUrl =
        user?.profile_picture_url && user.profile_picture_url.trim() !== ''
            ? (user.profile_picture_url.startsWith('http')
                ? user.profile_picture_url
                : `${API_BASE_URL_STATIC}${user.profile_picture_url}`)
            : null;

    return (
        <>
            {/* Page container */}
            <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">

                    {/* Page Header */}
                    <div className="mb-10 md:mb-12 text-center sm:text-left">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-100 tracking-tight">
                            My Account
                        </h1>
                        <p className="mt-3 text-md text-slate-400">
                            Manage your profile, settings, and integrations.
                        </p>
                    </div>

                    {/* Profile Info Card */}
                    <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 mb-12 border border-slate-800">
                        <div className="flex flex-col sm:flex-row items-center">
                            <div className="flex-shrink-0 mb-6 sm:mb-0 sm:mr-8 relative">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-indigo-500/30 rounded-full flex items-center justify-center overflow-hidden">
                                    {(profilePicUrl && !profileImageError) ? (
                                        <Image
                                            key={profilePicUrl}
                                            src={profilePicUrl}
                                            alt={`${user?.firstname || ''} ${user?.lastname || ''}'s profile picture`}
                                            width={128}
                                            height={128}
                                            className="rounded-full object-cover w-full h-full"
                                            onError={() => setProfileImageError(true)}
                                            unoptimized={process.env.NODE_ENV === 'development'}
                                        />
                                    ) : (
                                        // Replaced custom SVG with Lucide icon
                                        <User className="w-16 h-16 sm:w-20 sm:h-20 text-indigo-300" />
                                    )}
                                </div>
                            </div>
                            <div className="text-center sm:text-left">
                                <h2 className="text-2xl sm:text-3xl font-semibold text-slate-100">
                                    {user?.firstname || 'Valued'} {user?.lastname || 'User'}
                                </h2>
                                <p className="text-md text-slate-400 mt-1">{user?.email}</p>
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    // Updated button style to match auth pages
                                    className="mt-4 inline-flex items-center text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors group font-medium"
                                >
                                    <Pencil className="w-3.5 h-3.5 mr-1.5 " />
                                    Edit Profile
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* --- Modernized Settings List --- */}
                    <div className="space-y-10">
                        
                        {/* General Settings */}
                        <div>
                            <h2 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-3">General</h2>
                            <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
                                <SettingsItem href="/home">
                                    <div className="flex items-center gap-3">
                                        <Home className="w-5 h-5 text-indigo-400" />
                                        <span className="text-sm font-medium text-slate-100">Home Hub</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-500" />
                                </SettingsItem>
                                <div className="border-t border-slate-700"></div>
                                <SettingsItem href="/history">
                                    <div className="flex items-center gap-3">
                                        <History className="w-5 h-5 text-indigo-400" />
                                        <span className="text-sm font-medium text-slate-100">Content History</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-500" />
                                </SettingsItem>
                                <div className="border-t border-slate-700"></div>
                                <SettingsItem href="/connections">
                                    <div className="flex items-center gap-3">
                                        <Link2 className="w-5 h-5 text-indigo-400" />
                                        <span className="text-sm font-medium text-slate-100">Connected Accounts</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-500" />
                                </SettingsItem>
                            </div>
                        </div>

                        {/* Security Settings */}
                        <div>
                            <h2 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-3">Security</h2>
                            <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
                                <SettingsItem onClick={() => setIsChangePasswordModalOpen(true)}>
                                    <div className="flex items-center gap-3">
                                        <KeyRound className="w-5 h-5 text-indigo-400" />
                                        <span className="text-sm font-medium text-slate-100">Change Password</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-500" />
                                </SettingsItem>
                            </div>
                        </div>

                        {/* --- Notification Section Removed --- */}

                        {/* Danger Zone */}
                        <div>
                            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase text-red-400 tracking-wider mb-3">
                                <ShieldAlert className="w-4 h-4" />
                                Danger Zone
                            </h2>
                            <div className="bg-slate-900 rounded-2xl border border-red-700/50 overflow-hidden">
                                <SettingsItem onClick={handleLogout} isDestructive={true}>
                                    <div className="flex items-center gap-3">
                                        <LogOut className="w-5 h-5 text-red-400" />
                                        <span className="text-sm font-medium text-red-300">Log Out</span>
                                    </div>
                                </SettingsItem>
                                <div className="border-t border-red-700/30"></div>
                                <SettingsItem onClick={() => setIsDeleteAccountModalOpen(true)} isDestructive={true}>
                                    <div className="flex items-center gap-3">
                                        <Trash2 className="w-5 h-5 text-red-400" />
                                        <span className="text-sm font-medium text-red-300">Delete Account</span>
                                    </div>
                                </SettingsItem>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* --- Modals (Unchanged) --- */}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                currentUser={user}
            />
            <ChangePasswordModal
                isOpen={isChangePasswordModalOpen}
                onClose={() => setIsChangePasswordModalOpen(false)}
            />
            <DeleteAccountModal
                isOpen={isDeleteAccountModalOpen}
                onClose={() => setIsDeleteAccountModalOpen(false)}
            />
        </>
    );
}