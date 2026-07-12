"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

export default function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentType = searchParams.get("type") || "All";
  const currentStatus = searchParams.get("status") || "All";
  const currentRegion = searchParams.get("region") || "All";

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "All") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-[#0B0F19] p-4 rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-sm transition-colors mb-6">
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-550">Vehicle Type</label>
        <select
          value={currentType}
          onChange={(e) => handleFilterChange("type", e.target.value)}
          className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-250 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs rounded-xl h-10 px-3 min-w-[150px] focus:outline-none focus:border-blue-500 cursor-pointer font-bold"
        >
          <option value="All">All Types</option>
          <option value="Van">Van</option>
          <option value="Truck">Truck</option>
          <option value="Mini">Mini</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-550">Status</label>
        <select
          value={currentStatus}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-255 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs rounded-xl h-10 px-3 min-w-[150px] focus:outline-none focus:border-blue-500 cursor-pointer font-bold"
        >
          <option value="All">All Statuses</option>
          <option value="Available">Available</option>
          <option value="On Trip">On Trip</option>
          <option value="In Shop">In Shop</option>
          <option value="Retired">Retired</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-550">Region</label>
        <select
          value={currentRegion}
          onChange={(e) => handleFilterChange("region", e.target.value)}
          className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-255 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs rounded-xl h-10 px-3 min-w-[150px] focus:outline-none focus:border-blue-500 cursor-pointer font-bold"
        >
          <option value="All">All Regions</option>
          <option value="North">North</option>
          <option value="South">South</option>
          <option value="East">East</option>
          <option value="West">West</option>
        </select>
      </div>

      <button
        onClick={() => router.push("/dashboard")}
        className="mt-5 h-10 px-4 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 bg-slate-50 dark:bg-zinc-900/50 border border-slate-255 dark:border-zinc-800 rounded-xl transition cursor-pointer"
      >
        Clear Filters
      </button>
    </div>
  );
}
