"use client";

import React, { useActionState, useTransition, useState } from "react";
import { updateSettings, SettingsActionState } from "@/features/settings/actions";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/components/ThemeContext";
import {
  Settings,
  Shield,
  Bell,
  Sun,
  Moon,
  Info,
  Save,
  Check,
  Building,
  DollarSign,
  Compass,
} from "lucide-react";

interface SettingsData {
  depotName: string;
  currency: string;
  distanceUnit: string;
}

const initialState: SettingsActionState = {
  success: false,
};

export default function SettingsClient({ initialSettings }: { initialSettings: SettingsData }) {
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    let res: SettingsActionState = { success: false };
    startTransition(async () => {
      res = await updateSettings(null, formData);
      if (res.success) {
        showToast("success", "Settings Saved", "Depot operational configurations have been updated.");
      } else {
        showToast("error", "Error Saving Settings", res.error || "Database error.");
      }
    });
    return res;
  }, initialState);

  // Mock Notification settings state
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [slackAlerts, setSlackAlerts] = useState(true);

  // Role Permissions Data representing our middleware.ts RBAC rules
  const rolesPermissions = [
    {
      role: "Fleet Manager",
      viewAssets: true,
      editAssets: true,
      dispatchTrips: true,
      viewExpenses: true,
      editSettings: true,
    },
    {
      role: "Dispatcher",
      viewAssets: true,
      editAssets: true,
      dispatchTrips: true,
      viewExpenses: false,
      editSettings: false,
    },
    {
      role: "Safety Officer",
      viewAssets: true,
      editAssets: true,
      dispatchTrips: false,
      viewExpenses: false,
      editSettings: false,
    },
    {
      role: "Financial Analyst",
      viewAssets: true,
      editAssets: false,
      dispatchTrips: false,
      viewExpenses: true,
      editSettings: false,
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight font-sans">Settings</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Configure transport hubs, notification preferences, and RBAC permissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Forms */}
        <div className="md:col-span-2 space-y-6">
          
          {/* General depot settings */}
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-700 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-500" />
              Depot Configuration
            </h3>

            <form action={formAction} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Depot Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Depot Name</label>
                  <input
                    type="text"
                    name="depotName"
                    required
                    defaultValue={initialSettings.depotName}
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                {/* Currency */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Currency</label>
                  <select
                    name="currency"
                    defaultValue={initialSettings.currency}
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-805 dark:text-zinc-200 focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="INR (Rs)">INR (Rs) - ₹</option>
                    <option value="USD ($)">USD ($) - $</option>
                    <option value="EUR (€)">EUR (€) - €</option>
                  </select>
                </div>

                {/* Distance Unit */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Distance Unit</label>
                  <select
                    name="distanceUnit"
                    defaultValue={initialSettings.distanceUnit}
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-805 dark:text-zinc-200 focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="Kilometers">Kilometers (km)</option>
                    <option value="Miles">Miles (mi)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isPending ? "Saving..." : "Save Depot Settings"}
                </button>
              </div>
            </form>
          </div>

          {/* Role Permissions Matrix */}
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-700 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Shield className="h-4 w-4 text-teal-500" />
                Role Permissions Matrix (RBAC)
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Audit operations access mapped across enterprise roles</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-zinc-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="text-[9px] font-black uppercase text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900/40 border-b border-slate-200 dark:border-[#1E293B]">
                  <tr>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-center">View Fleet</th>
                    <th className="py-3 px-4 text-center">Edit Fleet</th>
                    <th className="py-3 px-4 text-center">Dispatch</th>
                    <th className="py-3 px-4 text-center">Expenses</th>
                    <th className="py-3 px-4 text-center">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {rolesPermissions.map((item) => (
                    <tr key={item.role} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-zinc-200">{item.role}</td>
                      <td className="py-3 px-4 text-center">
                        {item.viewAssets ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-slate-300 dark:text-zinc-700">—</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.editAssets ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-slate-300 dark:text-zinc-700">—</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.dispatchTrips ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-slate-300 dark:text-zinc-700">—</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.viewExpenses ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-slate-300 dark:text-zinc-700">—</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.editSettings ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-slate-300 dark:text-zinc-700">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Preferences Mock */}
        <div className="space-y-6">
          {/* Theme card */}
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-700 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              {theme === "light" ? <Sun className="h-4 w-4 text-blue-500" /> : <Moon className="h-4 w-4 text-blue-500" />}
              Appearance Theme
            </h3>
            <div className="flex bg-slate-100 dark:bg-zinc-900/50 p-1 rounded-xl border border-slate-200/50 dark:border-zinc-800/80">
              <button
                onClick={() => { if (theme !== "light") toggleTheme(); }}
                className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  theme === "light" ? "bg-white text-slate-900 shadow-sm" : "text-zinc-400"
                }`}
              >
                <Sun className="h-4 w-4" />
                Light
              </button>
              <button
                onClick={() => { if (theme !== "dark") toggleTheme(); }}
                className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  theme === "dark" ? "bg-[#121214] text-zinc-150 shadow-sm" : "text-slate-500"
                }`}
              >
                <Moon className="h-4 w-4" />
                Dark
              </button>
            </div>
          </div>

          {/* Notifications toggles */}
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-700 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-500" />
              Operational Alerts
            </h3>
            <div className="space-y-4 text-xs font-semibold text-slate-600 dark:text-zinc-400">
              <label className="flex items-center justify-between cursor-pointer">
                <span>Email dispatch notifications</span>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-slate-350 text-blue-600 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-800"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span>SMS driver expiry warning alerts</span>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-slate-350 text-blue-600 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-800"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span>Slack system logs hook integration</span>
                <input
                  type="checkbox"
                  checked={slackAlerts}
                  onChange={(e) => setSlackAlerts(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-slate-350 text-blue-600 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-800"
                />
              </label>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
