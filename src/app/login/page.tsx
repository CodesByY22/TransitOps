"use client";

import React, { useActionState, useEffect, useState } from "react";
import { login, AuthState } from "@/features/auth/actions";
import { KeyRound, Mail, ShieldAlert, Truck, Navigation2, Compass } from "lucide-react";
import { useRouter } from "next/navigation";

const initialState: AuthState = {
  success: false,
};

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(login, initialState);
  const [countdown, setCountdown] = useState<number>(0);

  // Redirect on successful login
  useEffect(() => {
    if (state.success) {
      router.push("/dashboard");
      router.refresh();
    }
  }, [state.success, router]);

  // Handle lockout countdown timer
  useEffect(() => {
    if (state.lockoutRemaining) {
      setCountdown(state.lockoutRemaining);
    }
  }, [state.lockoutRemaining]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Left Column: Premium Logistics Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden select-none">
        {/* SVG Decorative Grid & Pulsing Nodes */}
        <div className="absolute inset-0 z-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Animated Logistics Network Map */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="relative w-[500px] h-[400px]">
            {/* Route Lines */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 100 250 Q 250 100 400 250 T 250 350 Z"
                fill="none"
                stroke="url(#route-grad)"
                strokeWidth="2"
                strokeDasharray="8 6"
                className="animate-[dash_30s_linear_infinite]"
              />
              <path
                d="M 50 150 Q 200 350 450 150"
                fill="none"
                stroke="url(#route-grad-2)"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              <defs>
                <linearGradient id="route-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0D9488" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="route-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Hubs */}
            <div className="absolute top-[80px] left-[230px] flex flex-col items-center">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 shadow-md shadow-blue-500/50"></span>
              </span>
              <span className="text-[10px] text-slate-300 font-mono mt-1 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                HQ Depot
              </span>
            </div>

            <div className="absolute top-[230px] left-[85px] flex flex-col items-center">
              <span className="relative flex h-3.5 w-3.5">
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-500 shadow-md shadow-teal-500/50"></span>
              </span>
              <span className="text-[10px] text-slate-300 font-mono mt-1 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                West Hub
              </span>
            </div>

            <div className="absolute top-[230px] left-[385px] flex flex-col items-center">
              <span className="relative flex h-3.5 w-3.5">
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-violet-500 shadow-md shadow-violet-500/50"></span>
              </span>
              <span className="text-[10px] text-slate-300 font-mono mt-1 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                East Hub
              </span>
            </div>

            {/* Float Truck Icons */}
            <div className="absolute top-[170px] left-[150px] animate-[bounce_4s_infinite_ease-in-out] bg-slate-900/90 border border-blue-500/30 p-2 rounded-xl text-blue-400 shadow-xl shadow-blue-500/10">
              <Truck className="h-6 w-6" />
            </div>

            <div className="absolute top-[280px] left-[260px] animate-[bounce_5s_infinite_ease-in-out] bg-slate-900/90 border border-teal-500/30 p-2 rounded-xl text-teal-400 shadow-xl shadow-teal-500/10">
              <Compass className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Content Info overlay */}
        <div className="absolute bottom-16 left-16 right-16 z-20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-blue-500/30">
              T
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">TransitOps</h1>
              <p className="text-xs text-slate-400 uppercase font-mono tracking-wider">Enterprise Dispatch</p>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed max-w-md">
            Optimize fleets, dispatch routes, verify compliance in real-time, and run detailed financial ROI reports from a single pane.
          </p>
          <div className="flex items-center gap-6 pt-2 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5"><Navigation2 className="h-3.5 w-3.5 text-blue-500 rotate-45" /> Real-time tracking</span>
            <span className="flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5 text-teal-500" /> Auto compliance checks</span>
          </div>
        </div>
      </div>

      {/* Right Column: Premium Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 relative overflow-hidden bg-slate-50 dark:bg-[#070709]">
        {/* Subtle decorative glow for dark mode */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-teal-500/5 dark:bg-teal-500/5 rounded-full blur-3xl -z-10"></div>

        <div className="w-full max-w-[420px] space-y-8 animate-slide-in">
          {/* Form Header */}
          <div className="text-center lg:text-left space-y-2">
            <div className="lg:hidden flex justify-center gap-2.5 items-center mb-6">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-extrabold text-white text-lg">
                T
              </div>
              <span className="text-xl font-bold dark:text-white">TransitOps</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">
              Sign In
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Enter your credentials to manage transport operations.
            </p>
          </div>

          {/* Error Message */}
          {state.error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-3">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Access Denied</p>
                <p className="mt-0.5 leading-relaxed font-semibold">
                  {countdown > 0
                    ? `Account locked. Please try again in ${countdown}s.`
                    : state.error}
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form action={formAction} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="manager@transitops.in"
                  disabled={isPending || countdown > 0}
                  className="w-full h-11 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl pl-11 pr-4 text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wide">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Contact your IT administrator to reset credentials.");
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  disabled={isPending || countdown > 0}
                  className="w-full h-11 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl pl-11 pr-4 text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  name="rememberMe"
                  className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-800"
                />
                <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 group-hover:text-slate-800 dark:group-hover:text-zinc-200 transition-colors">
                  Remember this device
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending || countdown > 0}
              className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-blue-600/25 active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:shadow-none"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : countdown > 0 ? (
                `Locked for ${countdown}s`
              ) : (
                "Sign In to Platform"
              )}
            </button>
          </form>

          {/* Mock Accounts Information Card */}
          <div className="p-4 bg-slate-100 dark:bg-zinc-900/30 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl space-y-2 text-[11px] leading-relaxed">
            <p className="font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Demo User Credentials</p>
            <div className="grid grid-cols-2 gap-2 text-slate-500 dark:text-zinc-400 font-semibold font-mono">
              <div>
                <p className="text-blue-600 dark:text-blue-400">Fleet Manager:</p>
                <p>manager@transitops.in</p>
                <p>mahavir123</p>
              </div>
              <div>
                <p className="text-teal-600 dark:text-teal-400">Dispatcher:</p>
                <p>raven.k@transitops.in</p>
                <p>raven123</p>
              </div>
              <div>
                <p className="text-amber-600 dark:text-amber-400">Safety Officer:</p>
                <p>safety@transitops.in</p>
                <p>safety123</p>
              </div>
              <div>
                <p className="text-violet-600 dark:text-violet-400">Financial Analyst:</p>
                <p>analyst@transitops.in</p>
                <p>finance123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
