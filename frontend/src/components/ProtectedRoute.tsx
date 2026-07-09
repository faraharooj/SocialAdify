// D:\socialadify\frontend\src\components\ProtectedRoute.tsx
'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Ensure usePathname is imported
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, isAuthReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get the current path using the hook

  useEffect(() => {
    // Log current status for debugging this specific route protection
    console.log(`ProtectedRoute (${pathname}): Auth status - isAuthReady: ${isAuthReady}, isLoading: ${isLoading}, isAuthenticated: ${isAuthenticated}`);

    if (!isAuthReady) {
      console.log(`ProtectedRoute (${pathname}): Auth not ready yet, waiting...`);
      return; // Wait until initial auth status check is complete
    }

    // If initial auth check is done, not actively loading, and user is NOT authenticated
    if (!isLoading && !isAuthenticated) {
      console.log(`ProtectedRoute (${pathname}): Not authenticated, redirecting to login. Storing redirect path: ${pathname}`);
      // Store the current path (obtained from usePathname) to redirect back after login
      localStorage.setItem('redirectAfterLogin', pathname);
      router.push('/login');
    } else if (isAuthenticated) {
      console.log(`ProtectedRoute (${pathname}): User is authenticated.`);
    }
    // Add pathname to the dependency array as its value is used in the effect
  }, [isAuthenticated, isLoading, isAuthReady, router, pathname]);

  // If initial auth check is not ready OR an auth operation is actively in progress
  if (!isAuthReady || isLoading) {
    console.log(`ProtectedRoute (${pathname}): Showing loading UI (isAuthReady: ${isAuthReady}, isLoading: ${isLoading})`);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Loading page...</p>
        {/* You can add a spinner here */}
      </div>
    );
  }

  // If auth check is ready, and user is authenticated, render the children
  if (isAuthenticated) {
    console.log(`ProtectedRoute (${pathname}): Authenticated, rendering children.`);
    return <>{children}</>;
  }

  // This fallback should ideally not be reached if the useEffect redirect works correctly
  // when not authenticated and auth is ready. It means redirection is pending or failed.
  console.log(`ProtectedRoute (${pathname}): Fallback - not authenticated and not loading, rendering null (should have been redirected).`);
  return null; // Or a more explicit "Redirecting to login..." message
};

export default ProtectedRoute;
