// D:\socialadify\frontend\src\app\admin\users\page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchAllUsers, deleteUser, fetchUsersCount } from '@/services/adminService'; // MODIFIED: Imported fetchUsersCount
import { UserPublic } from '@/services/authService'; // Re-use UserPublic schema
import Link from 'next/link';

// --- NEW: Placeholder for DeleteUserConfirmationModal ---
// You will need to create this component in a file like:
// D:\socialadify\frontend\src\components\DeleteUserConfirmationModal.tsx
// This modal should accept `isOpen`, `onClose`, `onConfirm`, and `user` props.
interface DeleteUserConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    user: UserPublic | null; // Pass the user to display their details in the modal
}

const DeleteUserConfirmationModal: React.FC<DeleteUserConfirmationModalProps> = ({ isOpen, onClose, onConfirm, user }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full text-center border border-slate-700">
                <h3 className="text-xl font-bold text-red-400 mb-4">Confirm User Deletion</h3>
                <p className="text-slate-300 mb-6">
                    Are you sure you want to delete user:
                    <br />
                    <span className="font-semibold text-orange-300">
                        {user ? `${user.firstname} ${user.lastname} (${user.email})` : 'this user'}
                    </span>
                    ? This action cannot be undone.
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-5 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};
// --- END NEW: Placeholder for DeleteUserConfirmationModal ---


// Icons (you might centralize these further)
const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /> </svg> );
const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.927a2.25 2.25 0 01-2.244-2.077L5.09 5.93c-.3-.058-.6-.117-.9-.176M4.5 5.25a2.25 2.25 0 012.25-2.25h1.5A2.25 2.25 0 0112 5.25m-3 0h3.75m-3.75 0V7.5m-3-3h3.75m-3.75 0V7.5" /> </svg> );
const UserGroupIcon = ({ className = "w-12 h-12" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-3.741-3.741M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 10.5a3 3 0 11-6 0 3 3 0 016 0zM12 20.25a6.75 6.75 0 00-6.75-6.75H6A6.75 6.75 0 0112 20.25z" /> </svg> );
const LoadingSpinner = ({ className = "animate-spin h-5 w-5 text-red-400" }: {className?: string}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const ITEMS_PER_PAGE = 10;

export default function UserManagementPage() {
    const { token, logout, isAuthReady, isAuthenticated, user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserPublic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);

    // --- NEW: State for Delete Confirmation Modal ---
    const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserPublic | null>(null);
    // --- END NEW State ---

    const fetchUsers = useCallback(async (page: number, search: string) => {
        if (!token) {
            setError("Authentication required.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const fetchedUsers = await fetchAllUsers(token, page * ITEMS_PER_PAGE, ITEMS_PER_PAGE, search);
            setUsers(fetchedUsers);

            // MODIFIED: Use the actual fetchUsersCount
            // NOTE: You need to ensure fetchUsersCount is imported from adminService.ts
            // and that your backend has a /admin/users/count endpoint.
            // If not, keep the temporary estimation or implement the backend endpoint.
            const count = await fetchUsersCount(token, search);
            setTotalUsers(count);

            // REMOVED: Temporary estimation for totalUsers if fetchUsersCount is not used yet
            // if (fetchedUsers.length < ITEMS_PER_PAGE) {
            //     setTotalUsers(page * ITEMS_PER_PAGE + fetchedUsers.length);
            // } else {
            //     setTotalUsers((page + 2) * ITEMS_PER_PAGE);
            // }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load users.";
            setError(errorMessage);
            if (errorMessage.toLowerCase().includes("unauthorized") || errorMessage.toLowerCase().includes("forbidden")) {
                logout(); // Redirect to login if unauthorized or forbidden
            }
        } finally {
            setIsLoading(false);
        }
    }, [token, logout]);

    useEffect(() => {
        if (isAuthReady && isAuthenticated && currentUser?.is_admin) {
            fetchUsers(currentPage, searchQuery);
        } else if (isAuthReady && (!isAuthenticated || !currentUser?.is_admin)) {
            // Handled by AdminProtectedRoute, but good to have a fallback message
            setError("Access Denied: You must be an administrator to view this page.");
            setIsLoading(false);
        }
    }, [isAuthReady, isAuthenticated, currentUser, currentPage, searchQuery, fetchUsers]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(0); // Reset to first page on new search
    };

    // --- MODIFIED: handleDelete to open modal ---
    const handleDelete = async (userId: string, userName: string) => {
        if (currentUser?.id === userId) {
            setError("You cannot delete your own admin account.");
            return;
        }

        // Set the user to be deleted and open the confirmation modal
        setUserToDelete(users.find(u => u.id === userId) || null);
        setIsDeleteConfirmModalOpen(true);
    };

    // --- NEW: confirmDeleteUser function for modal callback ---
    const confirmDeleteUser = async () => {
        if (!userToDelete || !token) {
            return; // Should not happen if modal is opened correctly
        }

        setIsDeleteConfirmModalOpen(false); // Close the modal immediately
        setIsLoading(true); // Show general loading for the deletion process
        setError(null);

        try {
            await deleteUser(token, userToDelete.id);
            // Refresh the list after deletion, staying on the current page or going back if last item on page
            // Recalculate current page if necessary (e.g., if the last item on a page was deleted)
            let newPage = currentPage;
            // If the last item on the current page was deleted and we're not on the first page,
            // go back one page if the total users after deletion makes the current page empty.
            if (users.length === 1 && currentPage > 0 && totalUsers - 1 <= currentPage * ITEMS_PER_PAGE) {
                 newPage = currentPage - 1;
            }
            setCurrentPage(newPage);
            fetchUsers(newPage, searchQuery); // Re-fetch data
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to delete user.";
            setError(errorMessage);
            if (errorMessage.toLowerCase().includes("unauthorized") || errorMessage.toLowerCase().includes("forbidden")) {
                logout();
            }
        } finally {
            setIsLoading(false);
            setUserToDelete(null); // Clear the user to delete
        }
    };
    // --- END NEW function ---


    if (!isAuthReady || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <LoadingSpinner className="w-12 h-12 text-red-400" />
                <p className="ml-3 text-lg text-slate-300">Loading users...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900/30 border border-red-700 text-red-200 px-6 py-5 rounded-xl shadow-lg text-center mx-auto max-w-md mt-10">
                <p className="font-bold text-lg mb-2">Error:</p>
                <p>{error}</p>
                {error.toLowerCase().includes("unauthorized") || error.toLowerCase().includes("forbidden") && (
                    <Link href="/login" className="mt-4 inline-block text-red-300 hover:underline">
                        Go to Login
                    </Link>
                )}
            </div>
        );
    }

    if (!currentUser?.is_admin) {
        // This case should ideally be caught by AdminProtectedRoute, but good for explicit message
        return (
            <div className="bg-red-900/30 border border-red-700 text-red-200 px-6 py-5 rounded-xl shadow-lg text-center mx-auto max-w-md mt-10">
                <p className="font-bold text-lg mb-2">Access Denied</p>
                <p>You do not have administrative privileges to view this page.</p>
                <Link href="/home" className="mt-4 inline-block text-red-300 hover:underline">
                    Go to Home
                </Link>
            </div>
        );
    }


    return (
        <>
            <div className="space-y-8">
                <header className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-sky-800 tracking-tight bg-gradient-to-r from-red-400 via-sky-400 to-yellow-400 bg-clip-text text-transparent pb-2">
                        User Management
                    </h1>
                    <p className="mt-4 text-lg text-slate-300 max-w-3xl mx-auto">
                        View, search, and manage user accounts on SocialAdify.
                    </p>
                </header>

                <section className="bg-slate-800/70 backdrop-blur-md shadow-2xl rounded-xl p-6 sm:p-8 border border-slate-700 max-w-4xl mx-auto">
                    <div className="flex items-center space-x-3 mb-6">
                        <SearchIcon className="w-6 h-6 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by email, first name, or last name..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="flex-grow px-4 py-2.5 text-sm border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition bg-slate-700/50 text-slate-100 placeholder-slate-400"
                        />
                    </div>

                    {users.length === 0 && !isLoading && (
                        <div className="text-center py-10">
                            <UserGroupIcon className="mx-auto h-16 w-16 text-slate-500 mb-4" />
                            <h3 className="mt-2 text-lg font-medium text-slate-300">No users found</h3>
                            <p className="mt-1 text-sm text-slate-400">
                                {searchQuery ? `No users match your search for "${searchQuery}".` : "There are no users registered yet."}
                            </p>
                        </div>
                    )}

                    {users.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-slate-700 shadow-lg">
                            <table className="min-w-full divide-y divide-slate-700">
                                <thead className="bg-slate-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Admin
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-slate-800 divide-y divide-slate-700">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-700/80 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                                                {user.firstname} {user.lastname}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {user.is_admin ? (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        Yes
                                                    </span>
                                                ) : (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                        No
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleDelete(user.id, `${user.firstname} ${user.lastname}`)}
                                                    className="text-red-400 hover:text-red-500 px-3 py-1.5 rounded-md hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={isLoading || user.id === currentUser?.id} // Prevent deleting self
                                                    title={user.id === currentUser?.id ? "Cannot delete your own account" : "Delete User"}
                                                >
                                                    <TrashIcon className="inline-block w-4 h-4 mr-1" />
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center mt-6">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                            disabled={currentPage === 0 || isLoading}
                            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-slate-400">Page {currentPage + 1}</span>
                        <button
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={users.length < ITEMS_PER_PAGE || isLoading || (currentPage + 1) * ITEMS_PER_PAGE >= totalUsers}
                            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </section>
            </div>
            {/* NEW: Delete User Confirmation Modal */}
            <DeleteUserConfirmationModal
                isOpen={isDeleteConfirmModalOpen}
                onClose={() => {
                    setIsDeleteConfirmModalOpen(false);
                    setUserToDelete(null); // Clear selected user if user cancels
                }}
                onConfirm={confirmDeleteUser}
                user={userToDelete}
            />
        </>
    );
}