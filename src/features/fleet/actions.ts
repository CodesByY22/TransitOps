"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface FleetActionState {
  success: boolean;
  error?: string;
}

export async function createVehicle(prevState: any, formData: FormData): Promise<FleetActionState> {
  const registrationNumber = formData.get("registrationNumber")?.toString().trim().toUpperCase();
  const model = formData.get("model")?.toString().trim();
  const type = formData.get("type")?.toString().trim();
  const maxCapacity = parseFloat(formData.get("maxCapacity")?.toString() || "0");
  const odometer = parseFloat(formData.get("odometer")?.toString() || "0");
  const acquisitionCost = parseFloat(formData.get("acquisitionCost")?.toString() || "0");
  const status = formData.get("status")?.toString() || "Available";
  const region = formData.get("region")?.toString() || "West";

  if (!registrationNumber || !model || !type || maxCapacity <= 0 || odometer < 0 || acquisitionCost <= 0) {
    return { success: false, error: "Please fill out all fields with valid numbers." };
  }

  try {
    // Check uniqueness
    const existing = await prisma.vehicle.findUnique({
      where: { registrationNumber },
    });

    if (existing) {
      return { success: false, error: `Vehicle with registration number ${registrationNumber} already exists.` };
    }

    await prisma.vehicle.create({
      data: {
        registrationNumber,
        model,
        type,
        maxCapacity,
        odometer,
        acquisitionCost,
        status,
        region,
      },
    });

    revalidatePath("/fleet");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to create vehicle:", error);
    return { success: false, error: "Database error occurred." };
  }
}

export async function updateVehicle(id: number, formData: FormData): Promise<FleetActionState> {
  const registrationNumber = formData.get("registrationNumber")?.toString().trim().toUpperCase();
  const model = formData.get("model")?.toString().trim();
  const type = formData.get("type")?.toString().trim();
  const maxCapacity = parseFloat(formData.get("maxCapacity")?.toString() || "0");
  const odometer = parseFloat(formData.get("odometer")?.toString() || "0");
  const acquisitionCost = parseFloat(formData.get("acquisitionCost")?.toString() || "0");
  const status = formData.get("status")?.toString() || "Available";
  const region = formData.get("region")?.toString() || "West";

  if (!registrationNumber || !model || !type || maxCapacity <= 0 || odometer < 0 || acquisitionCost <= 0) {
    return { success: false, error: "Please fill out all fields with valid numbers." };
  }

  try {
    // Check uniqueness excluding current vehicle
    const existing = await prisma.vehicle.findFirst({
      where: {
        registrationNumber,
        id: { not: id },
      },
    });

    if (existing) {
      return { success: false, error: `Vehicle with registration number ${registrationNumber} already exists.` };
    }

    await prisma.vehicle.update({
      where: { id },
      data: {
        registrationNumber,
        model,
        type,
        maxCapacity,
        odometer,
        acquisitionCost,
        status,
        region,
      },
    });

    revalidatePath("/fleet");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to update vehicle:", error);
    return { success: false, error: "Database error occurred." };
  }
}

export async function deleteVehicle(id: number): Promise<FleetActionState> {
  try {
    // Check if vehicle is assigned to active trips
    const activeTrips = await prisma.trip.findFirst({
      where: {
        vehicleId: id,
        status: { in: ["On Trip", "Dispatched"] },
      },
    });

    if (activeTrips) {
      return { success: false, error: "Cannot delete vehicle with active trips." };
    }

    // Cascade delete logs first if needed, or simply delete.
    // In our schema, trips, maintenance, and fuel have FKs. Let's disconnect or delete them.
    await prisma.expense.deleteMany({ where: { trip: { vehicleId: id } } });
    await prisma.trip.deleteMany({ where: { vehicleId: id } });
    await prisma.maintenanceLog.deleteMany({ where: { vehicleId: id } });
    await prisma.fuelLog.deleteMany({ where: { vehicleId: id } });
    await prisma.vehicle.delete({ where: { id } });

    revalidatePath("/fleet");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete vehicle:", error);
    return { success: false, error: "Database error occurred." };
  }
}
