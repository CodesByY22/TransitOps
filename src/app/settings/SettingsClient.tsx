"use client";

import React, { useActionState, useEffect, useState, useTransition } from "react";
import { updateSettings, SettingsActionState } from "@/features/settings/actions";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/components/ThemeContext";
import {
  Building,
  Shield,
  Bell,
  Sun,
  Moon,
  Save,
  Check,
  Globe,
  SlidersHorizontal,
  Mail,
  MessageSquare,
  Users,
  Settings as SettingsIcon,
  Play,
} from "lucide-react";

interface SettingsData {
  depotName: string;
  currency: string;
  distanceUnit: string;
}

interface UserListItem {
  id: number;
  name: string;
  email: string;
  roleName: string;
}

const initialState: SettingsActionState = {
  success: false,
};

interface SettingsSelectProps {
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  name: string;
}

function SettingsSelect({ value, options, onChange, name }: SettingsSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

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
    <div className="relative w-full" ref={containerRef}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] text-slate-800 dark:text-zinc-200 text-xs rounded-xl h-10 px-3.5 font-bold w-full transition-all hover:bg-slate-100/70 dark:hover:bg-zinc-800/30 text-left cursor-pointer focus:outline-none focus:border-blue-500"
      >
        <span className="truncate">{selectedOption.label}</span>
        <svg
          className={`h-4 w-4 text-slate-400 dark:text-zinc-500 transition-transform duration-200 shrink-0 ml-1.5 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-[44px] left-0 w-full bg-white dark:bg-[#111625] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-slide-in">
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

export default function SettingsClient({
  initialSettings,
  users,
}: {
  initialSettings: SettingsData;
  users: UserListItem[];
}) {
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"general" | "rbac" | "alerts">("general");

  // Tab State Form Management
  const [currency, setCurrency] = useState(initialSettings.currency);
  const [distanceUnit, setDistanceUnit] = useState(initialSettings.distanceUnit);

  const [state, formAction, isPending] = useActionState(
    async (prevState: SettingsActionState, formData: FormData) => {
      const res = await updateSettings(prevState, formData);
      return res;
    },
    initialState
  );

  useEffect(() => {
    if (state.success) {
      showToast("success", "Settings Saved", "Depot operational configurations have been updated.");
    } else if (state.error) {
      showToast("error", "Error Saving Settings", state.error);
    }
  }, [state, showToast]);

  // Operational notification settings (with LocalStorage persistence)
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [slackAlerts, setSlackAlerts] = useState(true);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("https://example.com/slack-webhook-url");
  const [alertRecipients, setAlertRecipients] = useState("alerts@transitops.in");
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("emailAlerts");
      const savedSms = localStorage.getItem("smsAlerts");
      const savedSlack = localStorage.getItem("slackAlerts");
      const savedWebhook = localStorage.getItem("slackWebhookUrl");
      const savedRecipients = localStorage.getItem("alertRecipients");

      if (savedEmail !== null) setEmailAlerts(savedEmail === "true");
      if (savedSms !== null) setSmsAlerts(savedSms === "true");
      if (savedSlack !== null) setSlackAlerts(savedSlack === "true");
      if (savedWebhook !== null) setSlackWebhookUrl(savedWebhook);
      if (savedRecipients !== null) setAlertRecipients(savedRecipients);
    }
  }, []);

  const handleToggleEmail = (val: boolean) => {
    setEmailAlerts(val);
    localStorage.setItem("emailAlerts", String(val));
    showToast("success", "Email Alerts Updated", `Email notifications are now ${val ? "enabled" : "disabled"}.`);
  };

  const handleToggleSms = (val: boolean) => {
    setSmsAlerts(val);
    localStorage.setItem("smsAlerts", String(val));
    showToast("success", "SMS Alerts Updated", `SMS warning alerts are now ${val ? "enabled" : "disabled"}.`);
  };

  const handleToggleSlack = (val: boolean) => {
    setSlackAlerts(val);
    localStorage.setItem("slackAlerts", String(val));
    showToast("success", "Slack Integration Updated", `Slack alerts hook is now ${val ? "enabled" : "disabled"}.`);
  };

  const handleSaveWebhookDetails = () => {
    localStorage.setItem("slackWebhookUrl", slackWebhookUrl);
    localStorage.setItem("alertRecipients", alertRecipients);
    showToast("success", "Configuration Saved", "Custom webhook and routing credentials stored safely.");
  };

  const handleTestWebhook = () => {
    setIsTestingWebhook(true);
    setTimeout(() => {
      setIsTestingWebhook(false);
      showToast("success", "Integration Active", "Mock webhook payload dispatched successfully. Status 200 OK.");
    }, 1200);
  };

  // Role Permissions Data representing middleware.ts RBAC rules
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

  const getRoleBadge = (roleName: string) => {
    switch (roleName) {
      case "Fleet Manager":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
      case "Dispatcher":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "Safety Officer":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case "Financial Analyst":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20";
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight font-sans">Settings</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Configure logistics depots, client-side appearance preferences, and RBAC matrix parameters</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-[#1E293B] gap-6 text-xs font-bold text-slate-500 dark:text-zinc-400">
        <button
          onClick={() => setActiveTab("general")}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "general"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent hover:text-slate-800 dark:hover:text-zinc-200"
          }`}
        >
          <Building className="h-4 w-4" />
          General & Theme
        </button>
        <button
          onClick={() => setActiveTab("rbac")}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "rbac"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent hover:text-slate-800 dark:hover:text-zinc-200"
          }`}
        >
          <Shield className="h-4 w-4" />
          Access Control (RBAC)
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "alerts"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent hover:text-slate-800 dark:hover:text-zinc-200"
          }`}
        >
          <Bell className="h-4 w-4" />
          Alerts & Webhooks
        </button>
      </div>

      {/* TAB PANELS */}
      <div className="space-y-6">
        {activeTab === "general" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Depot Configuration */}
            <div className="md:col-span-2 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
                <SettingsIcon className="h-5 w-5 text-blue-500" />
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200">Depot Information</h3>
                  <p className="text-[10px] text-slate-400">Regional logistics settings stored on Cloud database</p>
                </div>
              </div>

              <form action={formAction} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Depot Name */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Depot Name</label>
                    <input
                      type="text"
                      name="depotName"
                      required
                      defaultValue={initialSettings.depotName}
                      className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-955 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-bold transition-all"
                    />
                  </div>

                  {/* Currency Custom Select */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Operational Currency</label>
                    <SettingsSelect
                      name="currency"
                      value={currency}
                      options={[
                        { label: "INR (Rs) - ₹", value: "INR (Rs)" },
                        { label: "USD ($) - $", value: "USD ($)" },
                        { label: "EUR (€) - €", value: "EUR (€)" },
                      ]}
                      onChange={setCurrency}
                    />
                  </div>

                  {/* Distance Metric Custom Select */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Distance Units</label>
                    <SettingsSelect
                      name="distanceUnit"
                      value={distanceUnit}
                      options={[
                        { label: "Kilometers (km)", value: "Kilometers" },
                        { label: "Miles (mi)", value: "Miles" },
                      ]}
                      onChange={setDistanceUnit}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {isPending ? "Saving..." : "Save Depot Settings"}
                  </button>
                </div>
              </form>
            </div>

            {/* Appearance Theme */}
            <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4 h-fit">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                  {theme === "light" ? <Sun className="h-4 w-4 text-blue-500" /> : <Moon className="h-4 w-4 text-blue-500" />}
                  Interface Theme
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Switch client layout colors</p>
              </div>

              <div className="flex bg-slate-100 dark:bg-zinc-900/50 p-1 rounded-xl border border-slate-200/50 dark:border-zinc-800/80">
                <button
                  onClick={() => {
                    if (theme !== "light") toggleTheme();
                  }}
                  className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    theme === "light"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Sun className="h-4 w-4" />
                  Light
                </button>
                <button
                  onClick={() => {
                    if (theme !== "dark") toggleTheme();
                  }}
                  className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    theme === "dark"
                      ? "bg-[#121214] text-zinc-150 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "rbac" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* RBAC Table Matrix */}
            <div className="md:col-span-2 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-teal-500" />
                  Role Permissions Matrix (RBAC)
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Audit operations access mapped across enterprise roles</p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-900/10">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="text-[9px] font-black uppercase text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900/40 border-b border-slate-200 dark:border-[#1E293B]">
                    <tr>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4 text-center">View Fleet</th>
                      <th className="py-3.5 px-4 text-center">Edit Fleet</th>
                      <th className="py-3.5 px-4 text-center">Dispatch</th>
                      <th className="py-3.5 px-4 text-center">Expenses</th>
                      <th className="py-3.5 px-4 text-center">Settings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {rolesPermissions.map((item) => (
                      <tr key={item.role} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/10 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-zinc-200">{item.role}</td>
                        <td className="py-3.5 px-4 text-center">
                          {item.viewAssets ? <Check className="h-4.5 w-4.5 text-emerald-500 mx-auto" /> : <span className="text-slate-300 dark:text-zinc-700">—</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.editAssets ? <Check className="h-4.5 w-4.5 text-emerald-500 mx-auto" /> : <span className="text-slate-300 dark:text-zinc-700">—</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.dispatchTrips ? <Check className="h-4.5 w-4.5 text-emerald-500 mx-auto" /> : <span className="text-slate-300 dark:text-zinc-700">—</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.viewExpenses ? <Check className="h-4.5 w-4.5 text-emerald-500 mx-auto" /> : <span className="text-slate-300 dark:text-zinc-700">—</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.editSettings ? <Check className="h-4.5 w-4.5 text-emerald-500 mx-auto" /> : <span className="text-slate-300 dark:text-zinc-700">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Active Users List */}
            <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  Active Users
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Users registered in this tenant</p>
              </div>

              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="p-3 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800 rounded-xl space-y-2 hover:border-slate-300 dark:hover:border-zinc-700 transition"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-bold text-slate-800 dark:text-zinc-200 truncate text-xs">{u.name}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${getRoleBadge(u.roleName)}`}>
                        {u.roleName}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono truncate">{u.email}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Alerts Options */}
            <div className="md:col-span-2 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
                <Bell className="h-5 w-5 text-indigo-500" />
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200">Alert Subscriptions</h3>
                  <p className="text-[10px] text-slate-400">Configure dispatch and safety rules notification hooks</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Email alerts */}
                <div className="flex items-start justify-between gap-4 p-3 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 rounded-xl transition">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-blue-500" />
                      Email dispatch notifications
                    </span>
                    <p className="text-[10px] text-slate-400">Receive summaries of dispatch statuses directly in mail</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => handleToggleEmail(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border-slate-350 text-blue-600 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-800 cursor-pointer"
                    />
                  </label>
                </div>

                {/* SMS alerts */}
                <div className="flex items-start justify-between gap-4 p-3 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 rounded-xl transition">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                      SMS driver expiry warning alerts
                    </span>
                    <p className="text-[10px] text-slate-400">Trigger warnings directly to depot coordinators on safety expiration</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={smsAlerts}
                      onChange={(e) => handleToggleSms(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border-slate-350 text-blue-600 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-800 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Slack webhook alerts */}
                <div className="flex items-start justify-between gap-4 p-3 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 rounded-xl transition">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-purple-500" />
                      Slack system logs hook integration
                    </span>
                    <p className="text-[10px] text-slate-400">Broadcast maintenance updates and audit reports to Slack channels</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={slackAlerts}
                      onChange={(e) => handleToggleSlack(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border-slate-350 text-blue-600 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-800 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Integrations detail form */}
            <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  Hook Credentials
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Credentials for external messaging integrations</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Alert Recipient Emails</label>
                  <input
                    type="email"
                    value={alertRecipients}
                    onChange={(e) => setAlertRecipients(e.target.value)}
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-955 dark:text-zinc-200 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Slack Webhook URL</label>
                  <input
                    type="text"
                    value={slackWebhookUrl}
                    onChange={(e) => setSlackWebhookUrl(e.target.value)}
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-955 dark:text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveWebhookDetails}
                    className="flex-1 h-9 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save Config
                  </button>
                  <button
                    type="button"
                    disabled={isTestingWebhook}
                    onClick={handleTestWebhook}
                    className="flex-1 h-9 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isTestingWebhook ? (
                      "Testing..."
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Test Hook
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
