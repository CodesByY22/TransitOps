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
} from "lucide-react";

interface DashboardPageProps {
  searchParams: Promise<{
    type?: string;
    status?: string;
    region?: string;
    search?: string;
  }>;
}

export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = await props.searchParams;
  const typeFilter = searchParams.type || "All";
  const statusFilter = searchParams.status || "All";
  const regionFilter = searchParams.region || "All";
  const searchQuery = searchParams.search || "";

  // 1. Fetch data from Neon database using Prisma
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

  // 2. Filter Vehicles dynamically based on dropdown values
  const filteredVehicles = rawVehicles.filter((vehicle) => {
    const matchesType = typeFilter === "All" || vehicle.type === typeFilter;
    const matchesStatus = statusFilter === "All" || vehicle.status === statusFilter;
    const matchesRegion = regionFilter === "All" || vehicle.region === regionFilter;
    return matchesType && matchesStatus && matchesRegion;
  });

  // Filter Trips dynamically based on dropdown values, regions, and search bar queries
  const filteredTrips = allTrips.filter((trip) => {
    const matchesType = typeFilter === "All" || trip.vehicle?.type === typeFilter;
    const matchesStatus = statusFilter === "All" || trip.status === statusFilter || trip.vehicle?.status === statusFilter;
    const matchesRegion = regionFilter === "All" || trip.vehicle?.region === regionFilter;
    
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = query === "" || 
      trip.source.toLowerCase().includes(query) ||
      trip.destination.toLowerCase().includes(query) ||
      (trip.vehicle?.model && trip.vehicle.model.toLowerCase().includes(query)) ||
      (trip.vehicle?.registrationNumber && trip.vehicle.registrationNumber.toLowerCase().includes(query)) ||
      (trip.driver?.name && trip.driver.name.toLowerCase().includes(query));
      
    return matchesType && matchesStatus && matchesSearch;
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

  // Status distribution for progress bars (calculated from filtered list so the bars change too!)
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
      <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#0a0a0c]">
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Operations Dashboard</h2>
            <p className="text-xs text-zinc-400 mt-1">Real-time status updates and fleet operations control</p>
          </div>
          <div className="text-[11px] font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-3.5 py-2 rounded-full flex items-center gap-2.5 shadow-lg shadow-emerald-500/5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            System Live
          </div>
        </div>

        {/* Filters */}
        <DashboardFilters />

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-5">
          {/* Active Vehicles */}
          <div className="bg-[#121214]/65 backdrop-blur-md border border-zinc-800/60 hover:border-blue-500/50 rounded-2xl p-5 flex flex-col justify-between h-32 transition-all duration-300 group hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5">
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Active Vehicles</span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-colors">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-1">
              <span className="text-3xl font-black text-zinc-50 tracking-tight">{activeVehiclesCount}</span>
              <p className="text-[10px] text-zinc-500 mt-1 font-medium">Currently on route</p>
            </div>
          </div>

          {/* Available Vehicles */}
          <div className="bg-[#121214]/65 backdrop-blur-md border border-zinc-800/60 hover:border-emerald-500/50 rounded-2xl p-5 flex flex-col justify-between h-32 transition-all duration-300 group hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5">
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Available</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-1">
              <span className="text-3xl font-black text-zinc-50 tracking-tight">{availableVehiclesCount}</span>
              <p className="text-[10px] text-zinc-500 mt-1 font-medium">Ready for dispatch</p>
            </div>
          </div>

          {/* Vehicles in Maintenance */}
          <div className="bg-[#121214]/65 backdrop-blur-md border border-zinc-800/60 hover:border-amber-500/50 rounded-2xl p-5 flex flex-col justify-between h-32 transition-all duration-300 group hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5">
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">In Shop</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 group-hover:text-amber-300 transition-colors">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-1">
              <span className="text-3xl font-black text-zinc-50 tracking-tight">{inMaintenanceCount}</span>
              <p className="text-[10px] text-zinc-500 mt-1 font-medium">Undergoing service</p>
            </div>
          </div>

          {/* Active Trips */}
          <div className="bg-[#121214]/65 backdrop-blur-md border border-zinc-800/60 hover:border-sky-500/50 rounded-2xl p-5 flex flex-col justify-between h-32 transition-all duration-300 group hover:shadow-lg hover:shadow-sky-500/5 hover:-translate-y-0.5">
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Active Trips</span>
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 group-hover:text-sky-300 transition-colors">
                <Play className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-1">
              <span className="text-3xl font-black text-zinc-50 tracking-tight">{activeTripsCount}</span>
              <p className="text-[10px] text-zinc-500 mt-1 font-medium">Active/Dispatched</p>
            </div>
          </div>

          {/* Pending Trips */}
          <div className="bg-[#121214]/65 backdrop-blur-md border border-zinc-800/60 hover:border-indigo-500/50 rounded-2xl p-5 flex flex-col justify-between h-32 transition-all duration-300 group hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5">
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Pending</span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-1">
              <span className="text-3xl font-black text-zinc-50 tracking-tight">{pendingTripsCount}</span>
              <p className="text-[10px] text-zinc-500 mt-1 font-medium">Drafts planned</p>
            </div>
          </div>

          {/* Drivers On Duty */}
          <div className="bg-[#121214]/65 backdrop-blur-md border border-zinc-800/60 hover:border-teal-500/50 rounded-2xl p-5 flex flex-col justify-between h-32 transition-all duration-300 group hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-0.5">
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Drivers Duty</span>
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20 group-hover:text-teal-300 transition-colors">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-1">
              <span className="text-3xl font-black text-zinc-50 tracking-tight">{driversOnDutyCount}</span>
              <p className="text-[10px] text-zinc-500 mt-1 font-medium">Active on route</p>
            </div>
          </div>

          {/* Fleet Utilization */}
          <div className="bg-[#121214]/65 backdrop-blur-md border border-zinc-800/60 hover:border-purple-500/50 rounded-2xl p-5 flex flex-col justify-between h-32 transition-all duration-300 group hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5">
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Utilization</span>
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-1">
              <span className="text-3xl font-black text-zinc-50 tracking-tight">{utilizationPercentage}%</span>
              <p className="text-[10px] text-zinc-500 mt-1 font-medium">Active/total fleet</p>
            </div>
          </div>
        </div>

        {/* Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Board / Trips table */}
          <div className="bg-[#121214]/65 backdrop-blur-md border border-[#1a1a1e]/80 rounded-2xl p-6 lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-zinc-100">Live Board</h3>
                <p className="text-xs text-zinc-400">Real-time dispatcher view of fleet trips</p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 bg-[#1a1a1e] px-2.5 py-1 rounded-md border border-[#26262b]">
                Showing {filteredTrips.slice(0, 5).length} of {filteredTrips.length}
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#1a1a1e]">
              <table className="w-full text-left text-sm text-zinc-400 border-collapse">
                <thead className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 bg-[#18181b] border-b border-[#26262b]">
                  <tr>
                    <th className="py-3.5 px-4">Trip ID</th>
                    <th className="py-3.5 px-4">Route</th>
                    <th className="py-3.5 px-4">Vehicle</th>
                    <th className="py-3.5 px-4">Driver</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1e] bg-[#121214]/20">
                  {filteredTrips.slice(0, 5).map((trip) => {
                    const tripId = `TR${String(trip.id).padStart(3, "0")}`;
                    
                    // Status Badge Styling with glowing shadows
                    let badgeClass = "bg-zinc-500/10 text-zinc-400 border-zinc-500/25";
                    if (trip.status === "On Trip") {
                      badgeClass = "bg-blue-500/10 text-blue-400 border-blue-500/25 shadow-sm shadow-blue-500/5";
                    } else if (trip.status === "Completed") {
                      badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-sm shadow-emerald-500/5";
                    } else if (trip.status === "Dispatched") {
                      badgeClass = "bg-sky-500/10 text-sky-400 border-sky-500/25 shadow-sm shadow-sky-500/5";
                    } else if (trip.status === "Cancelled") {
                      badgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/25 shadow-sm shadow-rose-500/5";
                    }

                    return (
                      <tr key={trip.id} className="hover:bg-[#1a1a1e]/40 transition duration-150">
                        <td className="py-4 px-4 font-mono font-bold text-zinc-200">{tripId}</td>
                        <td className="py-4 px-4">
                          <div className="text-xs font-bold text-zinc-200">{trip.source}</div>
                          <div className="text-[10px] text-zinc-500 font-medium">➔ {trip.destination}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-xs font-semibold text-zinc-300">{trip.vehicle?.model || "—"}</div>
                          {trip.vehicle && (
                            <div className="text-[10px] text-zinc-500 font-mono">{trip.vehicle.registrationNumber}</div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-xs font-semibold text-zinc-300">{trip.driver?.name || "—"}</div>
                          {trip.driver && (
                            <div className="text-[10px] text-zinc-500 font-mono">ID: {trip.driver.id}</div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide border ${badgeClass}`}>
                            {trip.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right text-xs text-zinc-300 font-semibold">
                          {trip.status === "Completed" ? "—" : (trip.eta || "Awaiting")}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTrips.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500 text-xs">
                        No matching trips found. Try clearing the filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vehicle Status bars card */}
          <div className="bg-[#121214]/65 backdrop-blur-md border border-[#1a1a1e]/80 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-100">Vehicle Status</h3>
              <p className="text-xs text-zinc-400">Current status distribution of filtered fleet</p>
            </div>

            <div className="space-y-5">
              {/* Available */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-400">Available</span>
                  <span className="text-emerald-400">{statusCounts.Available}</span>
                </div>
                <div className="w-full bg-[#1a1a1e] h-2.5 rounded-full overflow-hidden border border-zinc-800/50">
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-lg shadow-emerald-500/20"
                    style={{ width: `${(statusCounts.Available / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* On Trip */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-400">On Trip</span>
                  <span className="text-blue-400">{statusCounts.OnTrip}</span>
                </div>
                <div className="w-full bg-[#1a1a1e] h-2.5 rounded-full overflow-hidden border border-zinc-800/50">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-500 shadow-lg shadow-blue-500/20"
                    style={{ width: `${(statusCounts.OnTrip / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* In Shop */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-400">In Shop</span>
                  <span className="text-amber-400">{statusCounts.InShop}</span>
                </div>
                <div className="w-full bg-[#1a1a1e] h-2.5 rounded-full overflow-hidden border border-zinc-800/50">
                  <div
                    className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-500 shadow-lg shadow-amber-500/20"
                    style={{ width: `${(statusCounts.InShop / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Retired */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-400">Retired</span>
                  <span className="text-rose-400">{statusCounts.Retired}</span>
                </div>
                <div className="w-full bg-[#1a1a1e] h-2.5 rounded-full overflow-hidden border border-zinc-800/50">
                  <div
                    className="bg-gradient-to-r from-rose-600 to-rose-400 h-full rounded-full transition-all duration-500 shadow-lg shadow-rose-500/20"
                    style={{ width: `${(statusCounts.Retired / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Config summary card */}
            <div className="p-4 bg-[#1a1a1e]/80 border border-zinc-800/50 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-zinc-300">Operational Summary</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                Out of {rawVehicles.length} total registered vehicles, {totalVehiclesCount} are active in your fleet service. The utilization rate of the active fleet is currently {utilizationPercentage}%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
