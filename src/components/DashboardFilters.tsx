"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

interface CustomSelectProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

function CustomSelect({ label, value, options, onChange, disabled }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="flex flex-col gap-1.5 relative min-w-[160px] flex-1 sm:flex-initial" ref={containerRef}>
      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 select-none">
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs rounded-xl h-10 px-3.5 font-bold w-full transition-all hover:bg-slate-100/70 dark:hover:bg-zinc-800/30 text-left disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-blue-500/50"
      >
        <span className="truncate">{selectedOption.label}</span>
        <svg
          className={`h-4 w-4 text-slate-400 dark:text-zinc-500 transition-transform duration-200 shrink-0 ml-1 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-[62px] left-0 w-full bg-white dark:bg-[#111625] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-slide-in">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors font-bold flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-blue-600/10 text-blue-600 dark:text-blue-400"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/30 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <svg className="h-3.5 w-3.5 text-blue-500 shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

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
    
    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`);
    });
  };

  const handleClearFilters = () => {
    startTransition(() => {
      router.push("/dashboard");
    });
  };

  const typeOptions = [
    { label: "All Types", value: "All" },
    { label: "Van", value: "Van" },
    { label: "Truck", value: "Truck" },
    { label: "Mini", value: "Mini" },
  ];

  const statusOptions = [
    { label: "All Statuses", value: "All" },
    { label: "Available", value: "Available" },
    { label: "On Trip", value: "On Trip" },
    { label: "In Shop", value: "In Shop" },
    { label: "Retired", value: "Retired" },
  ];

  const regionOptions = [
    { label: "All Regions", value: "All" },
    { label: "North", value: "North" },
    { label: "South", value: "South" },
    { label: "East", value: "East" },
    { label: "West", value: "West" },
  ];

  return (
    <div className="relative flex flex-wrap items-end gap-4 bg-white dark:bg-[#0B0F19] p-5 rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-sm transition-colors mb-6">
      {/* Inline styling for loading bar animation */}
      <style>{`
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(-10%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loadingBar 1.5s infinite ease-in-out;
        }
      `}</style>

      {/* Transition Top Loading Indicator Bar */}
      {isPending && (
        <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden bg-blue-500/10 z-10">
          <div className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-teal-500 animate-loading-bar w-[60%]"></div>
        </div>
      )}

      {/* Selectors */}
      <CustomSelect
        label="Vehicle Type"
        value={currentType}
        options={typeOptions}
        onChange={(val) => handleFilterChange("type", val)}
        disabled={isPending}
      />

      <CustomSelect
        label="Status"
        value={currentStatus}
        options={statusOptions}
        onChange={(val) => handleFilterChange("status", val)}
        disabled={isPending}
      />

      <CustomSelect
        label="Region"
        value={currentRegion}
        options={regionOptions}
        onChange={(val) => handleFilterChange("region", val)}
        disabled={isPending}
      />

      {/* Actions & Feedback */}
      <div className="flex items-center gap-3 ml-auto self-end flex-wrap sm:flex-nowrap">
        {isPending && (
          <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-extrabold animate-pulse h-10 pr-2 select-none">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Filtering...</span>
          </div>
        )}

        <button
          onClick={handleClearFilters}
          disabled={isPending}
          className="h-10 px-4 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100/70 dark:hover:bg-zinc-800/30"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}
