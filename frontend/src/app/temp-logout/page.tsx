// D:\socialadify\frontend\src\app\temp-logout\page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TemporaryLogoutPage() {
  const { logout, isAuthenticated, isAuthReady } = useAuth();
  const router = useRouter();

  // If auth is ready and user is not authenticated, redirect to login
  // This prevents showing the logout button to someone not logged in.
  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthReady, isAuthenticated, router]);

  const handleLogout = () => {
    logout(); // This will clear the token and redirect to /login via AuthContext
  };

  // Don't render anything until auth state is ready, or if not authenticated (will be redirected)
  if (!isAuthReady || !isAuthenticated) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <p className="text-gray-700">Loading authentication status...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Temporary Logout Page</h1>
        <p className="mb-4 text-gray-700">You are currently logged in.</p>
        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-150 ease-in-out"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
