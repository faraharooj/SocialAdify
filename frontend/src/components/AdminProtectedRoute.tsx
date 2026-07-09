// D:\socialadify\frontend\src\components\AdminProtectedRoute.tsx
'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Assuming AuthContext provides user.is_admin

interface AdminProtectedRouteProps {
  children: ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, isAuthReady, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log(`AdminProtectedRoute (${pathname}): Auth status - isAuthReady: ${isAuthReady}, isLoading: ${isLoading}, isAuthenticated: ${isAuthenticated}, is_admin: ${user?.is_admin}`);

    if (!isAuthReady || isLoading) {
      // Still loading initial auth state or an auth operation is in progress
      console.log(`AdminProtectedRoute (${pathname}): Auth not ready or loading, waiting...`);
      return;
    }

    if (!isAuthenticated) {
      // Not authenticated at all, redirect to login
      console.log(`AdminProtectedRoute (${pathname}): Not authenticated, redirecting to login.`);
      localStorage.setItem('redirectAfterLogin', pathname); // Save intended path
      router.replace('/login');
      return;
    }

    if (!user?.is_admin) {
      // Authenticated but not an admin, redirect to home or access denied page
      console.log(`AdminProtectedRoute (${pathname}): Authenticated but NOT an admin. Redirecting to /home.`);
      // Optionally, you could redirect to a specific "/access-denied" page
      router.replace('/home'); // Redirect non-admins away from admin routes
      return;
    }

    // If we reach here, user is authenticated and is an admin
    console.log(`AdminProtectedRoute (${pathname}): User is authenticated and is an admin. Rendering children.`);

  }, [isAuthenticated, isLoading, isAuthReady, user, router, pathname]);

  // Show a loading state while authentication and admin status are being determined
  if (!isAuthReady || isLoading || !isAuthenticated || !user?.is_admin) {
    // We render a loading spinner or null while the redirect effect takes place
    // This prevents flashing unauthorized content.
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-300">
        <p className="text-lg">Verifying admin access...</p>
        {/* You can add a spinner here */}
      </div>
    );
  }

  // If we reach here, it means the user is authenticated AND is an admin,
  // and the useEffect above did not trigger a redirect.
  return <>{children}</>;
};

export default AdminProtectedRoute;
