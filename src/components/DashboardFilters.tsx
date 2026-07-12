"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
    <div className="flex flex-wrap items-center gap-4 bg-zinc-950/20 p-4 rounded-xl border border-[#18181b]">
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Vehicle Type</label>
        <select
          value={currentType}
          onChange={(e) => handleFilterChange("type", e.target.value)}
          className="bg-[#09090b] border border-[#27272a] hover:border-zinc-700 text-zinc-200 text-xs rounded-lg h-9 px-3 min-w-[150px] focus:outline-none focus:border-zinc-500 cursor-pointer transition"
        >
          <option value="All">All Types</option>
          <option value="Van">Van</option>
          <option value="Truck">Truck</option>
          <option value="Mini">Mini</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Status</label>
        <select
          value={currentStatus}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="bg-[#09090b] border border-[#27272a] hover:border-zinc-700 text-zinc-200 text-xs rounded-lg h-9 px-3 min-w-[150px] focus:outline-none focus:border-zinc-500 cursor-pointer transition"
        >
          <option value="All">All Statuses</option>
          <option value="Available">Available</option>
          <option value="On Trip">On Trip</option>
          <option value="In Shop">In Shop</option>
          <option value="Retired">Retired</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Region</label>
        <select
          value={currentRegion}
          onChange={(e) => handleFilterChange("region", e.target.value)}
          className="bg-[#09090b] border border-[#27272a] hover:border-zinc-700 text-zinc-200 text-xs rounded-lg h-9 px-3 min-w-[150px] focus:outline-none focus:border-zinc-500 cursor-pointer transition"
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
        className="mt-5 h-9 px-4 text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-[#09090b] border border-[#27272a] hover:border-zinc-700 rounded-lg transition"
      >
        Clear Filters
      </button>
    </div>
  );
}
