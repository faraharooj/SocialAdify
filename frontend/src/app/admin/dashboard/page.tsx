// D:\socialadify\frontend\src\app\admin\dashboard\page.tsx
'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

// Icons for quick links (re-using from other files or defining new ones)
const UsersIcon = ({ className = "w-6 h-6" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /> </svg> );


// MODIFIED: LoadingSpinner color updated to indigo
const LoadingSpinner = ({ className = "animate-spin h-5 w-5 text-indigo-400" }: {className?: string}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export default function AdminDashboardPage() {
    const { user, isAuthReady, isAuthenticated } = useAuth();

    // MODIFIED: Define the dark pattern style (consistent with landing page)
    const darkPatternStyle = {
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 20px)',
        backgroundSize: '40px 40px',
    };

    if (!isAuthReady) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <LoadingSpinner className="w-12 h-12 text-indigo-400" /> {/* MODIFIED: Changed color */}
                <p className="ml-3 text-lg text-slate-300">Loading admin dashboard...</p>
            </div>
        );
    }

    if (!isAuthenticated || !user?.is_admin) {
        return (
            // MODIFIED: Changed colors to match landing page (indigo/purple/pink-ish)
            <div className="bg-indigo-900/30 border border-indigo-700 text-indigo-200 px-6 py-5 rounded-xl shadow-lg text-center mx-auto max-w-md mt-10">
                <p className="font-bold text-lg mb-2">Access Denied</p>
                <p>You do not have administrative privileges to view this page.</p>
                <Link href="/home" className="mt-4 inline-block text-indigo-300 hover:text-indigo-400 hover:underline"> {/* MODIFIED: Changed link colors */}
                    Go to Home
                </Link>
            </div>
        );
    }

    return (
        // MODIFIED: Wrap content in a div with relative positioning for the pattern
        <div className="relative overflow-hidden py-8 md:py-12"> {/* Added vertical padding */}
            {/* MODIFIED: Add background pattern */}
            <div className="absolute inset-0 z-0 opacity-20" style={darkPatternStyle}></div>

            <div className="relative z-10 space-y-10"> {/* Keep content above pattern */}
                <header className="text-center">
                    {/* MODIFIED: Changed H1 gradient to match landing page */}
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent pb-2">
                        Admin Dashboard
                    </h1>
                    <p className="mt-4 text-lg text-slate-300 max-w-3xl mx-auto">
                        Welcome, <span className="font-semibold text-indigo-300">{user?.firstname || 'Administrator'}</span>! {/* MODIFIED: Changed text color */}
                        Manage your SocialAdify platform from here.
                    </p>
                </header>

                <section className="grid grid-cols-1  gap-8 max-w-4xl mx-auto justify-items-center">
                    {/* User Management Card */}
                    <Link href="/admin/users" className="group block">
                        <div className="bg-slate-900 backdrop-blur-md shadow-2xl rounded-xl p-6 sm:p-8 border border-slate-800 hover:border-indigo-500/70 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-indigo-500/30"> {/* MODIFIED: Changed hover border/shadow colors */}
                            <div className="flex justify-center mb-4">
                                <UsersIcon className="w-12 h-12 text-indigo-400 group-hover:text-indigo-300 transition-colors" /> {/* MODIFIED: Changed icon colors */}
                            </div>
                            <h2 className="text-xl font-semibold text-slate-100 mb-2 text-center group-hover:text-indigo-300 transition-colors"> {/* MODIFIED: Changed hover text color */}
                                User Management
                            </h2>
                            <p className="text-sm text-slate-400 text-center leading-relaxed">
                                View, search, and delete user accounts. Maintain platform integrity.
                            </p>
                        </div>
                    </Link>

    
                </section>

                {/* Optional: Add a quick overview of stats if desired */}
                {/* <section className="max-w-4xl mx-auto mt-10">
                    <h2 className="text-2xl font-semibold text-slate-50 mb-6 text-center">Quick Overview</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-slate-800/70 p-6 rounded-xl shadow-lg border border-slate-700">
                            <h3 className="text-lg font-medium text-slate-200">Total Users</h3>
                            <p className="text-3xl font-bold text-orange-400 mt-2">123</p>
                        </div>
                        <div className="bg-slate-800/70 p-6 rounded-xl shadow-lg border border-slate-700">
                            <h3 className="text-lg font-medium text-slate-200">Active Campaigns</h3>
                            <p className="text-3xl font-bold text-yellow-400 mt-2">45</p>
                        </div>
                    </div>
                </section> */}
            </div>
        </div>
    );
}