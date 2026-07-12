"use client";

import React, { useState, useTransition } from "react";
import { createDriver, updateDriver, deleteDriver, DriverActionState } from "@/features/drivers/actions";
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
  AlertTriangle,
  AlertCircle,
  Phone,
  Award,
  Calendar,
  ShieldCheck,
} from "lucide-react";

interface Driver {
  id: number;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: Date;
  contactNumber: string;
  tripCompletionRate: number;
  safetyComplianceStatus: string;
  activeStatus: string;
}

export default function DriverClient({ initialDrivers }: { initialDrivers: Driver[] }) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals state
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Selected driver
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Form error
  const [formError, setFormError] = useState<string | null>(null);

  // Date constants for expiry checks
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  // Filtering
  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || d.licenseCategory === categoryFilter;
    const matchesStatus = statusFilter === "All" || d.activeStatus === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
  const paginatedDrivers = filteredDrivers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getLicenseExpiryDetails = (expiryDateVal: Date | string) => {
    const expiry = new Date(expiryDateVal);
    const timeDiff = expiry.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) {
      return { label: "Expired", className: "text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-500/5 px-2 py-1 rounded-md border border-rose-200 dark:border-rose-500/20" };
    } else if (daysDiff <= 30) {
      return { label: `Expiring in ${daysDiff}d`, className: "text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-500/5 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-500/20" };
    }
    return { label: expiry.toLocaleDateString(), className: "text-slate-600 dark:text-zinc-400 font-semibold" };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "On Trip":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "Off Duty":
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
      case "Suspended":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
    }
  };

  // Submit Add
  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createDriver(null, formData);
      if (res.success) {
        showToast("success", "Driver Registered", `Successfully registered ${formData.get("name")}.`);
        setAddOpen(false);
        window.location.reload();
      } else {
        setFormError(res.error || "An error occurred.");
      }
    });
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDriver) return;
    setFormError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateDriver(selectedDriver.id, formData);
      if (res.success) {
        showToast("success", "Driver Updated", `Successfully modified details for ${selectedDriver.name}.`);
        setEditOpen(false);
        window.location.reload();
      } else {
        setFormError(res.error || "An error occurred.");
      }
    });
  };

  // Submit Delete
  const handleDeleteConfirm = async () => {
    if (!selectedDriver) return;
    startTransition(async () => {
      const res = await deleteDriver(selectedDriver.id);
      if (res.success) {
        showToast("success", "Driver Removed", `Successfully deleted driver ${selectedDriver.name}.`);
        setDeleteOpen(false);
        window.location.reload();
      } else {
        showToast("error", "Delete Failed", res.error || "Could not delete driver.");
      }
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Driver Registry</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Manage personnel, safety scores, and license compliance</p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setAddOpen(true);
          }}
          className="self-start h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-blue-600/10 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Driver
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
            placeholder="Search by driver name or license number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl pl-9 pr-4 text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all font-semibold"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* License Filter */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-700 dark:text-zinc-300 font-bold focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Licenses</option>
              <option value="LMV">LMV (Light Vehicles)</option>
              <option value="HMV">HMV (Heavy Vehicles)</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-700 dark:text-zinc-300 font-bold focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Status</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="Off Duty">Off Duty</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl overflow-hidden shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900/40 border-b border-slate-200 dark:border-[#1E293B]">
              <tr>
                <th className="py-4 px-6">Driver</th>
                <th className="py-4 px-6">License Number</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Expiry Date</th>
                <th className="py-4 px-6">Contact Number</th>
                <th className="py-4 px-6">Safety Score</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {paginatedDrivers.map((driver) => {
                const initials = driver.name.split(" ").map((n) => n[0]).join("").toUpperCase();
                const expiryDetails = getLicenseExpiryDetails(driver.licenseExpiry);

                return (
                  <tr key={driver.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition duration-150">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-500/20">
                        {initials}
                      </div>
                      <div className="font-bold text-slate-900 dark:text-zinc-200">{driver.name}</div>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-500 dark:text-zinc-400">
                      {driver.licenseNumber}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-500 dark:text-zinc-400">
                      {driver.licenseCategory}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block ${expiryDetails.className}`}>
                        {expiryDetails.label}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 mt-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {driver.contactNumber}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Award className={`h-4 w-4 ${driver.tripCompletionRate >= 90 ? "text-emerald-500" : driver.tripCompletionRate >= 80 ? "text-amber-500" : "text-rose-500"}`} />
                        <span className="text-slate-900 dark:text-zinc-200">{driver.tripCompletionRate}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide border ${getStatusBadge(driver.activeStatus)}`}>
                        {driver.activeStatus}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedDriver(driver);
                          setFormError(null);
                          setEditOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 border border-slate-200 dark:border-zinc-700 transition-colors"
                        title="Edit Driver"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDriver(driver);
                          setDeleteOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-rose-50/50 hover:bg-rose-100 dark:bg-rose-500/5 dark:hover:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-500 hover:text-rose-600 transition-colors"
                        title="Delete Driver"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginatedDrivers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                    No drivers registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-[#1E293B] flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/10">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">
              Showing page {currentPage} of {totalPages} ({filteredDrivers.length} drivers)
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

      {/* ADD DRIVER DIALOG MODAL */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setAddOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl shadow-xl overflow-hidden animate-slide-in">
            <form onSubmit={handleAddSubmit}>
              <div className="p-6 border-b border-slate-200 dark:border-[#1E293B] flex justify-between items-center bg-slate-50/50 dark:bg-zinc-950/20">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-zinc-50">Register New Driver</h3>
                  <p className="text-xs text-slate-400">Add an operator to the driver registry</p>
                </div>
                <button type="button" onClick={() => setAddOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {formError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4.5 w-4.5" />
                    {formError}
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Driver Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Suresh Kumar"
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* License Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    required
                    placeholder="DL-12345"
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-bold uppercase"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">License Category</label>
                  <select
                    name="licenseCategory"
                    required
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="LMV">LMV (Light Vehicles)</option>
                    <option value="HMV">HMV (Heavy Trucks)</option>
                  </select>
                </div>

                {/* License Expiry */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">License Expiry Date</label>
                  <input
                    type="date"
                    name="licenseExpiry"
                    required
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Contact Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Contact Number</label>
                  <input
                    type="text"
                    name="contactNumber"
                    required
                    placeholder="98765xxxxx"
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Safety Score */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Safety Score</label>
                  <input
                    type="number"
                    name="safetyScore"
                    required
                    min="0"
                    max="100"
                    defaultValue="100"
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Active Status */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Duty Status</label>
                  <select
                    name="activeStatus"
                    required
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-[#1E293B] bg-slate-50/50 dark:bg-zinc-950/20 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="h-10 px-4 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-blue-600/10 cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Submitting..." : "Add Driver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DRIVER DIALOG MODAL */}
      {editOpen && selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setEditOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl shadow-xl overflow-hidden animate-slide-in">
            <form onSubmit={handleEditSubmit}>
              <div className="p-6 border-b border-slate-200 dark:border-[#1E293B] flex justify-between items-center bg-slate-50/50 dark:bg-zinc-950/20">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-zinc-50">Edit Driver</h3>
                  <p className="text-xs text-slate-400">Modify details for: {selectedDriver.name}</p>
                </div>
                <button type="button" onClick={() => setEditOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {formError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4.5 w-4.5" />
                    {formError}
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Driver Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={selectedDriver.name}
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* License Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    required
                    defaultValue={selectedDriver.licenseNumber}
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-bold uppercase"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">License Category</label>
                  <select
                    name="licenseCategory"
                    required
                    defaultValue={selectedDriver.licenseCategory}
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="LMV">LMV (Light Vehicles)</option>
                    <option value="HMV">HMV (Heavy Trucks)</option>
                  </select>
                </div>

                {/* License Expiry */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">License Expiry Date</label>
                  <input
                    type="date"
                    name="licenseExpiry"
                    required
                    defaultValue={new Date(selectedDriver.licenseExpiry).toISOString().split("T")[0]}
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Contact Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Contact Number</label>
                  <input
                    type="text"
                    name="contactNumber"
                    required
                    defaultValue={selectedDriver.contactNumber}
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Safety Score */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Safety Score</label>
                  <input
                    type="number"
                    name="safetyScore"
                    required
                    min="0"
                    max="100"
                    defaultValue={selectedDriver.tripCompletionRate}
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-950 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Active Status */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">Duty Status</label>
                  <select
                    name="activeStatus"
                    required
                    defaultValue={selectedDriver.activeStatus}
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-[#1E293B] bg-slate-50/50 dark:bg-zinc-950/20 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="h-10 px-4 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-blue-600/10 cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG MODAL */}
      {deleteOpen && selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setDeleteOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6 space-y-4 animate-slide-in">
            <div className="flex items-start gap-3 text-rose-500">
              <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-zinc-150">Confirm Deletion</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mt-1">
                  Are you sure you want to delete driver <strong className="font-extrabold text-slate-800 dark:text-zinc-300">{selectedDriver.name}</strong>?
                  This will also remove their historical trips list. This action is permanent.
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
                {isPending ? "Deleting..." : "Delete Driver"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
