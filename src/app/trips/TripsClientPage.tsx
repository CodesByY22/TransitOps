"use client";

import React, { useState } from "react";
import { createTrip, completeTrip, cancelTrip, ActionResponse } from "@/features/trips/actions";
import { AlertCircle, CheckCircle2, XCircle, Trash2, Check } from "lucide-react";

interface Vehicle {
  id: number;
  registrationNumber: string;
  model: string;
  type: string;
  maxCapacity: number;
  odometer: number;
  status: string;
  region: string | null;
}

interface Driver {
  id: number;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: Date;
  contactNumber: string;
  safetyComplianceStatus: string;
  activeStatus: string;
}

interface Trip {
  id: number;
  source: string;
  destination: string;
  vehicleId: number | null;
  driverId: number | null;
  cargoWeight: number;
  plannedDistance: number;
  status: string;
  eta: string | null;
  vehicle?: Vehicle | null;
  driver?: Driver | null;
}

interface TripsClientPageProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
}

export default function TripsClientPage({ vehicles, drivers, trips }: TripsClientPageProps) {
  // Form state
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [cargoWeight, setCargoWeight] = useState<number>(0);
  const [plannedDistance, setPlannedDistance] = useState<number>(0);
  const [status, setStatus] = useState<"Draft" | "Dispatched">("Draft");
  const [eta, setEta] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [completingTripId, setCompletingTripId] = useState<number | null>(null);
  const [finalOdometer, setFinalOdometer] = useState<number>(0);
  const [fuelConsumed, setFuelConsumed] = useState<number>(0);

  // Client-side validations helper
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const selectedDriver = drivers.find((d) => d.id === driverId);

  const isWeightExceeded = selectedVehicle && cargoWeight > selectedVehicle.maxCapacity;
  const isDriverSuspended = selectedDriver && selectedDriver.safetyComplianceStatus === "Suspended";
  const isDriverLicenseExpired = selectedDriver && new Date(selectedDriver.licenseExpiry) < new Date();
  const isDriverBusy = selectedDriver && selectedDriver.activeStatus === "On Trip";
  const isVehicleBusy = selectedVehicle && selectedVehicle.status !== "Available" && selectedVehicle.status !== "Retired";

  // Form submit
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!source || !destination) {
      setNotification({ type: "error", message: "Source and Destination routes are required." });
      return;
    }

    if (status === "Dispatched") {
      if (!vehicleId || !driverId) {
        setNotification({ type: "error", message: "Both vehicle and driver must be assigned to dispatch a trip." });
        return;
      }
      if (isWeightExceeded || isDriverSuspended || isDriverLicenseExpired || isDriverBusy || isVehicleBusy) {
        setNotification({ type: "error", message: "Cannot dispatch: Fix blocking compliance validation errors first." });
        return;
      }
    }

    setLoading(true);
    const res = await createTrip({
      source,
      destination,
      vehicleId,
      driverId,
      cargoWeight,
      plannedDistance,
      status,
      eta: eta || "Flexible",
    });
    setLoading(false);

    if (res.success) {
      setNotification({ type: "success", message: res.message });
      // Reset form
      setSource("");
      setDestination("");
      setVehicleId(null);
      setDriverId(null);
      setCargoWeight(0);
      setPlannedDistance(0);
      setStatus("Draft");
      setEta("");
    } else {
      setNotification({ type: "error", message: res.message });
    }
  };

  // Complete trip
  const handleCompleteTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTripId) return;

    setLoading(true);
    const res = await completeTrip(completingTripId, finalOdometer, fuelConsumed);
    setLoading(false);

    if (res.success) {
      setNotification({ type: "success", message: res.message });
      setCompletingTripId(null);
      setFinalOdometer(0);
      setFuelConsumed(0);
    } else {
      setNotification({ type: "error", message: res.message });
    }
  };

  // Cancel trip
  const handleCancelTrip = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this trip? All assigned vehicle/driver assets will be released.")) return;

    setLoading(true);
    const res = await cancelTrip(id);
    setLoading(false);

    if (res.success) {
      setNotification({ type: "success", message: res.message });
    } else {
      setNotification({ type: "error", message: res.message });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#09090b]">
      {/* Title */}
      <div className="border-b border-zinc-900 pb-5">
        <h2 className="text-2xl font-bold text-white tracking-tight">Trip Dispatch Board</h2>
        <p className="text-sm text-zinc-500 mt-1">Schedule new routes, allocate vehicle weight capacity, and manage driver logs.</p>
      </div>

      {/* Action Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            notification.type === "success"
              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/5 border-rose-500/20 text-rose-400"
          }`}
        >
          {notification.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span className="text-xs font-semibold leading-relaxed">{notification.message}</span>
        </div>
      )}

      {/* Grid: Dispatcher Form + Active Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Left Side: Create Trip Form */}
        <div className="lg:col-span-2 bg-[#09090b] border border-zinc-900 p-6 rounded-2xl space-y-6">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">Plan New Dispatch</h3>
            <p className="text-xs text-zinc-500 mt-1">Create drafts or dispatch vehicles immediately</p>
          </div>

          <form onSubmit={handleCreateTrip} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">Source Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gandhinagar Depot"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] hover:border-zinc-700 focus:border-zinc-500 rounded-lg h-9 px-3 text-xs text-zinc-100 focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">Destination</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmedabad Hub"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] hover:border-zinc-700 focus:border-zinc-500 rounded-lg h-9 px-3 text-xs text-zinc-100 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">Cargo Weight (kg)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={cargoWeight || ""}
                  onChange={(e) => setCargoWeight(Number(e.target.value))}
                  className="w-full bg-[#09090b] border border-[#27272a] hover:border-zinc-700 focus:border-zinc-500 rounded-lg h-9 px-3 text-xs text-zinc-100 focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">Planned Distance (km)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={plannedDistance || ""}
                  onChange={(e) => setPlannedDistance(Number(e.target.value))}
                  className="w-full bg-[#09090b] border border-[#27272a] hover:border-zinc-700 focus:border-zinc-500 rounded-lg h-9 px-3 text-xs text-zinc-100 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">Assign Vehicle</label>
              <select
                value={vehicleId || ""}
                onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-[#09090b] border border-[#27272a] hover:border-zinc-700 focus:border-zinc-500 rounded-lg h-9 px-3 text-xs text-zinc-100 focus:outline-none cursor-pointer transition"
              >
                <option value="">Awaiting Vehicle (Optional for Draft)</option>
                {vehicles.map((v) => {
                  const isBusy = v.status !== "Available";
                  return (
                    <option key={v.id} value={v.id} disabled={v.status === "Retired"}>
                      {v.model} - {v.registrationNumber} (Max: {v.maxCapacity} kg) {isBusy ? `[${v.status}]` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">Assign Driver</label>
              <select
                value={driverId || ""}
                onChange={(e) => setDriverId(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-[#09090b] border border-[#27272a] hover:border-zinc-700 focus:border-zinc-500 rounded-lg h-9 px-3 text-xs text-zinc-100 focus:outline-none cursor-pointer transition"
              >
                <option value="">Awaiting Driver (Optional for Draft)</option>
                {drivers.map((d) => {
                  const isBusy = d.activeStatus !== "Available";
                  const isSuspended = d.safetyComplianceStatus === "Suspended";
                  const isExpired = new Date(d.licenseExpiry) < new Date();
                  return (
                    <option key={d.id} value={d.id} disabled={isSuspended || isExpired}>
                      {d.name} ({d.licenseCategory}) {isBusy ? `[On Trip]` : ""} {isSuspended ? `[Suspended]` : ""} {isExpired ? `[Expired]` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">Dispatch Mode</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "Draft" | "Dispatched")}
                  className="w-full bg-[#09090b] border border-[#27272a] hover:border-zinc-700 focus:border-zinc-500 rounded-lg h-9 px-3 text-xs text-zinc-100 focus:outline-none cursor-pointer transition"
                >
                  <option value="Draft">Save as Draft</option>
                  <option value="Dispatched">Dispatch Immediately</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">ETA / Time Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 45 min, 1h 30m"
                  value={eta}
                  onChange={(e) => setEta(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] hover:border-zinc-700 focus:border-zinc-500 rounded-lg h-9 px-3 text-xs text-zinc-100 focus:outline-none transition"
                />
              </div>
            </div>

            {/* REAL-TIME CLIENT VALIDATION WARNINGS (Rose color highlights) */}
            {(isWeightExceeded || isDriverSuspended || isDriverLicenseExpired || isDriverBusy || isVehicleBusy) && (
              <div className="p-3 bg-rose-500/5 border border-rose-500/20 text-rose-400 rounded-xl space-y-1.5 text-xs font-semibold leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-rose-500 font-mono">
                  <XCircle className="h-4 w-4" />
                  <span>Validation Warning</span>
                </div>
                {isWeightExceeded && (
                  <p>• Weight Limit Exceeded: Cargo weight ({cargoWeight} kg) exceeds vehicle capacity ({selectedVehicle?.maxCapacity} kg).</p>
                )}
                {isDriverSuspended && (
                  <p>• Driver compliance error: The selected driver is currently suspended.</p>
                )}
                {isDriverLicenseExpired && (
                  <p>• Driver license expired: Driver's license has expired.</p>
                )}
                {isDriverBusy && (
                  <p>• Driver double-booking: Driver is already assigned to an active trip.</p>
                )}
                {isVehicleBusy && (
                  <p>• Vehicle busy: Selected vehicle is currently active on route (Status: {selectedVehicle?.status}).</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (status === "Dispatched" && (isWeightExceeded || isDriverSuspended || isDriverLicenseExpired || isDriverBusy || isVehicleBusy))}
              className="w-full bg-zinc-100 hover:bg-white text-black h-9 rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Processing..." : status === "Dispatched" ? "Confirm & Dispatch" : "Save Trip Draft"}
            </button>
          </form>
        </div>

        {/* Right Side: Active Trips Table Monitor */}
        <div className="lg:col-span-3 bg-[#09090b] border border-zinc-900 p-6 rounded-2xl space-y-6">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">Dispatched Trips Feed</h3>
            <p className="text-xs text-zinc-500 mt-1">Complete or cancel active route dispatches</p>
          </div>

          {/* Table List of Trips */}
          <div className="overflow-x-auto rounded-lg border border-zinc-900 bg-zinc-950/20">
            <table className="w-full text-left text-xs text-zinc-300 border-collapse">
              <thead className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 bg-[#0c0c0e] border-b border-zinc-900">
                <tr>
                  <th className="py-3 px-4">Trip</th>
                  <th className="py-3 px-4">Route Info</th>
                  <th className="py-3 px-4">Assigned Assets</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {trips.map((trip) => {
                  const tripId = `TR${String(trip.id).padStart(3, "0")}`;
                  const isActive = trip.status === "Dispatched" || trip.status === "On Trip";

                  return (
                    <tr key={trip.id} className="hover:bg-zinc-900/40 transition duration-150">
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-200">{tripId}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-200">{trip.source}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">➔ {trip.destination}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-zinc-200 font-semibold">{trip.vehicle?.model || "—"}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{trip.driver?.name || "—"}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            isActive
                              ? "text-blue-400 bg-blue-500/5 border-blue-500/20"
                              : trip.status === "Completed"
                              ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/20"
                              : trip.status === "Cancelled"
                              ? "text-rose-400 bg-rose-500/5 border-rose-500/20"
                              : "text-zinc-400 bg-zinc-800/40 border-zinc-800"
                          }`}
                        >
                          {trip.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isActive ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setCompletingTripId(trip.id);
                                setFinalOdometer((trip.vehicle?.odometer || 0) + trip.plannedDistance);
                              }}
                              className="h-7 w-7 rounded bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 flex items-center justify-center transition"
                              title="Complete Trip"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCancelTrip(trip.id)}
                              className="h-7 w-7 rounded bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 flex items-center justify-center transition"
                              title="Cancel Trip"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Completion Dialog Modal */}
      {completingTripId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#09090b] border border-zinc-900 p-6 rounded-2xl w-full max-w-md space-y-6 shadow-2xl">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">Complete Active Trip</h3>
              <p className="text-xs text-zinc-500 mt-1">Log final vehicle stats and odometer readings</p>
            </div>

            <form onSubmit={handleCompleteTrip} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">Final Odometer Reading (km)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={finalOdometer || ""}
                  onChange={(e) => setFinalOdometer(Number(e.target.value))}
                  className="w-full bg-[#09090b] border border-[#27272a] focus:border-zinc-500 rounded-lg h-9 px-3 text-xs text-zinc-100 focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">Fuel Consumed (Liters)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  value={fuelConsumed || ""}
                  onChange={(e) => setFuelConsumed(Number(e.target.value))}
                  className="w-full bg-[#09090b] border border-[#27272a] focus:border-zinc-500 rounded-lg h-9 px-3 text-xs text-zinc-100 focus:outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingTripId(null)}
                  className="px-4 h-9 bg-zinc-950 border border-zinc-900 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 h-9 bg-zinc-100 hover:bg-white text-black rounded-lg text-xs font-bold transition"
                >
                  {loading ? "Completing..." : "Confirm & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
