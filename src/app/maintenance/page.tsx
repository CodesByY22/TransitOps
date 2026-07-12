import React from "react";
import { prisma } from "@/lib/db";
import SidebarLayout from "@/components/SidebarLayout";
import MaintenanceClient from "./MaintenanceClient";

export const revalidate = 0; // Disable cache for real-time status transitions

export default async function MaintenancePage() {
  const logs = await prisma.maintenanceLog.findMany({
    include: {
      vehicle: true,
    },
    orderBy: {
      id: "desc",
    },
  });

  const vehicles = await prisma.vehicle.findMany({
    orderBy: {
      registrationNumber: "asc",
    },
  });

  return (
    <SidebarLayout activeTab="maintenance">
      <MaintenanceClient initialLogs={logs} vehicles={vehicles} />
    </SidebarLayout>
  );
}
