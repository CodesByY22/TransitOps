"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0c] text-zinc-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#121214] border-r border-[#1a1a1e] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="p-6 flex items-center gap-3 border-b border-[#1a1a1e]">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg text-white">
              T
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wide">TransitOps</h1>
              <p className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">Operations Hub</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600/10 text-blue-500 border-l-2 border-blue-500"
                      : "text-zinc-400 hover:bg-[#1a1a1e] hover:text-zinc-200"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-blue-500" : "text-zinc-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-[#1a1a1e]">
          <button
            onClick={() => router.push("/login")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:bg-[#1a1a1e] hover:text-zinc-200 transition-all duration-200"
          >
            <LogOut className="h-5 w-5 text-zinc-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-[#1a1a1e] bg-[#121214] px-8 flex items-center justify-between shrink-0">
          {/* Search bar */}
          <div className="relative w-80">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500" />
            </span>
            <input
              type="text"
              placeholder="Search assets, trips, drivers..."
              className="w-full h-10 bg-[#1a1a1e] border border-[#26262b] rounded-lg pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* User profile */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-zinc-200">Raven K.</p>
              <p className="text-[10px] text-zinc-500 font-medium">Dispatcher</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-sm text-blue-500">
              RK
            </div>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="flex-1 overflow-y-auto bg-[#0a0a0c]">
          {children}
        </main>
      </div>
    </div>
  );
}
