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
  }>;
}

export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = await props.searchParams;
  const typeFilter = searchParams.type || "All";
  const statusFilter = searchParams.status || "All";

  // 1. Fetch raw datasets from Neon database using Prisma
  const rawVehicles = await prisma.vehicle.findMany();
  const rawDrivers = await prisma.driver.findMany();
  
  // Apply vehicle filtering based on URL query parameters
  const filteredVehicles = rawVehicles.filter((vehicle) => {
    const matchesType = typeFilter === "All" || vehicle.type === typeFilter;
    const matchesStatus = statusFilter === "All" || vehicle.status === statusFilter;
    return matchesType && matchesStatus;
  });

  // 2. Compute KPI Metrics based on filtered/unfiltered counts
  const totalVehiclesCount = rawVehicles.filter(v => v.status !== "Retired").length;
  const activeVehiclesCount = rawVehicles.filter(v => v.status === "On Trip").length;
  const availableVehiclesCount = rawVehicles.filter(v => v.status === "Available").length;
  const inMaintenanceCount = rawVehicles.filter(v => v.status === "In Shop").length;

  // Trips metrics
  const allTrips = await prisma.trip.findMany({
    include: {
      vehicle: true,
      driver: true,
    },
    orderBy: {
      id: "desc",
    },
  });

  const activeTripsCount = allTrips.filter((t) => t.status === "On Trip" || t.status === "Dispatched").length;
  const pendingTripsCount = allTrips.filter((t) => t.status === "Draft").length;

  // Drivers metrics
  const driversOnDutyCount = rawDrivers.filter((d) => d.activeStatus === "On Trip").length;

  // Fleet Utilization Calculation: (Active Vehicles / (Total Registered - Retired)) * 100
  const utilizationPercentage = totalVehiclesCount > 0 
    ? Math.round((activeVehiclesCount / totalVehiclesCount) * 100) 
    : 0;

  // 3. Vehicle Status distribution count for charts
  const statusCounts = {
    Available: rawVehicles.filter((v) => v.status === "Available").length,
    OnTrip: rawVehicles.filter((v) => v.status === "On Trip").length,
    InShop: rawVehicles.filter((v) => v.status === "In Shop").length,
    Retired: rawVehicles.filter((v) => v.status === "Retired").length,
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
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">Operations Dashboard</h2>
            <p className="text-xs text-zinc-500">Real-time status updates and fleet operations control</p>
          </div>
          <div className="text-xs text-zinc-500 bg-[#121214] border border-[#1a1a1e] px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Live
          </div>
        </div>

        {/* Interactive Filters Component */}
        <DashboardFilters />

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {/* Active Vehicles */}
          <div className="bg-[#121214] border border-[#1a1a1e] border-l-4 border-l-blue-500 rounded-xl p-4 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Vehicles</span>
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-zinc-100">{activeVehiclesCount}</span>
              <p className="text-[10px] text-zinc-500 mt-1">Currently on route</p>
            </div>
          </div>

          {/* Available Vehicles */}
          <div className="bg-[#121214] border border-[#1a1a1e] border-l-4 border-l-emerald-500 rounded-xl p-4 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Available</span>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-zinc-100">{availableVehiclesCount}</span>
              <p className="text-[10px] text-zinc-500 mt-1">Ready for dispatch</p>
            </div>
          </div>

          {/* Vehicles in Maintenance */}
          <div className="bg-[#121214] border border-[#1a1a1e] border-l-4 border-l-amber-500 rounded-xl p-4 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">In Shop</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-zinc-100">{inMaintenanceCount}</span>
              <p className="text-[10px] text-zinc-500 mt-1">Undergoing service</p>
            </div>
          </div>

          {/* Active Trips */}
          <div className="bg-[#121214] border border-[#1a1a1e] border-l-4 border-l-sky-500 rounded-xl p-4 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Trips</span>
              <Play className="h-4 w-4 text-sky-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-zinc-100">{activeTripsCount}</span>
              <p className="text-[10px] text-zinc-500 mt-1">In progress / dispatched</p>
            </div>
          </div>

          {/* Pending Trips */}
          <div className="bg-[#121214] border border-[#1a1a1e] border-l-4 border-l-indigo-500 rounded-xl p-4 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
              <Clock className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-zinc-100">{pendingTripsCount}</span>
              <p className="text-[10px] text-zinc-500 mt-1">Draft trips planned</p>
            </div>
          </div>

          {/* Drivers On Duty */}
          <div className="bg-[#121214] border border-[#1a1a1e] border-l-4 border-l-teal-500 rounded-xl p-4 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Drivers Duty</span>
              <UserCheck className="h-4 w-4 text-teal-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-zinc-100">{driversOnDutyCount}</span>
              <p className="text-[10px] text-zinc-500 mt-1">Active drivers on route</p>
            </div>
          </div>

          {/* Fleet Utilization */}
          <div className="bg-[#121214] border border-[#1a1a1e] border-l-4 border-l-purple-500 rounded-xl p-4 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Utilization</span>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-zinc-100">{utilizationPercentage}%</span>
              <p className="text-[10px] text-zinc-500 mt-1">Active / total fleet</p>
            </div>
          </div>
        </div>

        {/* Lower Grid (Live Board & Charts) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Board / Recent Trips */}
          <div className="bg-[#121214] border border-[#1a1a1e] rounded-xl p-6 lg:col-span-2 space-y-4">
            <div>
              <h3 className="text-base font-bold text-zinc-100">Live Board</h3>
              <p className="text-xs text-zinc-500">Recent trip dispatches and operational flow</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 border-b border-[#1a1a1e]">
                  <tr>
                    <th className="pb-3">Trip</th>
                    <th className="pb-3">Route</th>
                    <th className="pb-3">Vehicle</th>
                    <th className="pb-3">Driver</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1e]">
                  {allTrips.slice(0, 5).map((trip) => {
                    const tripId = `TR${String(trip.id).padStart(3, "0")}`;
                    
                    // Status Badge Styling
                    let badgeClass = "bg-zinc-600/10 text-zinc-400 border border-zinc-500/20";
                    if (trip.status === "On Trip") {
                      badgeClass = "bg-blue-600/10 text-blue-400 border border-blue-500/20";
                    } else if (trip.status === "Completed") {
                      badgeClass = "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20";
                    } else if (trip.status === "Dispatched") {
                      badgeClass = "bg-sky-600/10 text-sky-400 border border-sky-500/20";
                    } else if (trip.status === "Cancelled") {
                      badgeClass = "bg-rose-600/10 text-rose-400 border border-rose-500/20";
                    }

                    return (
                      <tr key={trip.id} className="hover:bg-[#161619]/50 transition">
                        <td className="py-4 font-mono font-bold text-zinc-200">{tripId}</td>
                        <td className="py-4">
                          <div className="text-xs font-semibold text-zinc-300">{trip.source}</div>
                          <div className="text-[10px] text-zinc-500">➔ {trip.destination}</div>
                        </td>
                        <td className="py-4 text-xs font-mono text-zinc-300">{trip.vehicle?.model || "—"}</td>
                        <td className="py-4 text-xs text-zinc-300">{trip.driver?.name || "—"}</td>
                        <td className="py-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${badgeClass}`}>
                            {trip.status}
                          </span>
                        </td>
                        <td className="py-4 text-right text-xs text-zinc-400 font-medium">
                          {trip.status === "Completed" ? "—" : (trip.eta || "Awaiting")}
                        </td>
                      </tr>
                    );
                  })}
                  {allTrips.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500 text-xs">
                        No trips found. Create a trip to populate the Live Board.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vehicle Status Distribution Charts */}
          <div className="bg-[#121214] border border-[#1a1a1e] rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-zinc-100">Vehicle Status</h3>
              <p className="text-xs text-zinc-500">Fleet distribution status metrics</p>
            </div>

            <div className="space-y-4">
              {/* Available */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Available</span>
                  <span className="font-bold text-zinc-200">{statusCounts.Available}</span>
                </div>
                <div className="w-full bg-[#1a1a1e] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(statusCounts.Available / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* On Trip */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">On Trip</span>
                  <span className="font-bold text-zinc-200">{statusCounts.OnTrip}</span>
                </div>
                <div className="w-full bg-[#1a1a1e] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(statusCounts.OnTrip / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* In Shop */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">In Shop</span>
                  <span className="font-bold text-zinc-200">{statusCounts.InShop}</span>
                </div>
                <div className="w-full bg-[#1a1a1e] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(statusCounts.InShop / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Retired */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Retired</span>
                  <span className="font-bold text-zinc-200">{statusCounts.Retired}</span>
                </div>
                <div className="w-full bg-[#1a1a1e] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(statusCounts.Retired / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* General Settings Stats Info */}
            <div className="p-4 bg-[#1a1a1e] border border-[#26262b] rounded-lg space-y-2">
              <h4 className="text-xs font-bold text-zinc-300">Operational Summary</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Out of {rawVehicles.length} total registered vehicles, {totalVehiclesCount} are active in your fleet service. Utilization rate is currently at {utilizationPercentage}%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
