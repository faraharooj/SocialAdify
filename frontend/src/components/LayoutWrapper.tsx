"use client";

import { usePathname } from 'next/navigation';
import Sidebar from "@/components/Sidebar";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // 1. Define the routes where the sidebar should NOT be shown
  const NO_SIDEBAR_PATHS = ['/', '/signup', '/login','/forgot-password'];
  
  // 2. Check if the current path matches any excluded path
  const shouldShowSidebar = !NO_SIDEBAR_PATHS.includes(pathname);

  // Note on Styling: 
  // By keeping the parent div as 'flex' and the main content as 'flex-1', 
  // the main content will automatically take up the full screen width 
  // when the Sidebar is not rendered.
  
  return (
    // FLEX CONTAINER
    <div className="flex min-h-screen w-screen bg-gray-100 text-gray-900 overflow-hidden">
      
      {/* Sidebar - CONDITIONAL RENDERING */}
      {shouldShowSidebar && <Sidebar />}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-screen m-0 p-0 overflow-auto bg-white">
        {children}
      </main>
    </div>
  );
}