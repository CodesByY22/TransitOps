"use client";

import React, { useState, useTransition } from "react";
import { createFuelLog, createExpenseLog, ExpenseActionState } from "@/features/expenses/actions";
import { useToast } from "@/components/Toast";
import {
  Fuel,
  DollarSign,
  Wrench,
  TrendingDown,
  Search,
  Plus,
  X,
  AlertCircle,
  Calendar,
  Truck,
  CreditCard,
  Briefcase,
  Layers,
} from "lucide-react";

interface Vehicle {
  id: number;
  registrationNumber: string;
  model: string;
}

interface Trip {
  id: number;
  source: string;
  destination: string;
}

interface FuelLog {
  id: number;
  vehicleId: number;
  liters: number;
  cost: number;
  date: Date;
  vehicle: Vehicle;
}

interface Expense {
  id: number;
  tripId: number;
  toll: number;
  other: number;
  maintenanceLinked: number;
  total: number;
  date: Date;
  trip: Trip & {
    vehicle?: Vehicle | null;
  };
}

export default function ExpensesClient({
  fuelLogs,
  expenses,
  vehicles,
  trips,
  totals,
}: {
  fuelLogs: FuelLog[];
  expenses: Expense[];
  vehicles: Vehicle[];
  trips: Trip[];
  totals: {
    fuel: number;
    maintenance: number;
    other: number;
    total: number;
  };
}) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"fuel" | "expense">("fuel");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals state
  const [fuelOpen, setFuelOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Submit Add Fuel Log
  const handleAddFuel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createFuelLog(null, formData);
      if (res.success) {
        showToast("success", "Receipt Logged", "A new fuel receipt has been logged successfully.");
        setFuelOpen(false);
        window.location.reload();
      } else {
        setFormError(res.error || "An error occurred.");
      }
    });
  };

  // Form Submit Add Expense Log
  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createExpenseLog(null, formData);
      if (res.success) {
        showToast("success", "Expense Logged", "Other operational expense has been logged successfully.");
        setExpenseOpen(false);
        window.location.reload();
      } else {
        setFormError(res.error || "An error occurred.");
      }
    });
  };

  // Filter fuel logs
  const filteredFuelLogs = fuelLogs.filter((log) => {
    const matchesSearch = log.vehicle.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const logDate = new Date(log.date);
    const matchesStart = startDate === "" || logDate >= new Date(startDate);
    const matchesEnd = endDate === "" || logDate <= new Date(endDate);
    return matchesSearch && matchesStart && matchesEnd;
  });

  // Filter expense logs
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.trip.vehicle
      ? exp.trip.vehicle.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const expDate = new Date(exp.date);
    const matchesStart = startDate === "" || expDate >= new Date(startDate);
    const matchesEnd = endDate === "" || expDate <= new Date(endDate);
    return matchesSearch && matchesStart && matchesEnd;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Financial Center</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Audit vehicle fuel receipts, toll expenses, and total operational cost</p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => {
              setFormError(null);
              setFuelOpen(true);
            }}
            className="h-10 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-teal-600/10 flex items-center gap-2 cursor-pointer"
          >
            <Fuel className="h-4 w-4" />
            Log Fuel
          </button>
          <button
            onClick={() => {
              setFormError(null);
              setExpenseOpen(true);
            }}
            className="h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-blue-600/10 flex items-center gap-2 cursor-pointer"
          >
            <CreditCard className="h-4 w-4" />
            Log Expense
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Fuel Cost */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between h-28 shadow-sm">
          <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Fuel Costs</span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Fuel className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">₹{totals.fuel.toLocaleString()}</span>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold">Total fuel expenditures</p>
          </div>
        </div>

        {/* Maintenance Cost */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between h-28 shadow-sm">
          <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Maintenance Costs</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">₹{totals.maintenance.toLocaleString()}</span>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold">Total workshop servicing</p>
          </div>
        </div>

        {/* Other Expenses */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between h-28 shadow-sm">
          <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Tolls & Misc Expenses</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">₹{totals.other.toLocaleString()}</span>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold">Tolls, food, permit expenses</p>
          </div>
        </div>

        {/* Total Operational Cost */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between h-28 shadow-sm bg-gradient-to-br from-blue-500/5 to-teal-500/5 border-blue-500/20">
          <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Operations Cost</span>
            <div className="p-1.5 rounded-lg bg-blue-600/10 text-blue-500">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">₹{totals.total.toLocaleString()}</span>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold">Aggregate fleet outlay</p>
          </div>
        </div>
      </div>

      {/* Tabs and Filters Bar */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-4 shadow-sm space-y-4">
        {/* Toggle + Search row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-zinc-900/50 p-1.5 rounded-xl border border-slate-200/50 dark:border-zinc-800 self-start">
            <button
              onClick={() => setActiveTab("fuel")}
              className={`h-9 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "fuel"
                  ? "bg-white dark:bg-[#121214] text-slate-900 dark:text-zinc-150 shadow-sm"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800"
              }`}
            >
              Fuel Receipts
            </button>
            <button
              onClick={() => setActiveTab("expense")}
              className={`h-9 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "expense"
                  ? "bg-white dark:bg-[#121214] text-slate-900 dark:text-zinc-150 shadow-sm"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800"
              }`}
            >
              Other Expenses
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Odometer search */}
            <div className="relative w-60">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Search by registration..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-semibold"
              />
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-2.5 text-xs text-slate-700 dark:text-zinc-300 font-semibold focus:outline-none"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-2.5 text-xs text-slate-700 dark:text-zinc-300 font-semibold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Data Tables */}
        {activeTab === "fuel" ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-zinc-850">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900/40 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3.5 px-5">Vehicle Registration</th>
                  <th className="py-3.5 px-5">Model</th>
                  <th className="py-3.5 px-5">Fuel Consumed (L)</th>
                  <th className="py-3.5 px-5">Fuel Cost (₹)</th>
                  <th className="py-3.5 px-5">Date logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredFuelLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900 dark:text-zinc-200">
                      {log.vehicle.registrationNumber}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-600 dark:text-zinc-400">
                      {log.vehicle.model}
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-700 dark:text-zinc-300">
                      {log.liters} L
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-800 dark:text-zinc-200">
                      ₹{log.cost.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 dark:text-zinc-400">
                      {new Date(log.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {filteredFuelLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-zinc-500">
                      No fuel logs matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-zinc-850">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900/40 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3.5 px-5">Assigned Trip</th>
                  <th className="py-3.5 px-5">Route</th>
                  <th className="py-3.5 px-5">Toll Cost</th>
                  <th className="py-3.5 px-5">Other Misc</th>
                  <th className="py-3.5 px-5">Linked Maintenance</th>
                  <th className="py-3.5 px-5">Total Cost</th>
                  <th className="py-3.5 px-5">Date logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900 dark:text-zinc-200">
                      TR{String(exp.tripId).padStart(3, "0")}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-600 dark:text-zinc-400">
                      {exp.trip.source} ➔ {exp.trip.destination}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-700 dark:text-zinc-300">
                      ₹{exp.toll.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-700 dark:text-zinc-300">
                      ₹{exp.other.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-amber-500 font-bold">
                      ₹{exp.maintenanceLinked.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 font-mono font-black text-slate-900 dark:text-zinc-200">
                      ₹{exp.total.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 dark:text-zinc-400">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-zinc-500">
                      No expense logs matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LOG FUEL RECEIPT DIALOG MODAL */}
      {fuelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setFuelOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-slide-in">
            <form onSubmit={handleAddFuel}>
              <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/20 border-b border-slate-150 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">Log Fuel Receipt</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Record fuel liters and cost for auditing</p>
                </div>
                <button type="button" onClick={() => setFuelOpen(false)} className="text-slate-400 hover:text-slate-650">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold flex items-center gap-2 rounded-xl">
                    <AlertCircle className="h-4.5 w-4.5" />
                    {formError}
                  </div>
                )}

                {/* Vehicle */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Select Vehicle</label>
                  <select
                    name="vehicleId"
                    required
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.model} ({v.registrationNumber})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Liters */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Liters Filled</label>
                  <input
                    type="number"
                    name="liters"
                    required
                    min="0.1"
                    step="0.1"
                    placeholder="40"
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>

                {/* Cost */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Total Cost (₹)</label>
                  <input
                    type="number"
                    name="cost"
                    required
                    min="1"
                    placeholder="3800"
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Filling Date</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-zinc-950/20">
                <button
                  type="button"
                  onClick={() => setFuelOpen(false)}
                  className="h-9 px-4 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-9 px-5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-teal-600/10 cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Logging..." : "Log Fuel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG EXPENSE DIALOG MODAL */}
      {expenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setExpenseOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-slide-in">
            <form onSubmit={handleAddExpense}>
              <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/20 border-b border-slate-150 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">Log Toll/Misc Expense</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Attach tolls or miscellaneous expenses to a trip</p>
                </div>
                <button type="button" onClick={() => setExpenseOpen(false)} className="text-slate-400 hover:text-slate-650">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold flex items-center gap-2 rounded-xl">
                    <AlertCircle className="h-4.5 w-4.5" />
                    {formError}
                  </div>
                )}

                {/* Trip selection */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Select Assigned Trip</label>
                  <select
                    name="tripId"
                    required
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="">-- Choose Trip --</option>
                    {trips.map((t) => (
                      <option key={t.id} value={t.id}>
                        TR{String(t.id).padStart(3, "0")} - {t.source} ➔ {t.destination}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Toll */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Toll Fees (₹)</label>
                  <input
                    type="number"
                    name="toll"
                    defaultValue="0"
                    min="0"
                    placeholder="120"
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>

                {/* Other */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Other Miscellaneous Cost (₹)</label>
                  <input
                    type="number"
                    name="other"
                    defaultValue="0"
                    min="0"
                    placeholder="150"
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Logging Date</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-zinc-950/20">
                <button
                  type="button"
                  onClick={() => setExpenseOpen(false)}
                  className="h-9 px-4 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-9 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-blue-600/10 cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Logging..." : "Log Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
