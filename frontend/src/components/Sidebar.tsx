"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  HomeIcon,
  UserIcon,
  WifiIcon,
  PhotoIcon,
  PencilSquareIcon,
  CalendarDaysIcon,
  ChartPieIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  ArrowLeftEndOnRectangleIcon,
  Bars3Icon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/solid";

const modules = [
  { name: "Dashboard", href: "/maindashboard", icon: HomeIcon },
  { name: "User Profile", href: "/account", icon: UserIcon },
  { name: "Account Sync", href: "/connections", icon: WifiIcon },
  { name: "Post/Ad Generation", href: "/post-generator", icon: PhotoIcon },
  { name: "Caption Generation", href: "/caption-generator", icon: PencilSquareIcon },
  { name: "Post Scheduling", href: "/scheduler", icon: CalendarDaysIcon },
  { name: "Insights & Metrics", href: "/social-insights", icon: ChartPieIcon },
  { name: "Ad Placement", href: "/ad-creator", icon: LightBulbIcon },
  { name: "InsightAd AI", href: "/dashboard", icon: PresentationChartLineIcon },
  { name: "Admin Panel", href: "/admin/dashboard", icon: ShieldCheckIcon },
];

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  // --- FIX: Destructure 'user' from useAuth ---
  const { user, logout } = useAuth();

  // --- FIX: Filter modules based on permissions ---
  const visibleModules = modules.filter((item) => {
    // If the item is the Admin Panel, check if the user is an admin
    if (item.name === "Admin Panel") {
      // Ensure user exists and is_admin is explicitly true
      return user && user.is_admin === true;
    }
    // Show all other modules by default
    return true;
  });

  return (
    <div
      className={`${
        isOpen ? "w-64" : "w-20"
      } flex flex-col bg-slate-900 border-r border-slate-700 h-screen sticky top-0 transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {isOpen && (
          <span className="text-2xl font-bold text-blue-400">
            SocialAdify
          </span>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-grow p-3 space-y-1">
        {/* --- FIX: Map over 'visibleModules' instead of 'modules' --- */}
        {visibleModules.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const baseClasses =
            "flex items-center p-3 rounded-xl transition-all duration-200 text-sm font-medium";
          const activeClasses =
            "bg-slate-500 text-white shadow-lg shadow-slate-500/30";
          const inactiveClasses =
            "text-slate-300 hover:bg-slate-700/50 hover:text-orange-400";

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`${baseClasses} ${
                isActive ? activeClasses : inactiveClasses
              }`}
            >
              <item.icon className="w-5 h-5 min-w-[20px]" />
              {isOpen && <span className="ml-3">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={logout}
          title="Logout"
          className="w-full flex items-center p-3 text-sm font-medium text-red-400 rounded-xl hover:bg-red-900/40 transition-colors"
        >
          <ArrowLeftEndOnRectangleIcon className="w-5 h-5 min-w-[20px]" />
          {isOpen && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;