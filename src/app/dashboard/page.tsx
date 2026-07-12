import React from "react";
import { prisma } from "@/lib/db";
import SidebarLayout from "@/components/SidebarLayout";
import DashboardFilters from "@/components/DashboardFilters";
import { SearchX } from "lucide-react";

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

  // 2. Filter Vehicles dynamically based on dropdown values
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
      <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#09090b] min-h-full">
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Operations Dashboard</h2>
            <p className="text-xs text-zinc-500 mt-1">Real-time status updates and fleet operations control</p>
          </div>
          <div className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            System Live
          </div>
        </div>

        {/* Filters */}
        <DashboardFilters />

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {/* Active Vehicles */}
          <div className="bg-[#09090b] border border-[#18181b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] rounded-xl p-4 flex flex-col justify-between h-28 hover:border-zinc-700 transition">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Active Vehicles</span>
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
            </div>
            <div>
              <span className="text-2xl font-semibold text-white tracking-tight">{activeVehiclesCount}</span>
              <p className="text-[9px] text-zinc-500 mt-0.5 font-mono">Currently on route</p>
            </div>
          </div>

          {/* Available Vehicles */}
          <div className="bg-[#09090b] border border-[#18181b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] rounded-xl p-4 flex flex-col justify-between h-28 hover:border-zinc-700 transition">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Available</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>
            <div>
              <span className="text-2xl font-semibold text-white tracking-tight">{availableVehiclesCount}</span>
              <p className="text-[9px] text-zinc-500 mt-0.5 font-mono">Ready for dispatch</p>
            </div>
          </div>

          {/* Vehicles in Maintenance */}
          <div className="bg-[#09090b] border border-[#18181b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] rounded-xl p-4 flex flex-col justify-between h-28 hover:border-zinc-700 transition">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">In Shop</span>
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            </div>
            <div>
              <span className="text-2xl font-semibold text-white tracking-tight">{inMaintenanceCount}</span>
              <p className="text-[9px] text-zinc-500 mt-0.5 font-mono">Undergoing service</p>
            </div>
          </div>

          {/* Active Trips */}
          <div className="bg-[#09090b] border border-[#18181b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] rounded-xl p-4 flex flex-col justify-between h-28 hover:border-zinc-700 transition">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Active Trips</span>
              <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse"></span>
            </div>
            <div>
              <span className="text-2xl font-semibold text-white tracking-tight">{activeTripsCount}</span>
              <p className="text-[9px] text-zinc-500 mt-0.5 font-mono">In transit</p>
            </div>
          </div>

          {/* Pending Trips */}
          <div className="bg-[#09090b] border border-[#18181b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] rounded-xl p-4 flex flex-col justify-between h-28 hover:border-zinc-700 transition">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Pending</span>
              <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
            </div>
            <div>
              <span className="text-2xl font-semibold text-white tracking-tight">{pendingTripsCount}</span>
              <p className="text-[9px] text-zinc-500 mt-0.5 font-mono">Draft layouts</p>
            </div>
          </div>

          {/* Drivers On Duty */}
          <div className="bg-[#09090b] border border-[#18181b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] rounded-xl p-4 flex flex-col justify-between h-28 hover:border-zinc-700 transition">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Drivers Duty</span>
              <span className="h-2 w-2 rounded-full bg-teal-500"></span>
            </div>
            <div>
              <span className="text-2xl font-semibold text-white tracking-tight">{driversOnDutyCount}</span>
              <p className="text-[9px] text-zinc-500 mt-0.5 font-mono">Active on shift</p>
            </div>
          </div>

          {/* Fleet Utilization */}
          <div className="bg-[#09090b] border border-[#18181b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] rounded-xl p-4 flex flex-col justify-between h-28 hover:border-zinc-700 transition">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Utilization</span>
              <span className="h-2 w-2 rounded-full bg-purple-500"></span>
            </div>
            <div>
              <span className="text-2xl font-semibold text-white tracking-tight">{utilizationPercentage}%</span>
              <p className="text-[9px] text-zinc-500 mt-0.5 font-mono">Active / total</p>
            </div>
          </div>
        </div>

        {/* Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Board / Trips Table */}
          <div className="bg-[#09090b] border border-[#18181b] rounded-xl p-6 lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">Live Operations Board</h3>
                <p className="text-xs text-zinc-500 mt-1">Real-time status updates from active trips</p>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                {filteredTrips.slice(0, 5).length} of {filteredTrips.length} units
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#18181b]">
              <table className="w-full text-left text-xs text-zinc-400 border-collapse">
                <thead className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 bg-[#0c0c0e] border-b border-[#18181b]">
                  <tr>
                    <th className="py-3 px-4">Trip</th>
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Driver</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#18181b] bg-zinc-950/10">
                  {filteredTrips.slice(0, 5).map((trip) => {
                    const tripId = `TR${String(trip.id).padStart(3, "0")}`;
                    
                    // Styled Status Badges
                    let statusColor = "text-zinc-400 bg-zinc-800/40 border-zinc-800";
                    let dotColor = "bg-zinc-500";
                    if (trip.status === "On Trip") {
                      statusColor = "text-blue-400 bg-blue-500/5 border-blue-500/20";
                      dotColor = "bg-blue-400 animate-pulse";
                    } else if (trip.status === "Completed") {
                      statusColor = "text-emerald-400 bg-emerald-500/5 border-emerald-500/20";
                      dotColor = "bg-emerald-400";
                    } else if (trip.status === "Dispatched") {
                      statusColor = "text-sky-400 bg-sky-500/5 border-sky-500/20";
                      dotColor = "bg-sky-400";
                    } else if (trip.status === "Cancelled") {
                      statusColor = "text-rose-400 bg-rose-500/5 border-rose-500/20";
                      dotColor = "bg-rose-400";
                    }

                    return (
                      <tr key={trip.id} className="hover:bg-zinc-900/40 transition duration-150">
                        <td className="py-3.5 px-4 font-mono font-bold text-zinc-200">{tripId}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-zinc-200">{trip.source}</div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">➔ {trip.destination}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          {trip.vehicle ? (
                            <>
                              <div className="text-zinc-200">{trip.vehicle.model}</div>
                              <div className="text-[10px] text-zinc-500">{trip.vehicle.registrationNumber}</div>
                            </>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {trip.driver ? (
                            <>
                              <div className="text-zinc-200">{trip.driver.name}</div>
                              <div className="text-[10px] text-zinc-500 font-mono">{trip.driver.licenseNumber}</div>
                            </>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${statusColor}`}>
                            <span className={`h-1 w-1 rounded-full ${dotColor} mr-1.5`}></span>
                            {trip.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-zinc-300 font-bold">
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
              <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-[#18181b] rounded-xl space-y-3">
                <div className="h-10 w-10 rounded-full bg-zinc-950 flex items-center justify-center text-zinc-600 border border-[#18181b]">
                  <SearchX className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <h4 className="text-xs font-semibold text-zinc-200">No Operations Found</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 max-w-xs mx-auto">Try typing another query or adjust filter parameters.</p>
                </div>
              </div>
            )}
          </div>

          {/* Vehicle Status Distribution Bars */}
          <div className="bg-[#09090b] border border-[#18181b] rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">Fleet Distribution</h3>
              <p className="text-xs text-zinc-500 mt-1">Status distribution of filtered fleet</p>
            </div>

            <div className="space-y-5">
              {/* Available */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-400">Available</span>
                  <span className="text-zinc-200">{statusCounts.Available}</span>
                </div>
                <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-[#18181b]">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(statusCounts.Available / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* On Trip */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-400">On Trip</span>
                  <span className="text-zinc-200">{statusCounts.OnTrip}</span>
                </div>
                <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-[#18181b]">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(statusCounts.OnTrip / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* In Shop */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-400">In Shop</span>
                  <span className="text-zinc-200">{statusCounts.InShop}</span>
                </div>
                <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-[#18181b]">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(statusCounts.InShop / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Retired */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-400">Retired</span>
                  <span className="text-zinc-200">{statusCounts.Retired}</span>
                </div>
                <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-[#18181b]">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(statusCounts.Retired / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Config summary card */}
            <div className="p-4 bg-zinc-950 border border-[#18181b] rounded-xl space-y-1.5">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Summary</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                Out of {rawVehicles.length} total registered vehicles, {totalVehiclesCount} are active in your fleet service. Fleet utilization is at {utilizationPercentage}%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
