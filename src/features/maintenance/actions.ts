"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface MaintenanceActionState {
  success: boolean;
  error?: string;
}

export async function createMaintenanceLog(prevState: any, formData: FormData): Promise<MaintenanceActionState> {
  const vehicleIdVal = formData.get("vehicleId")?.toString();
  const description = formData.get("description")?.toString().trim();
  const cost = parseFloat(formData.get("cost")?.toString() || "0");
  const startDateVal = formData.get("startDate")?.toString();

  if (!vehicleIdVal || !description || isNaN(cost) || cost < 0) {
    return { success: false, error: "Please provide a valid vehicle, description, and positive cost." };
  }

  const vehicleId = parseInt(vehicleIdVal);
  const startDate = startDateVal ? new Date(startDateVal) : new Date();

  // Block future dates
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (startDate > today) {
    return { success: false, error: "Cannot schedule maintenance on a future date." };
  }

  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return { success: false, error: "Vehicle not found." };
    }

    if (vehicle.status === "On Trip") {
      return { success: false, error: "Cannot send vehicle to maintenance: it is currently on a trip." };
    }

    // Atomic transaction: Create Log & Update Vehicle to 'In Shop'
    await prisma.$transaction([
      prisma.maintenanceLog.create({
        data: {
          vehicleId,
          description,
          cost,
          startDate,
          status: "Active", // Labeled Active (means scheduled / in shop)
        },
      }),
      prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: "In Shop" },
      }),
    ]);

    revalidatePath("/maintenance");
    revalidatePath("/fleet");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to create maintenance log:", error);
    return { success: false, error: "Database error occurred." };
  }
}

export async function completeMaintenanceLog(logId: number): Promise<MaintenanceActionState> {
  try {
    const log = await prisma.maintenanceLog.findUnique({
      where: { id: logId },
      include: { vehicle: true },
    });

    if (!log) {
      return { success: false, error: "Maintenance log not found." };
    }

    // Atomic transaction: Complete Log & Reset Vehicle to 'Available' (unless retired)
    const nextVehicleStatus = log.vehicle.status === "Retired" ? "Retired" : "Available";

    await prisma.$transaction([
      prisma.maintenanceLog.update({
        where: { id: logId },
        data: {
          status: "Completed",
          endDate: new Date(),
        },
      }),
      prisma.vehicle.update({
        where: { id: log.vehicleId },
        data: { status: nextVehicleStatus },
      }),
      // Auto log maintenance linked expense to keep track of financial reports
      prisma.expense.create({
        data: {
          tripId: 1, // Default link or mock
          maintenanceLinked: log.cost,
          total: log.cost,
        },
      }),
    ]);

    revalidatePath("/maintenance");
    revalidatePath("/fleet");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to complete maintenance log:", error);
    return { success: false, error: "Database error occurred." };
  }
}

export async function updateMaintenanceStatus(
  logId: number,
  nextStatus: string
): Promise<MaintenanceActionState> {
  try {
    if (nextStatus === "Completed") {
      return await completeMaintenanceLog(logId);
    }

    // Simple status change
    await prisma.maintenanceLog.update({
      where: { id: logId },
      data: { status: nextStatus },
    });

    revalidatePath("/maintenance");
    return { success: true };
  } catch (error) {
    console.error("Failed to update status:", error);
    return { success: false, error: "Database error occurred." };
  }
}
