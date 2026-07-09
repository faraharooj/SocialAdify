// D:\socialadify\frontend\src\app\account\layout.tsx
'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ReactNode, useState } from 'react'; // MODIFIED: Added useState import
import Image from 'next/image'; // Import Next.js Image component

// Re-using Icon components (kept local as per your request)
const UserIcon = ({ className = "w-8 h-8" }: { className?: string }) => ( // Adjusted fallback size
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 4C7.58172 4 4 7.58172 4 12C4 13.5997 4.50386 15.0774 5.34334 16.3099C6.71137 15.2006 8.55991 14.5 10.5 14.5H13.5C15.4401 14.5 17.2886 15.2006 18.6567 16.3099C19.4961 15.0774 20 13.5997 20 12C20 7.58172 16.4183 4 12 4ZM12 13C10.3431 13 9 11.6569 9 10C9 8.34315 10.3431 7 12 7C13.6569 7 15 8.34315 15 10C15 11.6569 13.6569 13 12 13ZM7.04979 18.3099C7.79979 17.373 8.96802 16.75 10.25 16.5521C10.4001 16.5209 10.5 16.3985 10.5 16.2431V16.2431C10.5 15.1385 11.3807 14.25 12.4853 14.25H13.5147C14.6193 14.25 15.5 15.1385 15.5 16.2431V16.2431C15.5 16.3985 15.5999 16.5209 15.75 16.5521C17.032 16.75 18.2002 17.373 18.9502 18.3099C17.5047 19.3667 15.702 20 13.75 20H10.25C8.29804 20 6.49531 19.3667 5.04979 18.3099L7.04979 18.3099Z"/></svg>
);
const SettingsIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.023c1.527-.879 3.433.676 2.555 2.203a1.724 1.724 0 001.023 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.023 2.573c.879 1.527-.676 3.433-2.203 2.555a1.724 1.724 0 00-2.573 1.023c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.023c-1.527.879-3.433-.676-2.555-2.203a1.724 1.724 0 00-1.023-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.023-2.573c-.879-1.527.676-3.433 2.203-2.555.996.573 2.267.156 2.573-1.023z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const LogoutIcon = ({className = "w-5 h-5"} : {className?: string}) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /> </svg> );

const API_BASE_URL_STATIC = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function AccountLayout({
    children,
}: {
    children: ReactNode;
}) {
    const { user, isAuthenticated, isAuthReady, logout } = useAuth();
    const [profileImageError, setProfileImageError] = useState(false); // MODIFIED: Added profileImageError state

    const profilePicUrl =
        user?.profile_picture_url && user.profile_picture_url.trim() !== ''
            ? (user.profile_picture_url.startsWith('http')
                ? user.profile_picture_url
                : `${API_BASE_URL_STATIC}${user.profile_picture_url}`)
            : null;

    return (
        <ProtectedRoute>
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-600 via-slate-800 to-slate-900 text-slate-100">
                <header className="bg-slate-700 backdrop-blur-lg shadow-xl sticky top-0 z-50 border-b border-slate-700/50">
                    <div className="w-full p-0">
                        <div className="flex items-center justify-between h-10 md:h-18 px-4 sm:px-6 lg:px-8">
                               <div className="flex items-center gap-2.5 select-none cursor-default">
                                <SettingsIcon className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-400" />
                                <span className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
                                    Settings and Activity
                                </span>
                            </div>
                            {isAuthReady && isAuthenticated && user && (
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <Link
                                        href="/account"
                                        className="flex items-center p-1 rounded-full hover:bg-slate-700/60 transition-colors group"
                                        title="My Account"
                                    >
                                        {/* MODIFIED: Use profileImageError state for conditional rendering */}
                                        {(profilePicUrl && !profileImageError) ? (
                                            <Image
                                                src={profilePicUrl}
                                                alt={user.firstname || 'User'}
                                                width={40}
                                                height={40}
                                                className="rounded-full object-cover ring-1 ring-slate-600 group-hover:ring-indigo-300 transition-all"
                                                onError={() => setProfileImageError(true)} // MODIFIED: Set error state on image load failure
                                            />
                                        ) : (
                                            <UserIcon className="h-8 w-8 text-slate-300 group-hover:text-indigo-300 transition-colors" />
                                        )}
                                        {user.firstname && (
                                            <span className="ml-2 text-xs sm:text-sm font-medium text-slate-200 group-hover:text-white transition-colors hidden md:block">
                                                {user.firstname}
                                            </span>
                                        )}
                                    </Link>
                                    <button
                                        onClick={logout}
                                        title="Logout"
                                        className="p-2 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                        aria-label="Logout"
                                    >
                                        <LogoutIcon className="h-5 w-5 sm:h-6 sm:w-6"/>
                                    </button>
                                </div>
                            )}
                        </div>
                       
                    </div>
                </header>
                <main className="flex-grow">
                    {children}
                </main>
                <footer className="bg-slate-900/30 border-t border-slate-700/50 text-center py-5 mt-auto">
                    <p className="text-xs text-slate-400">
                        © {new Date().getFullYear()} SocialAdify. Your Account Hub.
                    </p>
                </footer>
            </div>
        </ProtectedRoute>
    );
}