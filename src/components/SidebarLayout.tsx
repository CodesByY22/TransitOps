"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeContext";
import { useToast } from "@/components/Toast";
import { logout } from "@/features/auth/actions";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  Search,
  LogOut,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

interface SidebarLayoutProps {
  children: React.ReactNode;
  activeTab: string;
}

interface UserSession {
  id: number;
  email: string;
  name: string;
  role: string;
}

export default function SidebarLayout({ children, activeTab }: SidebarLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [searchVal, setSearchVal] = useState(searchParams.get("search") || "");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "License Expiring Soon",
      description: "Driver John's license expires in 3 days.",
      color: "bg-amber-500",
    },
    {
      id: 2,
      title: "Maintenance Pending",
      description: "Vehicle MINI-03 scheduled service overdue.",
      color: "bg-rose-500",
    },
  ]);
  const [mounted, setMounted] = useState(false);

  // Sync state with URL parameter (for external resets/clears)
  useEffect(() => {
    setSearchVal(searchParams.get("search") || "");
  }, [searchParams]);

  // Read session cookie client-side
  useEffect(() => {
    setMounted(true);
    const sessionCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("session="))
      ?.split("=")[1];

    if (sessionCookie) {
      try {
        const decoded = decodeURIComponent(sessionCookie);
        const parsed = JSON.parse(decoded) as UserSession;
        setSession(parsed);
      } catch (e) {
        console.error("Failed to parse session cookie:", e);
      }
    }
  }, []);

  // Debounced search on change
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const currentQuery = searchParams.get("search") || "";
      const newQuery = searchVal.trim();
      
      if (currentQuery !== newQuery) {
        if (newQuery === "") {
          params.delete("search");
        } else {
          params.set("search", newQuery);
        }
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchVal, pathname, router, searchParams]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const params = new URLSearchParams(searchParams.toString());
      if (searchVal.trim() === "") {
        params.delete("search");
      } else {
        params.set("search", searchVal.trim());
      }
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    showToast("info", "Signed Out", "You have successfully signed out of TransitOps.");
    router.push("/login");
    router.refresh();
  };

  // Menu items list
  const allMenuItems = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { id: "fleet", label: "Fleet", href: "/fleet", icon: Truck },
    { id: "drivers", label: "Drivers", href: "/drivers", icon: Users },
    { id: "trips", label: "Trips", href: "/trips", icon: Route },
    { id: "maintenance", label: "Maintenance", href: "/maintenance", icon: Wrench },
    { id: "expenses", label: "Fuel & Expenses", href: "/expenses", icon: Fuel },
    { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", href: "/settings", icon: Settings },
  ];

  // Filter menu items by role access
  const allowedMenuItems = allMenuItems.filter((item) => {
    if (!session) return true; // Show all until loaded
    const role = session.role;
    if (role === "Fleet Manager") return true;
    if (role === "Dispatcher") {
      return ["dashboard", "fleet", "drivers", "trips", "maintenance"].includes(item.id);
    }
    if (role === "Safety Officer") {
      return ["dashboard", "fleet", "drivers", "maintenance"].includes(item.id);
    }
    if (role === "Financial Analyst") {
      return ["dashboard", "fleet", "expenses", "analytics"].includes(item.id);
    }
    return true;
  });

  // Breadcrumbs generation
  const pathParts = pathname.split("/").filter((x) => x);
  const breadcrumbs = [
    { label: "Home", href: "/dashboard" },
    ...pathParts.map((part, index) => {
      const href = "/" + pathParts.slice(0, index + 1).join("/");
      const label = part.charAt(0).toUpperCase() + part.slice(1);
      return { label, href };
    }),
  ];

  // Role Badge Styling
  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "Fleet Manager":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "Dispatcher":
        return "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20";
      case "Safety Officer":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "Financial Analyst":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
    }
  };

  const userName = mounted && session?.name ? session.name : "Mahavir Patel";
  const userRole = mounted && session?.role ? session.role : "Fleet Manager";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#070709] text-slate-800 dark:text-zinc-100 font-sans">
      {/* Sidebar */}
      <aside
        className={`${
          isCollapsed ? "w-20" : "w-64"
        } bg-white dark:bg-[#0B0F19] border-r border-slate-200 dark:border-[#1E293B] flex flex-col justify-between shrink-0 transition-all duration-300 relative z-30`}
      >
        <div>
          {/* Logo Section */}
          <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-[#1E293B]">
            <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-lg text-white shrink-0 shadow-md shadow-blue-500/20">
                T
              </div>
              {!isCollapsed && (
                <div className="animate-fade-in">
                  <h1 className="font-extrabold text-sm leading-tight tracking-tight dark:text-zinc-50">TransitOps</h1>
                  <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono tracking-wider uppercase">Enterprise SaaS</p>
                </div>
              )}
            </Link>

            {/* Toggle Collapse Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/60 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors hidden md:block"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {allowedMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group relative ${
                    isActive
                      ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 border-l-2 border-blue-500"
                      : "text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-blue-500" : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300"}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                  
                  {/* Tooltip for collapsed mode */}
                  {isCollapsed && (
                    <div className="absolute left-16 bg-slate-950 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap shadow-lg">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-slate-200 dark:border-[#1E293B] space-y-2 bg-slate-50/50 dark:bg-zinc-950/20">
          {!isCollapsed && (
            <div className="px-3.5 py-2 rounded-xl border border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${getRoleBadgeColor(userRole)}`}>
                {userInitials}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate dark:text-zinc-200">{userName}</p>
                <p className="text-[9px] font-mono text-slate-400 truncate mt-0.5">{userRole}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/15 transition-all duration-200 group relative"
          >
            <LogOut className="h-4.5 w-4.5 text-rose-500" />
            {!isCollapsed && <span>Sign Out</span>}
            {isCollapsed && (
              <div className="absolute left-16 bg-slate-950 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap shadow-lg">
                Sign Out
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-6 md:px-8 flex items-center justify-between shrink-0 transition-colors duration-200 relative z-20">
          
          {/* Left section: Breadcrumb & Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            <button className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500">
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <nav className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-400 dark:text-zinc-500">
              {breadcrumbs.map((breadcrumb, i) => (
                <React.Fragment key={`${breadcrumb.href}-${i}`}>
                  {i > 0 && <span className="select-none">/</span>}
                  <Link
                    href={breadcrumb.href}
                    className={`hover:text-slate-600 dark:hover:text-zinc-300 font-semibold transition-colors ${
                      i === breadcrumbs.length - 1 ? "text-slate-800 dark:text-zinc-300 font-extrabold" : ""
                    }`}
                  >
                    {breadcrumb.label}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Right section: Search, Notifications, Theme, Profile */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Search input */}
            <div className="relative hidden md:block w-64">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4.5 w-4.5 text-slate-400 dark:text-zinc-500" />
              </span>
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search resources, logs..."
                className="w-full h-9 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl pl-9 pr-4 text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-all font-semibold"
              />
            </div>

            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-[#1E293B] hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-500 hover:text-slate-700 dark:hover:text-zinc-200 transition-all cursor-pointer"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl border border-slate-200 dark:border-[#1E293B] hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-500 hover:text-slate-700 dark:hover:text-zinc-200 transition-all cursor-pointer relative"
              >
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-[#0B0F19]"></span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-slide-in">
                  <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-950/20">
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">Alert Center</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => {
                          setNotifications([]);
                          showToast("info", "Alerts Cleared", "All notifications have been cleared.");
                        }}
                        className="text-[10px] font-semibold text-blue-500 hover:text-blue-400 cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-60 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-zinc-800/20 text-xs flex gap-2">
                        <span className={`h-2 w-2 mt-1 rounded-full shrink-0 ${n.color}`}></span>
                        <div>
                          <p className="font-bold text-slate-700 dark:text-zinc-200">{n.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{n.description}</p>
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="p-6 text-center text-[11px] font-semibold text-slate-405 dark:text-zinc-500">
                        No new notifications.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Quick avatar monogram */}
            <div className="h-8.5 w-8.5 rounded-full border border-slate-200 dark:border-zinc-800/80 bg-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-sm shadow-blue-600/10">
              {userInitials}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#070709] transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
