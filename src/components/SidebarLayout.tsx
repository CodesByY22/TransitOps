"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
} from "lucide-react";

interface SidebarLayoutProps {
  children: React.ReactNode;
  activeTab: string;
}

export default function SidebarLayout({ children, activeTab }: SidebarLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [searchVal, setSearchVal] = useState(searchParams.get("search") || "");

  // Sync state with URL parameter (for external resets/clears)
  useEffect(() => {
    setSearchVal(searchParams.get("search") || "");
  }, [searchParams]);

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
    }, 300);

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

  const menuItems = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { id: "fleet", label: "Fleet", href: "/fleet", icon: Truck },
    { id: "drivers", label: "Drivers", href: "/drivers", icon: Users },
    { id: "trips", label: "Trips", href: "/trips", icon: Route },
    { id: "maintenance", label: "Maintenance", href: "/maintenance", icon: Wrench },
    { id: "expenses", label: "Fuel & Expenses", href: "/expenses", icon: Fuel },
    { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-60 bg-[#09090b] border-r border-[#18181b] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="h-16 px-6 flex items-center gap-2.5 border-b border-[#18181b]">
            <div className="h-7 w-7 rounded bg-zinc-100 flex items-center justify-center font-bold text-sm text-black shadow-sm">
              T
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-tight text-zinc-100">TransitOps</h1>
              <p className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">Ops Engine</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-zinc-800/50 text-white font-semibold"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-[#18181b]">
          <button
            onClick={() => router.push("/login")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-all duration-200"
          >
            <LogOut className="h-4.5 w-4.5 text-zinc-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#09090b]">
        {/* Header */}
        <header className="h-16 border-b border-[#18181b] bg-[#09090b] px-8 flex items-center justify-between shrink-0">
          {/* Search bar */}
          <div className="relative w-80">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500" />
            </span>
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search assets, trips, drivers..."
              className="w-full h-9 bg-zinc-900/50 border border-[#27272a] rounded-lg pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all"
            />
          </div>

          {/* User profile */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-zinc-200">Raven K.</p>
              <p className="text-[10px] text-zinc-500 font-medium">Dispatcher</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-200">
              RK
            </div>
          </div>
        </header>

        {/* Content Box */}
        <main className="flex-1 overflow-y-auto bg-[#09090b]">
          {children}
        </main>
      </div>
    </div>
  );
}
