import React from "react";
import { prisma } from "@/lib/db";
import SidebarLayout from "@/components/SidebarLayout";
import DriverClient from "./DriverClient";

export const revalidate = 0; // Prevent caching for real-time compliance tracking

export default async function DriversPage() {
  const drivers = await prisma.driver.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <SidebarLayout activeTab="drivers">
      <DriverClient initialDrivers={drivers} />
    </SidebarLayout>
  );
}
