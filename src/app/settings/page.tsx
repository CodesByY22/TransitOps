import React from "react";
import { prisma } from "@/lib/db";
import SidebarLayout from "@/components/SidebarLayout";
import SettingsClient from "./SettingsClient";

export const revalidate = 0; // Disable caching to fetch real-time settings configuration

export default async function SettingsPage() {
  // Query singleton settings
  const settings = await prisma.settings.findFirst();
  
  // Query active users with roles
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { name: "asc" },
  });

  const settingsData = {
    depotName: settings?.depotName || "Gandhinagar Depot GJ14",
    currency: settings?.currency || "INR (Rs)",
    distanceUnit: settings?.distanceUnit || "Kilometers",
  };

  return (
    <SidebarLayout activeTab="settings">
      <SettingsClient 
        initialSettings={settingsData} 
        users={users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          roleName: u.role.name
        }))} 
      />
    </SidebarLayout>
  );
}
