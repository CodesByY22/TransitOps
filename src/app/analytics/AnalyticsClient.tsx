"use client";

import React, { useState } from "react";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  TrendingUp,
  Percent,
  TrendingDown,
  Activity,
  Award,
} from "lucide-react";

interface VehicleData {
  registrationNumber: string;
  model: string;
  roi: number;
  fuelEfficiency: number;
  totalCost: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
}

interface AnalyticsData {
  vehicles: VehicleData[];
  monthly: MonthlyData[];
  utilization: number;
  driverAvgSafety: number;
  driverAvgCompletion: number;
  maintenanceMonthlyCost: { month: string; cost: number }[];
  costliestVehicles: { registrationNumber: string; model: string; maintenanceCost: number; fuelCost: number; total: number }[];
}

export default function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Trigger PDF print
  const handlePrintPDF = () => {
    window.print();
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Vehicle ID", "Model", "ROI (%)", "Fuel Efficiency (km/L)", "Total Expense (₹)"];
    const rows = data.vehicles.map((v) => [
      v.registrationNumber,
      v.model,
      v.roi,
      v.fuelEfficiency === 0 ? "N/A" : v.fuelEfficiency,
      v.totalCost,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transitops_fleet_analytics_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG Chart Dimensions
  const chartWidth = 500;
  const chartHeight = 200;
  const padding = 30;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 print:p-0 print:bg-white print:text-black">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Business Intelligence</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Audit fleet profitability, operational ROI, and resource efficiency</p>
        </div>

        {/* Export buttons */}
        <div className="relative">
          <button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className="h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-blue-600/10 flex items-center gap-2 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Export Reports
          </button>
          {exportMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 animate-slide-in">
              <button
                onClick={() => {
                  handleExportCSV();
                  setExportMenuOpen(false);
                }}
                className="w-full h-10 px-4 text-left text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                Export to CSV
              </button>
              <button
                onClick={() => {
                  handlePrintPDF();
                  setExportMenuOpen(false);
                }}
                className="w-full h-10 px-4 text-left text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-rose-500" />
                Export to PDF / Print
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Print-Only Header */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-3xl font-black text-slate-900">TransitOps Business Intelligence Report</h1>
        <p className="text-xs text-slate-500 mt-1">Generated on: {new Date().toLocaleString()} | Gandhinagar Depot</p>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Fleet Utilization</p>
            <p className="text-xl font-black text-slate-900 dark:text-zinc-50 mt-0.5">{data.utilization}%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Avg Safety Score</p>
            <p className="text-xl font-black text-slate-900 dark:text-zinc-50 mt-0.5">{data.driverAvgSafety.toFixed(1)}/100</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Trip Completion</p>
            <p className="text-xl font-black text-slate-900 dark:text-zinc-50 mt-0.5">{data.driverAvgCompletion.toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 flex items-center gap-4 shadow-sm bg-gradient-to-br from-teal-500/5 to-blue-500/5">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Top Vehicle ROI</p>
            <p className="text-xl font-black text-emerald-500 mt-0.5">
              {Math.max(...data.vehicles.map((v) => v.roi), 0).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Revenue vs Expenses */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Monthly Revenue vs Expenses</h3>
            <p className="text-[10px] text-slate-400">Total earnings compared to operational outlay</p>
          </div>
          <div className="flex justify-center">
            <svg className="w-full max-w-[500px]" viewBox={`0 0 ${chartWidth} ${chartHeight}`} xmlns="http://www.w3.org/2000/svg">
              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="rgba(156,163,175,0.1)" strokeWidth="1" />
              <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="rgba(156,163,175,0.1)" strokeWidth="1" />
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(156,163,175,0.3)" strokeWidth="1" />
              
              {/* Bars */}
              {data.monthly.map((m, idx) => {
                const maxVal = Math.max(...data.monthly.map((d) => Math.max(d.revenue, d.expenses)), 1);
                const x = padding + idx * 140 + 50;
                
                // Revenue Bar
                const revHeight = ((chartHeight - 2 * padding) * m.revenue) / maxVal;
                const revY = chartHeight - padding - revHeight;
                
                // Expense Bar
                const expHeight = ((chartHeight - 2 * padding) * m.expenses) / maxVal;
                const expY = chartHeight - padding - expHeight;

                return (
                  <g key={m.month}>
                    {/* Revenue */}
                    <rect x={x} y={revY} width="22" height={revHeight} fill="#3B82F6" rx="4" />
                    {/* Expense */}
                    <rect x={x + 28} y={expY} width="22" height={expHeight} fill="#EF4444" rx="4" />
                    {/* Label */}
                    <text x={x + 25} y={chartHeight - 10} textAnchor="middle" fill="currentColor" className="text-[10px] font-bold">
                      {m.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex justify-center gap-4 text-[10px] font-black uppercase text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 bg-blue-500 rounded"></span> Revenue</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 bg-rose-500 rounded"></span> Expenses</span>
          </div>
        </div>

        {/* Chart 2: Maintenance Trends */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Maintenance Outlay Trend</h3>
            <p className="text-[10px] text-slate-400">Monthly workshop and service costs trajectory</p>
          </div>
          <div className="flex justify-center">
            <svg className="w-full max-w-[500px]" viewBox={`0 0 ${chartWidth} ${chartHeight}`} xmlns="http://www.w3.org/2000/svg">
              {/* Line chart */}
              {(() => {
                const maxVal = Math.max(...data.maintenanceMonthlyCost.map((d) => d.cost), 1);
                const points = data.maintenanceMonthlyCost.map((d, idx) => {
                  const x = padding + idx * 160 + 60;
                  const y = chartHeight - padding - ((chartHeight - 2 * padding) * d.cost) / maxVal;
                  return { x, y, month: d.month, cost: d.cost };
                });

                const pathData = points.reduce((acc, p, i) => {
                  return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                }, "");

                return (
                  <g>
                    {/* Grid */}
                    <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(156,163,175,0.3)" />
                    {/* Line */}
                    <path d={pathData} fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {/* Points & Labels */}
                    {points.map((p) => (
                      <g key={p.month}>
                        <circle cx={p.x} cy={p.y} r="4" fill="#0D9488" stroke="white" strokeWidth="1.5" />
                        <text x={p.x} y={p.y - 10} textAnchor="middle" fill="currentColor" className="text-[9px] font-bold font-mono">
                          ₹{Math.round(p.cost).toLocaleString()}
                        </text>
                        <text x={p.x} y={chartHeight - 10} textAnchor="middle" fill="currentColor" className="text-[10px] font-bold">
                          {p.month}
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* Chart 3: Vehicle ROI */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Vehicle ROI (%)</h3>
            <p className="text-[10px] text-slate-400">Profitability return relative to acquisition cost</p>
          </div>
          <div className="space-y-3">
            {data.vehicles.map((v) => (
              <div key={v.registrationNumber} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-zinc-400 font-mono">{v.registrationNumber} ({v.model})</span>
                  <span className={`font-mono ${v.roi >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{v.roi}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-900/50 h-3 rounded-full border border-slate-200/50 dark:border-zinc-800 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      v.roi >= 0 ? "bg-gradient-to-r from-emerald-600 to-emerald-400" : "bg-gradient-to-r from-rose-600 to-rose-400"
                    }`}
                    style={{ width: `${Math.min(Math.max(v.roi, 0), 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: Fuel Efficiency */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Avg Fuel Efficiency (km/L)</h3>
            <p className="text-[10px] text-slate-400">Calculated average distance covered per liter of fuel</p>
          </div>
          <div className="space-y-3">
            {data.vehicles.map((v) => (
              <div key={v.registrationNumber} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-zinc-400 font-mono">{v.registrationNumber} ({v.model})</span>
                  <span className="font-mono text-blue-500">{v.fuelEfficiency === 0 ? "—" : `${v.fuelEfficiency} km/L`}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-900/50 h-3 rounded-full border border-slate-200/50 dark:border-zinc-800 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${v.fuelEfficiency > 0 ? Math.min((v.fuelEfficiency / 10) * 100, 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Costliest Vehicles Table */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-black text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Costliest Operational Vehicles</h3>
          <p className="text-[10px] text-slate-400">Audit representing top assets sorted by aggregated costs (servicing + fuel)</p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-zinc-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900/40 border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="py-3.5 px-5">Registration</th>
                <th className="py-3.5 px-5">Model</th>
                <th className="py-3.5 px-5">Total Fuel Cost</th>
                <th className="py-3.5 px-5">Total Maintenance</th>
                <th className="py-3.5 px-5">Aggregated Outlay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {data.costliestVehicles.map((v) => (
                <tr key={v.registrationNumber} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-900 dark:text-zinc-200">{v.registrationNumber}</td>
                  <td className="py-3.5 px-5 font-semibold text-slate-500 dark:text-zinc-400">{v.model}</td>
                  <td className="py-3.5 px-5 font-mono text-slate-700 dark:text-zinc-300">₹{v.fuelCost.toLocaleString()}</td>
                  <td className="py-3.5 px-5 font-mono text-slate-700 dark:text-zinc-300">₹{v.maintenanceCost.toLocaleString()}</td>
                  <td className="py-3.5 px-5 font-mono font-black text-rose-500">₹{v.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
