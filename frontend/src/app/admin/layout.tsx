// D:\socialadify\frontend\src\app\admin\layout.tsx
'use client';

import { ReactNode, useState } from 'react'; // MODIFIED: Added useState import
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminProtectedRoute from '@/components/AdminProtectedRoute'; // We will create this next
import Image from 'next/image'; // MODIFIED: Added Image import
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
// Re-using Icon components (kept local as per your request)
const UserIcon = ({ className }: { className?: string }) => ( <svg className={className || "w-6 h-6"} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 4C7.58172 4 4 7.58172 4 12C4 13.5997 4.50386 15.0774 5.34334 16.3099C6.71137 15.2006 8.55991 14.5 10.5 14.5H13.5C15.4401 14.5 17.2886 15.2006 18.6567 16.3099C19.4961 15.0774 20 13.5997 20 12C20 7.58172 16.4183 4 12 4ZM12 13C10.3431 13 9 11.6569 9 10C9 8.34315 10.3431 7 12 7C13.6569 7 15 8.34315 15 10C15 11.6569 13.6569 13 12 13ZM7.04979 18.3099C7.79979 17.373 8.96802 16.75 10.25 16.5521C10.4001 16.5209 10.5 16.3985 10.5 16.2431V16.2431C10.5 15.1385 11.3807 14.25 12.4853 14.25H13.5147C14.6193 14.25 15.5 15.1385 15.5 16.2431V16.2431C15.5 16.3985 15.5999 16.5209 15.75 16.5521C17.032 16.75 18.2002 17.373 18.9502 18.3099C17.5047 19.3667 15.702 20 13.75 20H10.25C8.29804 20 6.49531 19.3667 5.04979 18.3099L7.04979 18.3099Z"/></svg> );
const AdminPanelIcon = ({ className = "w-8 h-8" }) => {
    return <Cog6ToothIcon className={className} />;
};

const LogoutIcon = ({className = "w-5 h-5"} : {className?: string}) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /> </svg> );
const DashboardIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /> <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /> </svg> );
const UsersIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /> </svg> );


const NavLink: React.FC<{ href: string; children: ReactNode; icon: React.ReactNode }> = ({ href, children, icon }) => {
    const pathname = usePathname();
    // MODIFIED: Updated isActive logic for better route matching
    const isActive = href === "/"
        ? pathname === "/"
        : (href === "/home" && pathname === "/") || pathname.startsWith(href);

    return (
        <Link href={href} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
            ${isActive ? 'bg-red-700 text-white' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'}`}>
            {icon}
            {children}
        </Link>
    );
};

export default function AdminLayout({
    children,
}: {
    children: ReactNode;
}) {
    const { user, isAuthenticated, isAuthReady, logout } = useAuth();
    const [profileImageError, setProfileImageError] = useState(false); // MODIFIED: Add this state

    const API_BASE_URL_STATIC = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'; // MODIFIED: Moved this inside the component

    const profilePicUrl =
        user?.profile_picture_url && user.profile_picture_url.trim() !== ''
            ? (user.profile_picture_url.startsWith('http')
                ? user.profile_picture_url
                : `${API_BASE_URL_STATIC}${user.profile_picture_url}`)
            : null;

    return (
        <AdminProtectedRoute>
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-600 via-slate-800 to-slate-900 text-slate-100">
                <header className="bg-slate-700 backdrop-blur-lg shadow-xl sticky top-0 z-50 border-b border-slate-700/50">
                    <div className="w-full p-0">
                        <div className="flex items-center justify-between h-10 md:h-18 px-4 sm:px-6 lg:px-8">
                               <div className="flex items-center gap-2.5 select-none cursor-default">
                                <Link href="/admin/dashboard" className="flex items-center gap-3 group">
                                    <AdminPanelIcon className="h-8 w-8 sm:h-9 sm:w-9 transition-transform duration-300 group-hover:rotate-[6deg] group-hover:scale-105" />
                                    <span className="text-xl sm:text-2xl font-bold text-slate-100 group-hover:text-red-400 transition-colors duration-300 tracking-tight">
                                        Admin Panel
                                    </span>
                                </Link>
                                <nav className="hidden md:flex items-center space-x-3 ml-8 lg:ml-10">
                                    <NavLink href="/admin/dashboard" icon={<DashboardIcon />}>Dashboard</NavLink>
                                    <NavLink href="/admin/users" icon={<UsersIcon />}>User Management</NavLink>
                                    {/* Add more admin links here as needed */}
                                </nav>
                            </div>

                            {isAuthReady && isAuthenticated && user?.is_admin && (
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Link
                                        href="/account"
                                        className="flex items-center p-2 rounded-lg hover:bg-slate-700/70 transition-colors group"
                                        title="My Account"
                                    >
                                        {/* MODIFIED: Conditional rendering based on profilePicUrl and profileImageError */}
                                        {(profilePicUrl && !profileImageError) ? (
                                            <Image
                                                src={profilePicUrl}
                                                alt={user.firstname || 'User'}
                                                width={40} // Set to 40x40
                                                height={40}
                                                className="rounded-full object-cover ring-1 ring-slate-600 group-hover:ring-red-400 transition-all"
                                                onError={() => setProfileImageError(true)} // MODIFIED: Set error state on image load failure
                                            />
                                        ) : (
                                            <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 group-hover:text-red-400 transition-colors" />
                                        )}
                                        {user?.firstname && (
                                            <span className="ml-1.5 text-xs sm:text-sm font-medium text-slate-300 group-hover:text-white transition-colors hidden md:block">
                                                {user.firstname}
                                            </span>
                                        )}
                                    </Link>
                                    <button
                                        onClick={logout}
                                        title="Logout"
                                        className="p-2 rounded-lg hover:bg-slate-700/70 text-slate-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-70"
                                        aria-label="Logout"
                                    >
                                        <LogoutIcon className="h-5 w-5 sm:h-6 sm:w-6"/>
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Mobile Navigation */}
                        <div className="md:hidden flex items-center justify-center space-x-3 py-2 border-t border-slate-700/30">
                            <NavLink href="/admin/dashboard" icon={<DashboardIcon />}>Dashboard</NavLink>
                            <NavLink href="/admin/users" icon={<UsersIcon />}>Users</NavLink>
                        </div>
                    </div>
                </header>

                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    {children}
                </main>

                <footer className="bg-slate-900/60 border-t border-red-700/50 text-center py-6 mt-auto">
                    <p className="text-xs text-slate-500">
                        © {new Date().getFullYear()} SocialAdify Admin Panel.
                    </p>
                </footer>
            </div>
        </AdminProtectedRoute>
    );
}