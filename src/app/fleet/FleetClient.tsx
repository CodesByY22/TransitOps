"use client";

import React, { useState, useTransition, useEffect } from "react";
import { createVehicle, updateVehicle, deleteVehicle, FleetActionState } from "@/features/fleet/actions";
import { useToast } from "@/components/Toast";
import {
  Plus,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  Gauge,
  DollarSign,
  TrendingUp,
  MapPin,
  Calendar,
  AlertCircle,
  Clock,
  Eye,
  Fuel,
} from "lucide-react";

interface FuelLog {
  id: number;
  liters: number;
  cost: number;
  date: Date;
}

interface MaintenanceLog {
  id: number;
  description: string;
  cost: number;
  startDate: Date;
  status: string;
}

interface Trip {
  id: number;
  source: string;
  destination: string;
  cargoWeight: number;
  plannedDistance: number;
  status: string;
}

interface Vehicle {
  id: number;
  registrationNumber: string;
  model: string;
  type: string;
  maxCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: string;
  region: string | null;
  fuelLogs: FuelLog[];
  maintenanceLogs: MaintenanceLog[];
  trips: Trip[];
}

interface FleetSelectProps {
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

function FleetSelect({ value, options, onChange }: FleetSelectProps) {
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
    <div className="relative min-w-[130px]" ref={containerRef}>
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

export default function FleetClient({ initialVehicles }: { initialVehicles: Vehicle[] }) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Drawer states
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Selected item states
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Form error states
  const [formError, setFormError] = useState<string | null>(null);

  // Filter vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "All" || v.type === typeFilter;
    const matchesStatus = statusFilter === "All" || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Submit Handler for Add
  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const res = await createVehicle(null, formData);
      if (res.success) {
        showToast("success", "Vehicle Added", `Successfully registered ${formData.get("registrationNumber")}.`);
        setAddOpen(false);
        // Refresh local state (simple full reload Simulation or state update)
        window.location.reload();
      } else {
        setFormError(res.error || "An error occurred.");
      }
    });
  };

  // Submit Handler for Edit
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    setFormError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateVehicle(selectedVehicle.id, formData);
      if (res.success) {
        showToast("success", "Vehicle Updated", `Successfully modified details for ${selectedVehicle.registrationNumber}.`);
        setEditOpen(false);
        window.location.reload();
      } else {
        setFormError(res.error || "An error occurred.");
      }
    });
  };

  // Submit Handler for Delete
  const handleDeleteConfirm = async () => {
    if (!selectedVehicle) return;
    startTransition(async () => {
      const res = await deleteVehicle(selectedVehicle.id);
      if (res.success) {
        showToast("success", "Vehicle Deleted", `Successfully removed vehicle ${selectedVehicle.registrationNumber}.`);
        setDeleteOpen(false);
        window.location.reload();
      } else {
        showToast("error", "Delete Failed", res.error || "Could not delete vehicle.");
      }
    });
  };

  // Calculate Metrics helper
  const calculateVehicleMetrics = (vehicle: Vehicle) => {
    const totalFuelCost = vehicle.fuelLogs.reduce((sum, log) => sum + log.cost, 0);
    const totalLiters = vehicle.fuelLogs.reduce((sum, log) => sum + log.liters, 0);
    const totalMaintenanceCost = vehicle.maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);

    // Calculate revenue using cargoWeight * 1.5 + plannedDistance * 12 for completed trips
    const completedTrips = vehicle.trips.filter((t) => t.status === "Completed");
    const totalRevenue = completedTrips.reduce(
      (sum, trip) => sum + (trip.cargoWeight * 1.5 + trip.plannedDistance * 12),
      0
    );

    // ROI
    const netProfit = totalRevenue - (totalFuelCost + totalMaintenanceCost);
    const roi = vehicle.acquisitionCost > 0 ? (netProfit / vehicle.acquisitionCost) * 100 : 0;

    // Fuel Efficiency (Odometer / Fuel Consumed) - we'll simulate based on completed trips if available
    const totalTripsDistance = completedTrips.reduce((sum, t) => sum + t.plannedDistance, 0);
    const fuelEfficiency = totalLiters > 0 ? (totalTripsDistance / totalLiters).toFixed(2) : "—";

    return {
      totalFuelCost,
      totalLiters,
      totalMaintenanceCost,
      totalRevenue,
      netProfit,
      roi: roi.toFixed(1),
      fuelEfficiency,
      completedTripsCount: completedTrips.length,
      allTripsCount: vehicle.trips.length,
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "On Trip":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "In Shop":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "Retired":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Fleet Registry</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Manage and audit company vehicles and operational ROI</p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setAddOpen(true);
          }}
          className="self-start h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-blue-600/10 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Vehicle
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl shadow-sm transition-colors">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Search by registration number or model..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl pl-9 pr-4 text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all font-semibold"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            <FleetSelect
              value={typeFilter}
              options={[
                { label: "All Types", value: "All" },
                { label: "Vans", value: "Van" },
                { label: "Trucks", value: "Truck" },
                { label: "Mini Trucks", value: "Mini" },
              ]}
              onChange={(val) => {
                setTypeFilter(val);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Status Filter */}
          <FleetSelect
            value={statusFilter}
            options={[
              { label: "All Status", value: "All" },
              { label: "Available", value: "Available" },
              { label: "On Trip", value: "On Trip" },
              { label: "In Shop", value: "In Shop" },
              { label: "Retired", value: "Retired" },
            ]}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl overflow-hidden shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900/40 border-b border-slate-200 dark:border-[#1E293B]">
              <tr>
                <th className="py-4 px-6">Reg Number</th>
                <th className="py-4 px-6">Model</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Max Capacity</th>
                <th className="py-4 px-6">Odometer</th>
                <th className="py-4 px-6">Acquisition Cost</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {paginatedVehicles.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  onClick={() => {
                    setSelectedVehicle(vehicle);
                    setDetailOpen(true);
                  }}
                  className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition duration-150 group cursor-pointer"
                >
                  <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-zinc-200 group-hover:text-blue-500 transition-colors">
                    {vehicle.registrationNumber}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-700 dark:text-zinc-300">
                    {vehicle.model}
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-500 dark:text-zinc-400">
                    {vehicle.type}
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-500 dark:text-zinc-400">
                    {vehicle.maxCapacity.toLocaleString()} kg
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-slate-600 dark:text-zinc-300">
                    {vehicle.odometer.toLocaleString()} km
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-slate-700 dark:text-zinc-300">
                    ₹{vehicle.acquisitionCost.toLocaleString()}
                  </td>
                  <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                    <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide border ${getStatusBadge(vehicle.status)}`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setFormError(null);
                        setEditOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 border border-slate-200 dark:border-zinc-700 transition-colors"
                      title="Edit Vehicle"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setDeleteOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-rose-50/50 hover:bg-rose-100 dark:bg-rose-500/5 dark:hover:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-500 hover:text-rose-600 transition-colors"
                      title="Delete Vehicle"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedVehicles.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                    No vehicles found matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-[#1E293B] flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/10">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">
              Showing page {currentPage} of {totalPages} ({filteredVehicles.length} total vehicles)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="h-8 w-8 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-500 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="h-8 w-8 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-500 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL INSPECTION PANEL SLIDE-OVER */}
      {detailOpen && selectedVehicle && (() => {
        const metrics = calculateVehicleMetrics(selectedVehicle);
        return (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setDetailOpen(false)}></div>
            <div className="relative w-full max-w-md bg-white dark:bg-[#0B0F19] border-l border-slate-200 dark:border-[#1E293B] shadow-2xl h-full overflow-y-auto flex flex-col justify-between animate-slide-in">
              <div>
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-[#1E293B] flex justify-between items-center bg-slate-50/50 dark:bg-zinc-950/20">
                  <div>
                    <span className="text-[9px] font-mono font-bold bg-blue-600/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded">
                      {selectedVehicle.type}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-zinc-50 mt-1.5">{selectedVehicle.registrationNumber}</h3>
                    <p className="text-xs text-slate-400">{selectedVehicle.model}</p>
                  </div>
                  <button onClick={() => setDetailOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-6">
                  {/* Status Grid */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800/80 rounded-xl">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">Status</p>
                      <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border mt-1.5 ${getStatusBadge(selectedVehicle.status)}`}>
                        {selectedVehicle.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">Region</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-zinc-200 mt-1 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-blue-500" />
                        {selectedVehicle.region || "West"}
                      </p>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Operational Metrics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Odometer */}
                      <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-900 rounded-xl">
                        <Gauge className="h-4 w-4 text-blue-500" />
                        <p className="text-[9px] font-semibold text-slate-400 mt-2">Odometer</p>
                        <p className="text-sm font-black text-slate-900 dark:text-zinc-200 mt-0.5 font-mono">{selectedVehicle.odometer.toLocaleString()} km</p>
                      </div>

                      {/* ROI */}
                      <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-900 rounded-xl">
                        <TrendingUp className="h-4 w-4 text-teal-500" />
                        <p className="text-[9px] font-semibold text-slate-400 mt-2">Calculated ROI</p>
                        <p className="text-sm font-black text-teal-500 mt-0.5 font-mono">{metrics.roi}%</p>
                      </div>

                      {/* Fuel Efficiency */}
                      <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-900 rounded-xl">
                        <Fuel className="h-4 w-4 text-purple-500" />
                        <p className="text-[9px] font-semibold text-slate-400 mt-2">Avg Efficiency</p>
                        <p className="text-sm font-black text-slate-900 dark:text-zinc-200 mt-0.5 font-mono">{metrics.fuelEfficiency} km/L</p>
                      </div>

                      {/* Total Trips */}
                      <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-900 rounded-xl">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <p className="text-[9px] font-semibold text-slate-400 mt-2">Total Trips</p>
                        <p className="text-sm font-black text-slate-900 dark:text-zinc-200 mt-0.5 font-mono">{metrics.allTripsCount}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Cost vs Revenue Audit</h4>
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs font-semibold text-slate-600 dark:text-zinc-400 space-y-2.5">
                      <div className="flex justify-between pt-2">
                        <span>Acquisition Cost</span>
                        <span className="font-mono text-slate-800 dark:text-zinc-200">₹{selectedVehicle.acquisitionCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span>Total Revenue Generated</span>
                        <span className="font-mono text-emerald-500 font-bold">₹{metrics.totalRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span>Total Maintenance Service Costs</span>
                        <span className="font-mono text-rose-500">₹{metrics.totalMaintenanceCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span>Total Fuel Costs</span>
                        <span className="font-mono text-rose-500">₹{metrics.totalFuelCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-dashed border-slate-200 dark:border-zinc-800 font-bold text-slate-900 dark:text-zinc-200">
                        <span>Net Profitability</span>
                        <span className={`font-mono ${metrics.netProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                          ₹{metrics.netProfit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 dark:border-[#1E293B] bg-slate-50/50 dark:bg-zinc-950/20 flex gap-3">
                <button
                  onClick={() => {
                    setDetailOpen(false);
                    setEditOpen(true);
                  }}
                  className="flex-1 h-10 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Edit Vehicle
                </button>
                <button
                  onClick={() => {
                    setDetailOpen(false);
                    setDeleteOpen(true);
                  }}
                  className="flex-1 h-10 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/15 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ADD VEHICLE SLIDE-OUT DRAWER */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setAddOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-[#0B0F19] border-l border-slate-200 dark:border-[#1E293B] shadow-2xl h-full flex flex-col justify-between animate-slide-in">
            <form onSubmit={handleAddSubmit} className="h-full flex flex-col justify-between">
              <div>
                <div className="p-6 border-b border-slate-200 dark:border-[#1E293B] flex justify-between items-center bg-slate-50/50 dark:bg-zinc-950/20">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-zinc-50">Register New Vehicle</h3>
                    <p className="text-xs text-slate-400">Add an operational vehicle to the fleet registry</p>
                  </div>
                  <button type="button" onClick={() => setAddOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto">
                  {formError && (
                    <div className="p-3.5 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4.5 w-4.5" />
                      {formError}
                    </div>
                  )}

                  {/* Reg Number */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Registration Number</label>
                    <input
                      type="text"
                      name="registrationNumber"
                      required
                      placeholder="GJ01AB1234"
                      className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-bold uppercase"
                    />
                  </div>

                  {/* Model */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Vehicle Model</label>
                    <input
                      type="text"
                      name="model"
                      required
                      placeholder="TRUCK-12 or VAN-03"
                      className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Vehicle Type</label>
                    <select
                      name="type"
                      required
                      className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 font-bold"
                    >
                      <option value="Van">Van</option>
                      <option value="Truck">Truck</option>
                      <option value="Mini">Mini Truck</option>
                    </select>
                  </div>

                  {/* Capacity */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Max Capacity (kg)</label>
                    <input
                      type="number"
                      name="maxCapacity"
                      required
                      min="1"
                      placeholder="1500"
                      className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                    />
                  </div>

                  {/* Odometer */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Current Odometer (km)</label>
                    <input
                      type="number"
                      name="odometer"
                      required
                      min="0"
                      placeholder="12000"
                      className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                    />
                  </div>

                  {/* Acquisition Cost */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Acquisition Cost (₹)</label>
                    <input
                      type="number"
                      name="acquisitionCost"
                      required
                      min="1"
                      placeholder="500000"
                      className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                    />
                  </div>

                  {/* Region */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Region</label>
                    <select
                      name="region"
                      required
                      className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 font-bold"
                    >
                      <option value="West">West</option>
                      <option value="North">North</option>
                      <option value="East">East</option>
                      <option value="South">South</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Operational Status</label>
                    <select
                      name="status"
                      required
                      className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 font-bold"
                    >
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="In Shop">In Shop</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="p-6 border-t border-slate-200 dark:border-[#1E293B] bg-slate-50/50 dark:bg-zinc-950/20 flex gap-3">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="flex-1 h-10 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-blue-600/10 disabled:opacity-50"
                >
                  {isPending ? "Submitting..." : "Add Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VEHICLE SLIDE-OUT DRAWER */}
      {editOpen && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setEditOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-[#0B0F19] border-l border-slate-200 dark:border-[#1E293B] shadow-2xl h-full flex flex-col justify-between animate-slide-in">
            <form onSubmit={handleEditSubmit} className="h-full flex flex-col justify-between">
              <div>
                <div className="p-6 border-b border-slate-200 dark:border-[#1E293B] flex justify-between items-center bg-slate-50/50 dark:bg-zinc-950/20">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-zinc-50">Edit Vehicle</h3>
                    <p className="text-xs text-slate-400">Modify details for vehicle: {selectedVehicle.registrationNumber}</p>
                  </div>
                  <button type="button" onClick={() => setEditOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto">
                  {formError && (
                    <div className="p-3.5 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4.5 w-4.5" />
                      {formError}
                    </div>
                  )}

                  {/* Reg Number */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Registration Number</label>
                    <input
                      type="text"
                      name="registrationNumber"
                      required
                      defaultValue={selectedVehicle.registrationNumber}
                      className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-bold uppercase"
                    />
                  </div>

                  {/* Model */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Vehicle Model</label>
                    <input
                      type="text"
                      name="model"
                      required
                      defaultValue={selectedVehicle.model}
                      className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Vehicle Type</label>
                    <select
                      name="type"
                      required
                      defaultValue={selectedVehicle.type}
                      className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 font-bold"
                    >
                      <option value="Van">Van</option>
                      <option value="Truck">Truck</option>
                      <option value="Mini">Mini Truck</option>
                    </select>
                  </div>

                  {/* Capacity */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Max Capacity (kg)</label>
                    <input
                      type="number"
                      name="maxCapacity"
                      required
                      min="1"
                      defaultValue={selectedVehicle.maxCapacity}
                      className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                    />
                  </div>

                  {/* Odometer */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Current Odometer (km)</label>
                    <input
                      type="number"
                      name="odometer"
                      required
                      min="0"
                      defaultValue={selectedVehicle.odometer}
                      className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                    />
                  </div>

                  {/* Acquisition Cost */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Acquisition Cost (₹)</label>
                    <input
                      type="number"
                      name="acquisitionCost"
                      required
                      min="1"
                      defaultValue={selectedVehicle.acquisitionCost}
                      className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                    />
                  </div>

                  {/* Region */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Region</label>
                    <select
                      name="region"
                      required
                      defaultValue={selectedVehicle.region || "West"}
                      className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 font-bold"
                    >
                      <option value="West">West</option>
                      <option value="North">North</option>
                      <option value="East">East</option>
                      <option value="South">South</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Operational Status</label>
                    <select
                      name="status"
                      required
                      defaultValue={selectedVehicle.status}
                      className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 font-bold"
                    >
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="In Shop">In Shop</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="p-6 border-t border-slate-200 dark:border-[#1E293B] bg-slate-50/50 dark:bg-zinc-950/20 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="flex-1 h-10 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-blue-600/10 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG MODAL */}
      {deleteOpen && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setDeleteOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6 space-y-4 animate-slide-in">
            <div className="flex items-start gap-3 text-rose-500">
              <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-zinc-150">Confirm Deletion</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mt-1">
                  Are you absolutely sure you want to delete vehicle <strong className="font-extrabold text-slate-800 dark:text-zinc-300">{selectedVehicle.registrationNumber}</strong>? 
                  This will also purge all linked maintenance records, fuel logs, and historical trips. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteOpen(false)}
                className="h-9 px-4 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="h-9 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete Vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
