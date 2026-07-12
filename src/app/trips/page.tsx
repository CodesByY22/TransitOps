import React from "react";
import { prisma } from "@/lib/db";
import { getSession } from "@/features/auth/actions";
import SidebarLayout from "@/components/SidebarLayout";
import TripsClient from "./TripsClient";

export const revalidate = 0; // Prevent caching to guarantee real-time dispatch checks

export default async function TripsPage() {
  const session = await getSession();
  const currentUserId = session?.id || 1;

  // Query datasets with relations
  const trips = await prisma.trip.findMany({
    include: {
      vehicle: true,
      driver: true,
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

  const drivers = await prisma.driver.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <SidebarLayout activeTab="trips">
      <TripsClient
        initialTrips={trips}
        vehicles={vehicles}
        drivers={drivers}
        currentUserId={currentUserId}
      />
    </SidebarLayout>
  );
}
