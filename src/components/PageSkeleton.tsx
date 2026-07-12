import React from "react";

interface PageSkeletonProps {
  layoutType?: "grid" | "split" | "table" | "form";
}

export default function PageSkeleton({ layoutType = "table" }: PageSkeletonProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#070709] text-slate-800 dark:text-zinc-100 font-sans">
      {/* Sidebar Skeleton */}
      <aside className="w-64 bg-white dark:bg-[#0B0F19] border-r border-slate-200 dark:border-[#1E293B] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Section */}
          <div className="p-4 flex items-center gap-3 border-b border-slate-200 dark:border-[#1E293B]">
            <div className="h-9 w-9 rounded-xl bg-blue-600/20 animate-pulse"></div>
            <div className="space-y-1.5 flex-1">
              <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-24 animate-pulse"></div>
              <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded w-12 animate-pulse"></div>
            </div>
          </div>
          {/* Navigation Links */}
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-10 bg-slate-100/80 dark:bg-zinc-800/30 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-[#1E293B]">
          <div className="h-10 bg-slate-100/80 dark:bg-zinc-800/30 rounded-xl animate-pulse"></div>
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Skeleton */}
        <header className="h-16 border-b border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-6 md:px-8 flex items-center justify-between shrink-0">
          <div className="h-9 bg-slate-100 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl w-64 animate-pulse"></div>
          <div className="flex items-center gap-3">
            <div className="h-8.5 w-8.5 rounded-full bg-slate-200 dark:bg-zinc-850 animate-pulse"></div>
          </div>
        </header>

        {/* Page Content Skeleton */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50 dark:bg-[#070709]">
          {/* Header Row Skeleton */}
          <div className="space-y-2">
            <div className="h-7 bg-slate-200 dark:bg-zinc-800 rounded w-48 animate-pulse"></div>
            <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-64 animate-pulse"></div>
          </div>

          {layoutType === "table" && (
            <div className="space-y-4">
              <div className="h-10 bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-xl animate-pulse"></div>
              <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-slate-100/50 dark:bg-zinc-800/30 rounded-xl animate-pulse"></div>
                ))}
              </div>
            </div>
          )}

          {layoutType === "split" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-10 bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-xl animate-pulse"></div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-36 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl animate-pulse"></div>
                ))}
              </div>
              <div className="h-[500px] bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl animate-pulse"></div>
            </div>
          )}

          {layoutType === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-44 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl animate-pulse"></div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
