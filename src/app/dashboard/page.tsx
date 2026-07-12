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
      <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#070709] min-h-full">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-zinc-50 tracking-tight">Operations Center</h2>
            <p className="text-xs text-zinc-400 mt-1">Real-time status updates and fleet operations control</p>
          </div>
          <div className="self-start text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-3.5 py-2 rounded-full flex items-center gap-2.5 shadow-lg shadow-emerald-500/10">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            System Live
          </div>
        </div>

        {/* Filters */}
        <DashboardFilters />

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-5">
          {/* Active Vehicles */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/80 hover:border-blue-500/50 rounded-2xl p-5 flex flex-col justify-between h-32 transition-all duration-300 group hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/5 rounded-bl-full blur-sm transition-all duration-300 group-hover:bg-blue-500/10"></div>
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Active Vehicles</span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-colors">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-1 z-10">
              <span className="text-3xl font-extrabold text-zinc-50 tracking-tight">{activeVehiclesCount}</span>
              <p className="text-[10px] text-zinc-500 mt-1 font-semibold">Currently on route</p>
            </div>
          </div>

          {/* Available Vehicles */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/80 hover:border-emerald-500/50 rounded-2xl p-5 flex flex-col justify-between h-32 transition-all duration-300 group hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-bl-full blur-sm transition-all duration-300 group-hover:bg-emerald-500/10"></div>
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Available</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-1 z-10">
              <span className="text-3xl font-extrabold text-zinc-50 tracking-tight">{availableVehiclesCount}</span>
              <p className="text-[10px] text-zinc-500 mt-1 font-semibold">Ready for dispatch</p>
            </div>
          </div>

          {/* Vehicles in Maintenance */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/80 hover:border-amber-500/50 rounded-2xl p-5 flex flex-col justify-between h-32 transition-all duration-300 group hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-bl-full blur-sm transition-all duration-300 group-hover:bg-amber-500/10"></div>
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">In Shop</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 group-hover:text-amber-300 transition-colors">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-1 z-10">
              <span className="text-3xl font-extrabold text-zinc-50 tracking-tight">{inMaintenanceCount}</span>
              <p className="text-[10px] text-zinc-500 mt-1 font-semibold">Undergoing service</p>
            </div>
          </div>

          {/* Active Trips */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/80 hover:border-sky-500/50 rounded-2xl p-5 flex flex-col justify-between h-32 transition-all duration-300 group hover:shadow-lg hover:shadow-sky-500/5 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-sky-500/5 rounded-bl-full blur-sm transition-all duration-300 group-hover:bg-sky-500/10"></div>
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Active Trips</span>
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 group-hover:text-sky-300 transition-colors">
                <Play className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-1 z-10">
              <span className="text-3xl font-extrabold text-zinc-50 tracking-tight">{activeTripsCount}</span>
              <p className="text-[10px] text-zinc-500 mt-1 font-semibold">Trips in progress</p>
            </div>
          </div>

          {/* Pending Trips */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/80 hover:border-indigo-500/50 rounded-2xl p-5 flex flex-col justify-between h-32 transition-all duration-300 group hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/5 rounded-bl-full blur-sm transition-all duration-300 group-hover:bg-indigo-500/10"></div>
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Pending</span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-1 z-10">
              <span className="text-3xl font-extrabold text-zinc-50 tracking-tight">{pendingTripsCount}</span>
              <p className="text-[10px] text-zinc-500 mt-1 font-semibold">Draft plans saved</p>
            </div>
          </div>

          {/* Drivers On Duty */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/80 hover:border-teal-500/50 rounded-2xl p-5 flex flex-col justify-between h-32 transition-all duration-300 group hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-teal-500/5 rounded-bl-full blur-sm transition-all duration-300 group-hover:bg-teal-500/10"></div>
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Drivers Duty</span>
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20 group-hover:text-teal-300 transition-colors">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-1 z-10">
              <span className="text-3xl font-extrabold text-zinc-50 tracking-tight">{driversOnDutyCount}</span>
              <p className="text-[10px] text-zinc-500 mt-1 font-semibold">Active dispatchers</p>
            </div>
          </div>

          {/* Fleet Utilization */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/80 hover:border-purple-500/50 rounded-2xl p-5 flex flex-col justify-between h-32 transition-all duration-300 group hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-purple-500/5 rounded-bl-full blur-sm transition-all duration-300 group-hover:bg-purple-500/10"></div>
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Utilization</span>
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-1 z-10">
              <span className="text-3xl font-extrabold text-zinc-50 tracking-tight">{utilizationPercentage}%</span>
              <p className="text-[10px] text-zinc-500 mt-1 font-semibold">Active/total fleet</p>
            </div>
          </div>
        </div>

        {/* Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Board / Trips Table */}
          <div className="bg-zinc-900/10 backdrop-blur-xl border border-zinc-900 rounded-2xl p-6 lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-zinc-100 tracking-tight">Live Board</h3>
                <p className="text-xs text-zinc-400">Real-time dispatcher view of fleet trips</p>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800/80 font-bold uppercase tracking-wide">
                Showing {filteredTrips.slice(0, 5).length} of {filteredTrips.length}
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-900">
              <table className="w-full text-left text-sm text-zinc-400 border-collapse">
                <thead className="text-[10px] uppercase font-bold tracking-wider text-zinc-300 bg-zinc-900/60 border-b border-zinc-900">
                  <tr>
                    <th className="py-3.5 px-4">Trip ID</th>
                    <th className="py-3.5 px-4">Route Info</th>
                    <th className="py-3.5 px-4">Assigned Vehicle</th>
                    <th className="py-3.5 px-4">Assigned Driver</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/80 bg-zinc-950/20">
                  {filteredTrips.slice(0, 5).map((trip) => {
                    const tripId = `TR${String(trip.id).padStart(3, "0")}`;
                    
                    // Status Badge Styling with glowing shadows
                    let badgeClass = "bg-zinc-500/10 text-zinc-400 border-zinc-800";
                    if (trip.status === "On Trip") {
                      badgeClass = "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-sm shadow-blue-500/10";
                    } else if (trip.status === "Completed") {
                      badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/10";
                    } else if (trip.status === "Dispatched") {
                      badgeClass = "bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-sm shadow-sky-500/10";
                    } else if (trip.status === "Cancelled") {
                      badgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-sm shadow-rose-500/10";
                    }

                    return (
                      <tr key={trip.id} className="hover:bg-zinc-900/30 transition duration-150 group">
                        <td className="py-4 px-4 font-mono font-bold text-zinc-100 group-hover:text-blue-500 transition-colors">{tripId}</td>
                        <td className="py-4 px-4">
                          <div className="text-xs font-bold text-zinc-200">{trip.source}</div>
                          <div className="text-[10px] text-zinc-500 font-semibold mt-0.5">➔ {trip.destination}</div>
                        </td>
                        <td className="py-4 px-4">
                          {trip.vehicle ? (
                            <>
                              <div className="text-xs font-bold text-zinc-300">{trip.vehicle.model}</div>
                              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{trip.vehicle.registrationNumber}</div>
                            </>
                          ) : (
                            <span className="text-xs text-zinc-600 font-medium">Unassigned</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {trip.driver ? (
                            <>
                              <div className="text-xs font-bold text-zinc-300">{trip.driver.name}</div>
                              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{trip.driver.licenseNumber}</div>
                            </>
                          ) : (
                            <span className="text-xs text-zinc-600 font-medium">Unassigned</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide border ${badgeClass}`}>
                            {trip.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right text-xs text-zinc-300 font-bold">
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
              <div className="flex flex-col items-center justify-center py-16 px-4 bg-zinc-950/20 border border-dashed border-zinc-800 rounded-xl space-y-4">
                <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500">
                  <SearchX className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-bold text-zinc-200">No Trips Found</h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">We couldn't find any trips matching your filters or search keywords. Check the spelling or reset filters.</p>
                </div>
              </div>
            )}
          </div>

          {/* Vehicle Status distribution bars card */}
          <div className="bg-zinc-900/10 backdrop-blur-xl border border-zinc-900 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-zinc-100 tracking-tight">Vehicle Status</h3>
              <p className="text-xs text-zinc-400">Current status distribution of filtered fleet</p>
            </div>

            <div className="space-y-6">
              {/* Available */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-400">Available</span>
                  <span className="text-emerald-400">{statusCounts.Available}</span>
                </div>
                <div className="w-full bg-[#131316] h-3 rounded-full overflow-hidden border border-zinc-900 relative">
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-md shadow-emerald-500/10"
                    style={{ width: `${(statusCounts.Available / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* On Trip */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-400">On Trip</span>
                  <span className="text-blue-400">{statusCounts.OnTrip}</span>
                </div>
                <div className="w-full bg-[#131316] h-3 rounded-full overflow-hidden border border-zinc-900 relative">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-500 shadow-md shadow-blue-500/10"
                    style={{ width: `${(statusCounts.OnTrip / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* In Shop */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-400">In Shop</span>
                  <span className="text-amber-400">{statusCounts.InShop}</span>
                </div>
                <div className="w-full bg-[#131316] h-3 rounded-full overflow-hidden border border-zinc-900 relative">
                  <div
                    className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-500 shadow-md shadow-amber-500/10"
                    style={{ width: `${(statusCounts.InShop / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Retired */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-400">Retired</span>
                  <span className="text-rose-400">{statusCounts.Retired}</span>
                </div>
                <div className="w-full bg-[#131316] h-3 rounded-full overflow-hidden border border-zinc-900 relative">
                  <div
                    className="bg-gradient-to-r from-rose-600 to-rose-400 h-full rounded-full transition-all duration-500 shadow-md shadow-rose-500/10"
                    style={{ width: `${(statusCounts.Retired / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Config summary card */}
            <div className="p-4 bg-zinc-950/20 border border-zinc-900 rounded-xl space-y-2 relative overflow-hidden">
              <h4 className="text-xs font-extrabold text-zinc-300 tracking-wide uppercase">Operational Summary</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold">
                Out of {rawVehicles.length} total registered vehicles, {totalVehiclesCount} are active in your fleet service. The utilization rate of the active fleet is currently {utilizationPercentage}%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
