"use client";

import React, { useState, useTransition, useEffect } from "react";
import { createTrip, dispatchTrip, advanceTripStatus, dispatchDraftTrip, TripActionState } from "@/features/trips/actions";
import { useToast } from "@/components/Toast";
import {
  Route,
  Navigation,
  Compass,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  User,
  Plus,
  Weight,
  Send,
  Search,
  Check,
  Ban,
  ArrowRight,
  UserX,
  X,
} from "lucide-react";

interface Vehicle {
  id: number;
  registrationNumber: string;
  model: string;
  type: string;
  maxCapacity: number;
  odometer: number;
  status: string;
}

interface Driver {
  id: number;
  name: string;
  licenseNumber: string;
  licenseExpiry: Date;
  activeStatus: string;
  safetyComplianceStatus: string;
  licenseCategory?: string;
}

interface Trip {
  id: number;
  source: string;
  destination: string;
  vehicleId: number | null;
  driverId: number | null;
  cargoWeight: number;
  plannedDistance: number;
  finalOdometer: number | null;
  fuelConsumed: number | null;
  status: string;
  eta: string | null;
  vehicle: Vehicle | null;
  driver: Driver | null;
}

export default function TripsClient({
  initialTrips,
  vehicles,
  drivers,
  currentUserId,
}: {
  initialTrips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  currentUserId: number;
}) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Dispatch Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [cargoWeightVal, setCargoWeightVal] = useState<number>(0);
  const [weightWarning, setWeightWarning] = useState<{ status: "ok" | "warn" | "error"; text?: string }>({ status: "ok" });

  // Completion Dialog Modal State
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completingTrip, setCompletingTrip] = useState<Trip | null>(null);
  const [finalOdometerVal, setFinalOdometerVal] = useState<number>(0);
  const [fuelConsumedVal, setFuelConsumedVal] = useState<number>(0);
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Assign Draft Dialog Modal State
  const [assignDraftDialogOpen, setAssignDraftDialogOpen] = useState(false);
  const [assigningTrip, setAssigningTrip] = useState<Trip | null>(null);
  const [draftVehicleId, setDraftVehicleId] = useState<string>("");
  const [draftDriverId, setDraftDriverId] = useState<string>("");
  const [draftEta, setDraftEta] = useState<string>("");
  const [assignError, setAssignError] = useState<string | null>(null);

  // Monitor cargo weight relative to selected vehicle capacity
  useEffect(() => {
    if (!selectedVehicleId) {
      setWeightWarning({ status: "ok" });
      return;
    }
    const vehicle = vehicles.find((v) => v.id === parseInt(selectedVehicleId));
    if (!vehicle) {
      setWeightWarning({ status: "ok" });
      return;
    }

    if (cargoWeightVal > vehicle.maxCapacity) {
      setWeightWarning({
        status: "error",
        text: `Cargo weight exceeds vehicle max capacity of ${vehicle.maxCapacity} kg!`,
      });
    } else if (cargoWeightVal >= vehicle.maxCapacity * 0.9) {
      setWeightWarning({
        status: "warn",
        text: `Vehicle approaching maximum capacity (Currently ${Math.round((cargoWeightVal / vehicle.maxCapacity) * 100)}%).`,
      });
    } else {
      setWeightWarning({ status: "ok" });
    }
  }, [selectedVehicleId, cargoWeightVal, vehicles]);

  // Form Submit Handler
  const handleCreateTrip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (weightWarning.status === "error") {
      showToast("error", "Dispatch Blocked", "Cargo weight exceeds vehicle capacity.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.set("createdById", String(currentUserId));

    startTransition(async () => {
      const res = await createTrip(null, formData);
      if (res.success) {
        showToast("success", "Trip Planned", "A new trip draft has been successfully created.");
        // Clear fields
        setSelectedVehicleId("");
        setCargoWeightVal(0);
        e.currentTarget.reset();
        window.location.reload();
      } else {
        showToast("error", "Failed to Plan Trip", res.error || "An error occurred.");
      }
    });
  };

  // Dispatch Action
  const handleDispatch = async (tripId: number) => {
    startTransition(async () => {
      const res = await dispatchTrip(tripId);
      if (res.success) {
        showToast("success", "Trip Dispatched", "Fleet vehicle and driver have been dispatched successfully.");
        window.location.reload();
      } else {
        showToast("error", "Dispatch Denied", res.error || "Validation checks failed.");
      }
    });
  };

  // Start Transit Action
  const handleStartTransit = async (tripId: number) => {
    startTransition(async () => {
      const res = await advanceTripStatus(tripId, "In Transit");
      if (res.success) {
        showToast("info", "In Transit", "Trip is currently on route.");
        window.location.reload();
      } else {
        showToast("error", "Error", res.error || "Failed to update status.");
      }
    });
  };

  // Cancel Trip
  const handleCancelTrip = async (tripId: number) => {
    startTransition(async () => {
      const res = await advanceTripStatus(tripId, "Cancelled");
      if (res.success) {
        showToast("info", "Trip Cancelled", "The dispatch plan was successfully cancelled.");
        window.location.reload();
      } else {
        showToast("error", "Cancel Failed", res.error || "Failed to cancel trip.");
      }
    });
  };

  // Open Complete Dialog Modal
  const openCompleteDialog = (trip: Trip) => {
    setCompletingTrip(trip);
    setFinalOdometerVal((trip.vehicle?.odometer || 0) + trip.plannedDistance);
    setFuelConsumedVal(Math.round(trip.plannedDistance / 6)); // Estimate
    setCompleteError(null);
    setCompleteDialogOpen(true);
  };

  // Complete Trip Form Submit
  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTrip) return;
    setCompleteError(null);

    startTransition(async () => {
      const res = await advanceTripStatus(
        completingTrip.id,
        "Completed",
        finalOdometerVal,
        fuelConsumedVal
      );
      if (res.success) {
        showToast("success", "Trip Completed", `Odometer updated. Fuel receipt logged.`);
        setCompleteDialogOpen(false);
        window.location.reload();
      } else {
        setCompleteError(res.error || "An error occurred.");
      }
    });
  };

  const openAssignDraftDialog = (trip: Trip) => {
    setAssigningTrip(trip);
    setDraftVehicleId("");
    setDraftDriverId("");
    setDraftEta("45 min");
    setAssignError(null);
    setAssignDraftDialogOpen(true);
  };

  const handleAssignDraftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTrip || !draftVehicleId || !draftDriverId) {
      setAssignError("Please select both a vehicle and a driver.");
      return;
    }

    setAssignError(null);
    startTransition(async () => {
      const res = await dispatchDraftTrip(
        assigningTrip.id,
        parseInt(draftVehicleId),
        parseInt(draftDriverId),
        draftEta
      );
      if (res.success) {
        showToast("success", "Trip Dispatched", "Fleet resources assigned and trip dispatched.");
        setAssignDraftDialogOpen(false);
        window.location.reload();
      } else {
        setAssignError(res.error || "An error occurred.");
      }
    });
  };

  // Filters
  const filteredTrips = trips.filter((t) => {
    const tripId = `TR${String(t.id).padStart(3, "0")}`;
    const matchesSearch =
      t.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tripId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getTimelineStep = (status: string) => {
    switch (status) {
      case "Draft":
        return 0;
      case "Dispatched":
        return 1;
      case "In Transit":
        return 2;
      case "Completed":
        return 3;
      case "Cancelled":
        return -1;
      default:
        return 0;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Dispatch Center</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Plan dispatches, verify capacities, and track active trip timelines</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Columns: Board & Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl shadow-sm transition-colors">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Search trip ID, source or destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl pl-9 pr-4 text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-semibold"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-700 dark:text-zinc-300 font-bold focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Drafts</option>
              <option value="Dispatched">Dispatched</option>
              <option value="In Transit">In Transit</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Trips list */}
          <div className="space-y-4">
            {filteredTrips.map((trip) => {
              const step = getTimelineStep(trip.status);
              const tripId = `TR${String(trip.id).padStart(3, "0")}`;

              return (
                <div
                  key={trip.id}
                  className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 space-y-4 shadow-sm transition-all hover:shadow-md animate-slide-in relative overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center font-bold text-xs">
                        <Route className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{tripId}</span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">ETA: {trip.eta || "N/A"}</div>
                      </div>
                    </div>

                    <span
                      className={`text-[8.5px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wide border ${
                        trip.status === "Draft"
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : trip.status === "Dispatched"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-sm shadow-blue-500/5"
                          : trip.status === "In Transit"
                          ? "bg-purple-500/10 text-purple-600 border-purple-500/20 shadow-sm"
                          : trip.status === "Completed"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm"
                          : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                      }`}
                    >
                      {trip.status}
                    </span>
                  </div>

                  {/* Route Grid */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Source</p>
                      <p className="font-bold text-slate-800 dark:text-zinc-200 mt-0.5 truncate">{trip.source}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Destination</p>
                      <p className="font-bold text-slate-800 dark:text-zinc-200 mt-0.5 truncate">{trip.destination}</p>
                    </div>
                  </div>

                  {/* Assigned Resources */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800/80 rounded-xl text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-blue-500 shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-[10px] text-slate-400">Assigned Vehicle</p>
                        <p className="font-bold text-slate-800 dark:text-zinc-200 truncate mt-0.5">
                          {trip.vehicle ? `${trip.vehicle.model} (${trip.vehicle.registrationNumber})` : "Unassigned"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-teal-500 shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-[10px] text-slate-400">Assigned Driver</p>
                        <p className="font-bold text-slate-800 dark:text-zinc-200 truncate mt-0.5">
                          {trip.driver ? trip.driver.name : "Unassigned"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Tracker */}
                  {step !== -1 && (
                    <div className="space-y-1.5 pt-2">
                      <div className="relative flex justify-between text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                        {/* Connecting Line background */}
                        <div className="absolute top-[5px] left-1 right-1 h-0.5 bg-slate-100 dark:bg-zinc-800/80 -z-10"></div>
                        
                        {/* Connecting Line Progress fill */}
                        <div
                          className="absolute top-[5px] left-1 h-0.5 bg-blue-500 transition-all duration-500 -z-10"
                          style={{ width: `${(step / 3) * 100}%` }}
                        ></div>

                        {/* Nodes */}
                        <div className="flex flex-col items-center">
                          <div className={`h-3 w-3 rounded-full border-2 transition-all ${step >= 0 ? "bg-blue-500 border-blue-500" : "bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-800"}`}></div>
                          <span className={`mt-1 font-bold ${step === 0 ? "text-blue-500" : ""}`}>Draft</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className={`h-3 w-3 rounded-full border-2 transition-all ${step >= 1 ? "bg-blue-500 border-blue-500" : "bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-800"}`}></div>
                          <span className={`mt-1 font-bold ${step === 1 ? "text-blue-500" : ""}`}>Dispatched</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className={`h-3 w-3 rounded-full border-2 transition-all ${step >= 2 ? "bg-blue-500 border-blue-500" : "bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-800"}`}></div>
                          <span className={`mt-1 font-bold ${step === 2 ? "text-blue-500" : ""}`}>Transit</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className={`h-3 w-3 rounded-full border-2 transition-all ${step >= 3 ? "bg-emerald-500 border-emerald-500" : "bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-800"}`}></div>
                          <span className={`mt-1 font-bold ${step === 3 ? "text-emerald-500" : ""}`}>Completed</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions buttons */}
                  {trip.status !== "Completed" && trip.status !== "Cancelled" && (
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                      <button
                        onClick={() => handleCancelTrip(trip.id)}
                        className="h-8.5 px-3 border border-slate-200 dark:border-zinc-800 rounded-xl text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Cancel
                      </button>

                      {trip.status === "Draft" && (
                        trip.vehicleId && trip.driverId ? (
                          <button
                            onClick={() => handleDispatch(trip.id)}
                            className="h-8.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-bold transition-colors shadow-md shadow-blue-500/10 flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Dispatch Trip
                          </button>
                        ) : (
                          <button
                            onClick={() => openAssignDraftDialog(trip)}
                            className="h-8.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-[10px] font-bold transition-colors shadow-md shadow-teal-500/10 flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Assign & Dispatch
                          </button>
                        )
                      )}

                      {trip.status === "Dispatched" && (
                        <button
                          onClick={() => handleStartTransit(trip.id)}
                          className="h-8.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-bold transition-colors shadow-md shadow-purple-500/10 flex items-center gap-1 cursor-pointer"
                        >
                          <Compass className="h-3.5 w-3.5 animate-spin" />
                          Start Transit
                        </button>
                      )}

                      {trip.status === "In Transit" && (
                        <button
                          onClick={() => openCompleteDialog(trip)}
                          className="h-8.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold transition-colors shadow-md shadow-emerald-500/10 flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Complete Trip
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredTrips.length === 0 && (
              <div className="p-8 text-center bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-400 dark:text-zinc-500">
                No active dispatches found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dispatch Panel Form */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-5 transition-colors">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-zinc-50 uppercase tracking-wider">Plan Dispatch</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Create a trip draft and allocate fleet resources</p>
          </div>

          <form onSubmit={handleCreateTrip} className="space-y-4">
            {/* Source */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Source Depot/Hub</label>
              <input
                type="text"
                name="source"
                required
                placeholder="Gandhinagar Depot"
                className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-semibold"
              />
            </div>

            {/* Destination */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Destination Hub</label>
              <input
                type="text"
                name="destination"
                required
                placeholder="Surat Hub"
                className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-semibold"
              />
            </div>

            {/* Cargo Weight */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Cargo Weight (kg)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400 text-xs">
                  <Weight className="h-3.5 w-3.5" />
                </span>
                <input
                  type="number"
                  name="cargoWeight"
                  required
                  min="0"
                  placeholder="800"
                  value={cargoWeightVal || ""}
                  onChange={(e) => setCargoWeightVal(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl pl-9 pr-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>
            </div>

            {/* Vehicle Selector */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Select Vehicle</label>
              <select
                name="vehicleId"
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 font-bold"
              >
                <option value="">-- Choose Available Vehicle --</option>
                {vehicles.map((v) => {
                  const isAvailable = v.status === "Available";
                  return (
                    <option key={v.id} value={v.id} disabled={!isAvailable}>
                      {v.model} ({v.registrationNumber}) - Cap: {v.maxCapacity}kg {!isAvailable ? `[${v.status}]` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Capacity Warnings */}
            {weightWarning.status !== "ok" && (
              <div
                className={`p-3 rounded-xl border text-[10px] font-bold flex items-start gap-2 ${
                  weightWarning.status === "error"
                    ? "bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20 text-rose-500"
                    : "bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20 text-amber-500"
                }`}
              >
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{weightWarning.text}</span>
              </div>
            )}

            {/* Driver Selector */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Select Driver</label>
              <select
                name="driverId"
                className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 font-bold"
              >
                <option value="">-- Choose Available Driver --</option>
                {drivers.map((d) => {
                  const today = new Date();
                  const isLicenseExpired = new Date(d.licenseExpiry) <= today;
                  const isSuspended = d.safetyComplianceStatus === "Suspended";
                  const isAvailable = d.activeStatus === "Available" && !isLicenseExpired && !isSuspended;

                  return (
                    <option key={d.id} value={d.id} disabled={!isAvailable}>
                      {d.name} {isLicenseExpired ? "[License Expired]" : isSuspended ? "[Suspended]" : d.activeStatus !== "Available" ? `[${d.activeStatus}]` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Distance */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Planned Distance (km)</label>
              <input
                type="number"
                name="plannedDistance"
                required
                min="1"
                placeholder="45"
                className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>

            {/* ETA */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">ETA Estimate</label>
              <input
                type="text"
                name="eta"
                placeholder="2h 15m"
                className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={isPending || weightWarning.status === "error"}
              className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Save Trip Draft
            </button>
          </form>
        </div>
      </div>

      {/* COMPLETE TRIP POPUP DIALOG */}
      {completeDialogOpen && completingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setCompleteDialogOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-slide-in">
            <form onSubmit={handleCompleteSubmit}>
              <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/20 border-b border-slate-150 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-xs font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">Complete Dispatch</span>
                <button type="button" onClick={() => setCompleteDialogOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {completeError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold flex items-center gap-2 rounded-xl">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                    {completeError}
                  </div>
                )}

                <div className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  Update final odometer readings and total fuel consumed. This will compute fuel efficiency metrics and generate an automated fuel log.
                </div>

                {/* Final Odometer */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">
                    Final Odometer (Initial: {completingTrip.vehicle?.odometer} km)
                  </label>
                  <input
                    type="number"
                    required
                    min={completingTrip.vehicle?.odometer || 0}
                    value={finalOdometerVal || ""}
                    onChange={(e) => setFinalOdometerVal(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>

                {/* Fuel Consumed */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Fuel Consumed (Liters)</label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="0.1"
                    value={fuelConsumedVal || ""}
                    onChange={(e) => setFuelConsumedVal(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-zinc-950/20">
                <button
                  type="button"
                  onClick={() => setCompleteDialogOpen(false)}
                  className="h-9 px-4 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-9 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Processing..." : "Complete & Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Resources Dialog Modal */}
      {assignDraftDialogOpen && assigningTrip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl transition-colors overflow-hidden">
            <form onSubmit={handleAssignDraftSubmit} className="flex flex-col">
              <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-950/20">
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">Assign & Dispatch</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Assign resources to TR{String(assigningTrip.id).padStart(3, "0")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAssignDraftDialogOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {assignError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold flex items-center gap-2 rounded-xl">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                    {assignError}
                  </div>
                )}

                <div className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  Route: <span className="text-slate-800 dark:text-zinc-200 font-bold">{assigningTrip.source} ➔ {assigningTrip.destination}</span> ({assigningTrip.plannedDistance} km)
                  <br />
                  Cargo: <span className="text-slate-800 dark:text-zinc-200 font-bold">{assigningTrip.cargoWeight} kg</span>
                </div>

                {/* Vehicle Selector */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 dark:text-zinc-400 tracking-wider">Select Vehicle</label>
                  <select
                    value={draftVehicleId}
                    onChange={(e) => setDraftVehicleId(e.target.value)}
                    required
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="">-- Choose Available Vehicle --</option>
                    {vehicles.map((v) => {
                      const isAvailable = v.status === "Available";
                      const hasCapacity = v.maxCapacity >= assigningTrip.cargoWeight;
                      return (
                        <option key={v.id} value={v.id} disabled={!isAvailable || !hasCapacity}>
                          {v.model} ({v.registrationNumber}) - Cap: {v.maxCapacity}kg {!hasCapacity ? "[Weight Limit Exceeded]" : !isAvailable ? `[${v.status}]` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Driver Selector */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 dark:text-zinc-400 tracking-wider">Select Driver</label>
                  <select
                    value={draftDriverId}
                    onChange={(e) => setDraftDriverId(e.target.value)}
                    required
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="">-- Choose Available Driver --</option>
                    {drivers.map((d) => {
                      const isAvailable = d.activeStatus === "Available";
                      const isSuspended = d.safetyComplianceStatus === "Suspended";
                      const isExpired = new Date(d.licenseExpiry) <= new Date();
                      return (
                        <option key={d.id} value={d.id} disabled={!isAvailable || isSuspended || isExpired}>
                          {d.name} ({d.licenseCategory}) {isSuspended ? "[Suspended]" : isExpired ? "[License Expired]" : !isAvailable ? `[Busy]` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* ETA */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 dark:text-zinc-400 tracking-wider">ETA Duration</label>
                  <input
                    type="text"
                    value={draftEta}
                    onChange={(e) => setDraftEta(e.target.value)}
                    placeholder="e.g. 45 min, 1h 30m"
                    required
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-zinc-950/20">
                <button
                  type="button"
                  onClick={() => setAssignDraftDialogOpen(false)}
                  className="h-9 px-4 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-9 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Processing..." : "Assign & Dispatch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
