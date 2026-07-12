import React from "react";
import { prisma } from "@/lib/db";
import SidebarLayout from "@/components/SidebarLayout";
import DashboardFilters from "@/components/DashboardFilters";
import {
  TrendingUp,
  Activity,
  CheckCircle,
  AlertTriangle,
  Play,
  Clock,
  UserCheck,
  SearchX,
  Plus,
} from "lucide-react";
import Link from "next/link";

interface DashboardPageProps {
  searchParams: Promise<{
    type?: string;
    status?: string;
    region?: string;
    search?: string;
  }>;
}

export const revalidate = 0; // Ensure data is loaded fresh for operational decisions

export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = await props.searchParams;
  const typeFilter = searchParams.type || "All";
  const statusFilter = searchParams.status || "All";
  const regionFilter = searchParams.region || "All";
  const searchQuery = searchParams.search || "";

  // 1. Fetch raw datasets from Neon database using Prisma
  const rawVehicles = await prisma.vehicle.findMany();
  const rawDrivers = await prisma.driver.findMany();
  const allTrips = await prisma.trip.findMany({
    include: {
      vehicle: true,
      driver: true,
    },
    orderBy: {
      id: "desc",
    },
  });

  // 2. Filter Vehicles dynamically based on type, status, and region dropdowns
  const filteredVehicles = rawVehicles.filter((vehicle) => {
    const matchesType = typeFilter === "All" || vehicle.type === typeFilter;
    const matchesStatus = statusFilter === "All" || vehicle.status === statusFilter;
    const matchesRegion = regionFilter === "All" || vehicle.region === regionFilter;
    return matchesType && matchesStatus && matchesRegion;
  });

  // Filter Trips dynamically based on dropdown values, region, and search query
  const filteredTrips = allTrips.filter((trip) => {
    const matchesType = typeFilter === "All" || trip.vehicle?.type === typeFilter;
    const matchesStatus = statusFilter === "All" || trip.status === statusFilter || trip.vehicle?.status === statusFilter;
    const matchesRegion = regionFilter === "All" || trip.vehicle?.region === regionFilter;
    
    // Rich search query parameters: match ID, route, vehicle model/reg, driver name/license, and trip status
    const query = searchQuery.toLowerCase().trim();
    const tripId = `TR${String(trip.id).padStart(3, "0")}`.toLowerCase();
    const matchesSearch = query === "" || 
      tripId.includes(query) ||
      trip.source.toLowerCase().includes(query) ||
      trip.destination.toLowerCase().includes(query) ||
      trip.status.toLowerCase().includes(query) ||
      (trip.vehicle?.model && trip.vehicle.model.toLowerCase().includes(query)) ||
      (trip.vehicle?.registrationNumber && trip.vehicle.registrationNumber.toLowerCase().includes(query)) ||
      (trip.driver?.name && trip.driver.name.toLowerCase().includes(query)) ||
      (trip.driver?.licenseNumber && trip.driver.licenseNumber.toLowerCase().includes(query)) ||
      (trip.driver?.contactNumber && trip.driver.contactNumber.toLowerCase().includes(query));
      
    return matchesType && matchesStatus && matchesRegion && matchesSearch;
  });

  // 3. Compute KPI Metrics using the FILTERED list so it changes dynamically
  const totalVehiclesCount = filteredVehicles.filter(v => v.status !== "Retired").length;
  const activeVehiclesCount = filteredVehicles.filter(v => v.status === "On Trip").length;
  const availableVehiclesCount = filteredVehicles.filter(v => v.status === "Available").length;
  const inMaintenanceCount = filteredVehicles.filter(v => v.status === "In Shop").length;

  // Active / Pending Trips from filtered list
  const activeTripsCount = filteredTrips.filter((t) => t.status === "On Trip" || t.status === "Dispatched").length;
  const pendingTripsCount = filteredTrips.filter((t) => t.status === "Draft").length;

  // Drivers on Duty
  const driversOnDutyCount = rawDrivers.filter((d) => d.activeStatus === "On Trip").length;

  // Utilization calculation
  const utilizationPercentage = totalVehiclesCount > 0 
    ? Math.round((activeVehiclesCount / totalVehiclesCount) * 100) 
    : 0;

  // Status distribution for progress bars
  const statusCounts = {
    Available: filteredVehicles.filter((v) => v.status === "Available").length,
    OnTrip: filteredVehicles.filter((v) => v.status === "On Trip").length,
    InShop: filteredVehicles.filter((v) => v.status === "In Shop").length,
    Retired: filteredVehicles.filter((v) => v.status === "Retired").length,
  };

  const maxStatusCount = Math.max(
    statusCounts.Available,
    statusCounts.OnTrip,
    statusCounts.InShop,
    statusCounts.Retired,
    1 // Prevent division by zero
  );

  return (
    <SidebarLayout activeTab="dashboard">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Operations Center</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Real-time status updates and fleet operations control</p>
          </div>
          <div className="self-start text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-3.5 py-2 rounded-full flex items-center gap-2.5 shadow-lg shadow-emerald-500/5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
            System Live
          </div>
        </div>

        {/* Filters */}
        <DashboardFilters />

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {/* Active Vehicles */}
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] hover:border-blue-500/50 rounded-2xl p-4 flex flex-col justify-between h-28 transition-all duration-300 group hover:shadow-md hover:shadow-blue-500/5 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-12 w-12 bg-blue-500/5 rounded-bl-full blur-sm transition-all duration-300 group-hover:bg-blue-500/10"></div>
            <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400">
              <span className="text-[9px] font-black uppercase tracking-wider">Active</span>
              <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                <Activity className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-1 z-10">
              <span className="text-2xl font-black text-slate-900 dark:text-zinc-550 tracking-tight">{activeVehiclesCount}</span>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5 font-semibold">On dispatch route</p>
            </div>
          </div>

          {/* Available Vehicles */}
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] hover:border-emerald-500/50 rounded-2xl p-4 flex flex-col justify-between h-28 transition-all duration-300 group hover:shadow-md hover:shadow-emerald-500/5 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-12 w-12 bg-emerald-500/5 rounded-bl-full blur-sm transition-all duration-300 group-hover:bg-emerald-500/10"></div>
            <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400">
              <span className="text-[9px] font-black uppercase tracking-wider">Available</span>
              <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <CheckCircle className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-1 z-10">
              <span className="text-2xl font-black text-slate-900 dark:text-zinc-550 tracking-tight">{availableVehiclesCount}</span>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5 font-semibold">Ready for dispatch</p>
            </div>
          </div>

          {/* Vehicles in Maintenance */}
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] hover:border-amber-500/50 rounded-2xl p-4 flex flex-col justify-between h-28 transition-all duration-300 group hover:shadow-md hover:shadow-amber-500/5 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-12 w-12 bg-amber-500/5 rounded-bl-full blur-sm transition-all duration-300 group-hover:bg-amber-500/10"></div>
            <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400">
              <span className="text-[9px] font-black uppercase tracking-wider">In Shop</span>
              <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-1 z-10">
              <span className="text-2xl font-black text-slate-900 dark:text-zinc-550 tracking-tight">{inMaintenanceCount}</span>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5 font-semibold">In maintenance shop</p>
            </div>
          </div>

          {/* Active Trips */}
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] hover:border-sky-500/50 rounded-2xl p-4 flex flex-col justify-between h-28 transition-all duration-300 group hover:shadow-md hover:shadow-sky-500/5 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-12 w-12 bg-sky-500/5 rounded-bl-full blur-sm transition-all duration-300 group-hover:bg-sky-500/10"></div>
            <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400">
              <span className="text-[9px] font-black uppercase tracking-wider">Active Trips</span>
              <div className="p-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500/20 transition-colors">
                <Play className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-1 z-10">
              <span className="text-2xl font-black text-slate-900 dark:text-zinc-550 tracking-tight">{activeTripsCount}</span>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5 font-semibold">Dispatched dispatches</p>
            </div>
          </div>

          {/* Pending Trips */}
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] hover:border-indigo-500/50 rounded-2xl p-4 flex flex-col justify-between h-28 transition-all duration-300 group hover:shadow-md hover:shadow-indigo-500/5 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-12 w-12 bg-indigo-500/5 rounded-bl-full blur-sm transition-all duration-300 group-hover:bg-indigo-500/10"></div>
            <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400">
              <span className="text-[9px] font-black uppercase tracking-wider">Pending</span>
              <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-1 z-10">
              <span className="text-2xl font-black text-slate-900 dark:text-zinc-550 tracking-tight">{pendingTripsCount}</span>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5 font-semibold">Draft plans saved</p>
            </div>
          </div>

          {/* Drivers On Duty */}
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] hover:border-teal-500/50 rounded-2xl p-4 flex flex-col justify-between h-28 transition-all duration-300 group hover:shadow-md hover:shadow-teal-500/5 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-12 w-12 bg-teal-500/5 rounded-bl-full blur-sm transition-all duration-300 group-hover:bg-teal-500/10"></div>
            <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400">
              <span className="text-[9px] font-black uppercase tracking-wider">On Duty</span>
              <div className="p-1 rounded-lg bg-teal-500/10 text-teal-650 dark:text-teal-400 group-hover:bg-teal-500/20 transition-colors">
                <UserCheck className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-1 z-10">
              <span className="text-2xl font-black text-slate-900 dark:text-zinc-550 tracking-tight">{driversOnDutyCount}</span>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5 font-semibold">Active operators</p>
            </div>
          </div>

          {/* Fleet Utilization */}
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] hover:border-purple-500/50 rounded-2xl p-4 flex flex-col justify-between h-28 transition-all duration-300 group hover:shadow-md hover:shadow-purple-500/5 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-12 w-12 bg-purple-500/5 rounded-bl-full blur-sm transition-all duration-300 group-hover:bg-purple-500/10"></div>
            <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400">
              <span className="text-[9px] font-black uppercase tracking-wider">Utilization</span>
              <div className="p-1 rounded-lg bg-purple-500/10 text-purple-655 dark:text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-1 z-10">
              <span className="text-2xl font-black text-slate-900 dark:text-zinc-550 tracking-tight">{utilizationPercentage}%</span>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5 font-semibold">Active/Total active</p>
            </div>
          </div>
        </div>

        {/* Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Board / Trips Table */}
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 lg:col-span-2 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">Operational Live Board</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-450 mt-1">Real-time dispatcher view of fleet dispatches</p>
              </div>
              <span className="text-[9px] font-mono text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-950 px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-800 font-bold uppercase tracking-wide">
                Showing {filteredTrips.slice(0, 5).length} of {filteredTrips.length}
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="text-[9px] uppercase font-black tracking-wider text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900/40 border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-4">Trip ID</th>
                    <th className="py-3.5 px-4">Route Info</th>
                    <th className="py-3.5 px-4">Assigned Vehicle</th>
                    <th className="py-3.5 px-4">Assigned Driver</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {filteredTrips.slice(0, 5).map((trip) => {
                    const tripId = `TR${String(trip.id).padStart(3, "0")}`;
                    
                    // Status Badge Styling with glowing shadows
                    let badgeClass = "bg-slate-100 text-slate-650 border-slate-200";
                    if (trip.status === "On Trip") {
                      badgeClass = "bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-sm shadow-blue-500/5";
                    } else if (trip.status === "Completed") {
                      badgeClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm shadow-emerald-500/5";
                    } else if (trip.status === "Dispatched") {
                      badgeClass = "bg-sky-500/10 text-sky-600 border-sky-500/20 shadow-sm shadow-sky-500/5";
                    } else if (trip.status === "Cancelled") {
                      badgeClass = "bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-sm shadow-rose-500/5";
                    }

                    return (
                      <tr key={trip.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition duration-150 group">
                        <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-500 transition-colors">{tripId}</td>
                        <td className="py-4 px-4">
                          <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">{trip.source}</div>
                          <div className="text-[10px] text-slate-400 dark:text-zinc-550 font-semibold mt-0.5">➔ {trip.destination}</div>
                        </td>
                        <td className="py-4 px-4">
                          {trip.vehicle ? (
                            <>
                              <div className="text-xs font-bold text-slate-700 dark:text-zinc-300">{trip.vehicle.model}</div>
                              <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">{trip.vehicle.registrationNumber}</div>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Unassigned</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {trip.driver ? (
                            <>
                              <div className="text-xs font-bold text-slate-700 dark:text-zinc-300">{trip.driver.name}</div>
                              <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">{trip.driver.licenseNumber}</div>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Unassigned</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide border ${badgeClass}`}>
                            {trip.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right text-xs text-slate-700 dark:text-zinc-300 font-bold">
                          {trip.status === "Completed" ? "—" : (trip.eta || "Awaiting")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty State Component */}
            {filteredTrips.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50/50 dark:bg-zinc-950/20 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl space-y-4">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-400 dark:text-zinc-500">
                  <SearchX className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">No Trips Found</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">We couldn't find any trips matching your filters or search keywords. Check the spelling or reset filters.</p>
                </div>
              </div>
            )}
          </div>

          {/* Vehicle Status distribution bars card */}
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 space-y-5 shadow-sm">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">Fleet Status Distribution</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-405 mt-1">Current status distribution of filtered fleet</p>
            </div>

            <div className="space-y-5">
              {/* Available */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-zinc-400">Available</span>
                  <span className="text-emerald-500 dark:text-emerald-400 font-bold">{statusCounts.Available}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-900 h-3 rounded-full overflow-hidden border border-slate-200/50 dark:border-zinc-800 relative">
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-md shadow-emerald-500/10"
                    style={{ width: `${(statusCounts.Available / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* On Trip */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-zinc-400">On Trip</span>
                  <span className="text-blue-500 dark:text-blue-400 font-bold">{statusCounts.OnTrip}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-900 h-3 rounded-full overflow-hidden border border-slate-200/50 dark:border-zinc-800 relative">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-500 shadow-md shadow-blue-500/10"
                    style={{ width: `${(statusCounts.OnTrip / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* In Shop */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-zinc-400">In Shop</span>
                  <span className="text-amber-500 dark:text-amber-400 font-bold">{statusCounts.InShop}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-900 h-3 rounded-full overflow-hidden border border-slate-200/50 dark:border-zinc-800 relative">
                  <div
                    className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-500 shadow-md shadow-amber-500/10"
                    style={{ width: `${(statusCounts.InShop / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Retired */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-zinc-400">Retired</span>
                  <span className="text-rose-500 dark:text-rose-400 font-bold">{statusCounts.Retired}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-900 h-3 rounded-full overflow-hidden border border-slate-200/50 dark:border-zinc-800 relative">
                  <div
                    className="bg-gradient-to-r from-rose-600 to-rose-400 h-full rounded-full transition-all duration-500 shadow-md shadow-rose-500/10"
                    style={{ width: `${(statusCounts.Retired / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Config summary card */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-950/20 border border-slate-200 dark:border-zinc-850 rounded-xl space-y-2 relative overflow-hidden">
              <h4 className="text-[10px] font-black text-slate-800 dark:text-zinc-300 tracking-wider uppercase">Operational Summary</h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold">
                Out of {rawVehicles.length} registered vehicles, {totalVehiclesCount} are active in service. The utilization rate of the active fleet is currently {utilizationPercentage}%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
