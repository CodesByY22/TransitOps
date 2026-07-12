import React from "react";
import { prisma } from "@/lib/db";
import SidebarLayout from "@/components/SidebarLayout";
import SettingsClient from "./SettingsClient";

export const revalidate = 0; // Disable caching to fetch real-time settings configuration

export default async function SettingsPage() {
  // Query singleton settings
  const settings = await prisma.settings.findFirst();

  const settingsData = {
    depotName: settings?.depotName || "Gandhinagar Depot GJ14",
    currency: settings?.currency || "INR (Rs)",
    distanceUnit: settings?.distanceUnit || "Kilometers",
  };

  return (
    <SidebarLayout activeTab="settings">
      <SettingsClient initialSettings={settingsData} />
    </SidebarLayout>
  );
}
