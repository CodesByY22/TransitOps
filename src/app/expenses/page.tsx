import React from "react";
import { prisma } from "@/lib/db";
import SidebarLayout from "@/components/SidebarLayout";
import ExpensesClient from "./ExpensesClient";

export const revalidate = 0; // Prevent caching to guarantee real-time financial auditing

export default async function ExpensesPage() {
  // Query fuel logs with vehicle details
  const fuelLogs = await prisma.fuelLog.findMany({
    include: {
      vehicle: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  // Query expenses with trip and vehicle details
  const expenses = await prisma.expense.findMany({
    include: {
      trip: {
        include: {
          vehicle: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  // Query vehicles for selector
  const vehicles = await prisma.vehicle.findMany({
    orderBy: {
      registrationNumber: "asc",
    },
  });

  // Query trips for selector
  const trips = await prisma.trip.findMany({
    orderBy: {
      id: "desc",
    },
  });

  // Query all maintenance logs to calculate total maintenance cost
  const maintenanceLogs = await prisma.maintenanceLog.findMany();

  // Compute aggregate totals
  const fuelTotal = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
  const maintenanceTotal = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
  const otherTotal = expenses.reduce((sum, exp) => sum + exp.toll + exp.other, 0);
  const aggregateTotal = fuelTotal + maintenanceTotal + otherTotal;

  const totals = {
    fuel: fuelTotal,
    maintenance: maintenanceTotal,
    other: otherTotal,
    total: aggregateTotal,
  };

  return (
    <SidebarLayout activeTab="expenses">
      <ExpensesClient
        fuelLogs={fuelLogs}
        expenses={expenses}
        vehicles={vehicles}
        trips={trips}
        totals={totals}
      />
    </SidebarLayout>
  );
}
