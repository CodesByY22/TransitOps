import React from "react";
import { prisma } from "@/lib/db";
import SidebarLayout from "@/components/SidebarLayout";
import FleetClient from "./FleetClient";

export const revalidate = 0; // Disable caching to ensure real-time operations data

export default async function FleetPage() {
  // Fetch vehicles with relational data to calculate real-time ROI and efficiency
  const vehicles = await prisma.vehicle.findMany({
    include: {
      fuelLogs: true,
      maintenanceLogs: true,
      trips: true,
    },
    orderBy: {
      registrationNumber: "asc",
    },
  });

  return (
    <SidebarLayout activeTab="fleet">
      <FleetClient initialVehicles={vehicles} />
    </SidebarLayout>
  );
}
