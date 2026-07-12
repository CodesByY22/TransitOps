import React from "react";

export default function DashboardLoading() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070709] text-zinc-100 font-sans">
      {/* Sidebar Skeleton */}
      <aside className="w-64 bg-[#0c0c0e] border-r border-zinc-900 flex flex-col justify-between shrink-0">
        <div className="p-6 border-b border-zinc-900 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-zinc-800 animate-pulse"></div>
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-zinc-800 rounded w-24 animate-pulse"></div>
            <div className="h-2.5 bg-zinc-800 rounded w-16 animate-pulse"></div>
          </div>
        </div>
        <div className="p-4 space-y-3 flex-1 mt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-10 bg-zinc-800/60 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Skeleton */}
        <header className="h-16 border-b border-zinc-900 bg-[#0c0c0e] px-8 flex items-center justify-between shrink-0">
          <div className="h-10 bg-zinc-800 rounded-lg w-80 animate-pulse"></div>
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <div className="h-3.5 bg-zinc-800 rounded w-16 animate-pulse"></div>
              <div className="h-2 bg-zinc-800 rounded w-12 animate-pulse"></div>
            </div>
            <div className="h-10 w-10 rounded-full bg-zinc-800 animate-pulse"></div>
          </div>
        </header>

        {/* Page Content Skeleton */}
        <main className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#070709]">
          {/* Header Row Skeleton */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-7 bg-zinc-800 rounded w-48 animate-pulse"></div>
              <div className="h-3 bg-zinc-800 rounded w-64 animate-pulse"></div>
            </div>
            <div className="h-6 bg-zinc-800 rounded-full w-24 animate-pulse"></div>
          </div>

          {/* Filters Skeleton */}
          <div className="h-20 bg-zinc-900/50 border border-zinc-900 rounded-xl animate-pulse"></div>

          {/* KPI Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-28 bg-zinc-900/50 border border-zinc-900 rounded-2xl animate-pulse"></div>
            ))}
          </div>

          {/* Split Pane Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-zinc-900/50 border border-zinc-900 rounded-2xl animate-pulse"></div>
            <div className="h-96 bg-zinc-900/50 border border-zinc-900 rounded-2xl animate-pulse"></div>
          </div>
        </main>
      </div>
    </div>
  );
}
