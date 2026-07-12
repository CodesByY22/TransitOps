import React from "react";
import { prisma } from "@/lib/db";
import TripsClientPage from "./TripsClientPage";

export default async function TripsPage() {
  // Query datasets directly from Neon Cloud database
  const vehicles = await prisma.vehicle.findMany({
    orderBy: {
      model: "asc",
    },
  });

  const drivers = await prisma.driver.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const trips = await prisma.trip.findMany({
    include: {
      vehicle: true,
      driver: true,
    },
    orderBy: {
      id: "desc",
    },
  });

  return (
    <TripsClientPage
      vehicles={vehicles}
      drivers={drivers}
      trips={trips}
    />
  );
}
