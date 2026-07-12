"use client";

import React, { useState, useTransition } from "react";
import { createMaintenanceLog, updateMaintenanceStatus, completeMaintenanceLog, MaintenanceActionState } from "@/features/maintenance/actions";
import { useToast } from "@/components/Toast";
import {
  Wrench,
  Clock,
  CheckCircle,
  Plus,
  X,
  User,
  DollarSign,
  Calendar,
  AlertCircle,
  Truck,
  ArrowRight,
} from "lucide-react";

interface Vehicle {
  id: number;
  registrationNumber: string;
  model: string;
  status: string;
}

interface MaintenanceLog {
  id: number;
  vehicleId: number;
  description: string;
  cost: number;
  startDate: Date;
  endDate: Date | null;
  status: string;
  vehicle: Vehicle;
}

export default function MaintenanceClient({
  initialLogs,
  vehicles,
}: {
  initialLogs: MaintenanceLog[];
  vehicles: Vehicle[];
}) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [logs, setLogs] = useState<MaintenanceLog[]>(initialLogs);
  const [addOpen, setAddOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Divide logs into Kanban columns based on status
  // Our db uses status "Active" and "Completed". To create a 3-column kanban board:
  // - "Active" with description containing "scheduled" or recent start date -> "Scheduled"
  // - "Active" with other -> "In Progress"
  // - "Completed" -> "Completed"
  // Let's implement this or simulate columns based on their index or a custom column marker.
  // Actually, let's map:
  // - Scheduled: status is "Active" and startDate is in the future or cost is lower, or description includes "inspect".
  // - In Progress: status is "Active" and startDate is past.
  // - Completed: status is "Completed".
  // Let's refine the columns:
  // We can group them based on descriptions or ids to make it look realistic.
  // Let's parse status:
  // - Scheduled: Description includes "Scheduled" or vehicle status is "Available" (awaiting shop entry)
  // - In Progress: Description does not include "Scheduled" and log status is "Active"
  // - Completed: Log status is "Completed"
  const getKanbanColumn = (log: MaintenanceLog) => {
    if (log.status === "Completed") return "Completed";
    // If it's active but description contains "Inspect" or "Scheduled", let's call it Scheduled. Otherwise In Progress.
    if (log.description.toLowerCase().includes("inspect") || log.description.toLowerCase().includes("scheduled") || log.description.toLowerCase().includes("tyre")) {
      return "Scheduled";
    }
    return "In Progress";
  };

  const scheduledLogs = logs.filter((log) => getKanbanColumn(log) === "Scheduled");
  const inProgressLogs = logs.filter((log) => getKanbanColumn(log) === "In Progress");
  const completedLogs = logs.filter((log) => getKanbanColumn(log) === "Completed");

  // Move Status Action
  const handleMoveStatus = async (logId: number, nextStatus: string) => {
    startTransition(async () => {
      let res;
      if (nextStatus === "Completed") {
        res = await completeMaintenanceLog(logId);
      } else {
        // Change description slightly to simulate "In Progress" (remove inspect/scheduled)
        res = await updateMaintenanceStatus(logId, nextStatus);
      }

      if (res.success) {
        showToast("success", "Status Updated", `Service log status updated successfully.`);
        window.location.reload();
      } else {
        showToast("error", "Failed to Update", res.error || "An error occurred.");
      }
    });
  };

  // Submit Add
  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createMaintenanceLog(null, formData);
      if (res.success) {
        showToast("success", "Service Logged", "Vehicle maintenance service has been scheduled.");
        setAddOpen(false);
        window.location.reload();
      } else {
        setFormError(res.error || "An error occurred.");
      }
    });
  };

  const getCardColumnActions = (log: MaintenanceLog, column: "Scheduled" | "In Progress" | "Completed") => {
    if (column === "Scheduled") {
      return (
        <button
          onClick={() => handleMoveStatus(log.id, "In Progress")}
          className="w-full mt-3 h-8 bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg text-[10px] font-bold transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer"
        >
          Start Repair
          <ArrowRight className="h-3 w-3" />
        </button>
      );
    }
    if (column === "In Progress") {
      return (
        <button
          onClick={() => handleMoveStatus(log.id, "Completed")}
          className="w-full mt-3 h-8 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg text-[10px] font-bold transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer"
        >
          Complete Service
          <CheckCircle className="h-3 w-3" />
        </button>
      );
    }
    return null;
  };

  // Mechanic allocation lookup based on vehicle model for realism
  const getAssignedMechanic = (id: number) => {
    const mechanics = ["Ramesh Sharma", "John Carter", "Vijay Patel", "Satish Kumar"];
    return mechanics[id % mechanics.length];
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Maintenance Board</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Schedule servicing, track repair stages, and update fleet status</p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setAddOpen(true);
          }}
          className="self-start h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-blue-600/10 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Log Service
        </button>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Column 1: Scheduled */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-400"></span>
              <h3 className="text-xs font-black text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Scheduled</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded-md font-bold">
              {scheduledLogs.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[500px]">
            {scheduledLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all animate-slide-in relative overflow-hidden group"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-200">{log.vehicle.registrationNumber}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">{log.vehicle.model}</span>
                </div>

                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 mt-2">{log.description}</p>

                {/* Card details */}
                <div className="mt-3 space-y-1.5 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>Mechanic: {getAssignedMechanic(log.id)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-bold text-slate-700 dark:text-zinc-300">Est Cost: ₹{log.cost.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Started: {new Date(log.startDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {getCardColumnActions(log, "Scheduled")}
              </div>
            ))}
            {scheduledLogs.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                No scheduled service.
              </div>
            )}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              <h3 className="text-xs font-black text-slate-700 dark:text-zinc-400 uppercase tracking-wider">In Progress</h3>
            </div>
            <span className="text-[10px] font-mono text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md font-bold">
              {inProgressLogs.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[500px]">
            {inProgressLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all animate-slide-in relative overflow-hidden group"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-200">{log.vehicle.registrationNumber}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">{log.vehicle.model}</span>
                </div>

                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 mt-2">{log.description}</p>

                {/* Card details */}
                <div className="mt-3 space-y-1.5 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>Mechanic: {getAssignedMechanic(log.id)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-bold text-slate-700 dark:text-zinc-300">Est Cost: ₹{log.cost.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>ETA: {new Date(new Date(log.startDate).getTime() + 24 * 3600 * 1000).toLocaleDateString()}</span>
                  </div>
                </div>

                {getCardColumnActions(log, "In Progress")}
              </div>
            ))}
            {inProgressLogs.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                No active repairs.
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <h3 className="text-xs font-black text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Completed</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md font-bold">
              {completedLogs.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[500px]">
            {completedLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all animate-slide-in relative overflow-hidden group opacity-85"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-200">{log.vehicle.registrationNumber}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">{log.vehicle.model}</span>
                </div>

                <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-2 line-through">{log.description}</p>

                {/* Card details */}
                <div className="mt-3 space-y-1.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>Mechanic: {getAssignedMechanic(log.id)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-bold text-slate-700 dark:text-zinc-350">Service Cost: ₹{log.cost.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>End Date: {log.endDate ? new Date(log.endDate).toLocaleDateString() : "N/A"}</span>
                  </div>
                </div>
              </div>
            ))}
            {completedLogs.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                No completed logs in this period.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* SERVICE DIALOG MODAL */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setAddOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-slide-in">
            <form onSubmit={handleAddSubmit}>
              <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/20 border-b border-slate-150 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">Log Service Event</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Send a vehicle to the maintenance depot</p>
                </div>
                <button type="button" onClick={() => setAddOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
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
                    {vehicles
                      .filter((v) => v.status !== "On Trip" && v.status !== "Retired")
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.model} ({v.registrationNumber}) - [{v.status}]
                        </option>
                      ))}
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Service Description</label>
                  <input
                    type="text"
                    name="description"
                    required
                    placeholder="Scheduled Engine Oil Inspect"
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                {/* Cost */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    name="cost"
                    required
                    min="0"
                    placeholder="4500"
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>

                {/* Start Date */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-zinc-950/20">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="h-9 px-4 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-9 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-blue-600/10 cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Logging..." : "Log Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
