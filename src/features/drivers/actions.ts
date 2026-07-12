"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface DriverActionState {
  success: boolean;
  error?: string;
}

export async function createDriver(prevState: any, formData: FormData): Promise<DriverActionState> {
  const name = formData.get("name")?.toString().trim();
  const licenseNumber = formData.get("licenseNumber")?.toString().trim().toUpperCase();
  const licenseCategory = formData.get("licenseCategory")?.toString().trim();
  const licenseExpiryVal = formData.get("licenseExpiry")?.toString();
  const contactNumber = formData.get("contactNumber")?.toString().trim();
  const safetyScore = parseFloat(formData.get("safetyScore")?.toString() || "100");
  const safetyComplianceStatus = formData.get("safetyComplianceStatus")?.toString() || "Available";
  const activeStatus = formData.get("activeStatus")?.toString() || "Available";

  if (!name || !licenseNumber || !licenseCategory || !licenseExpiryVal || !contactNumber || isNaN(safetyScore)) {
    return { success: false, error: "Please fill out all fields with valid information." };
  }

  try {
    // Check uniqueness
    const existing = await prisma.driver.findUnique({
      where: { licenseNumber },
    });

    if (existing) {
      return { success: false, error: `Driver with license number ${licenseNumber} already exists.` };
    }

    const licenseExpiry = new Date(licenseExpiryVal);

    await prisma.driver.create({
      data: {
        name,
        licenseNumber,
        licenseCategory,
        licenseExpiry,
        contactNumber,
        tripCompletionRate: safetyScore,
        safetyComplianceStatus,
        activeStatus,
      },
    });

    revalidatePath("/drivers");
    revalidatePath("/dashboard");
    revalidatePath("/trips");
    return { success: true };
  } catch (error) {
    console.error("Failed to create driver:", error);
    return { success: false, error: "Database error occurred." };
  }
}

export async function updateDriver(id: number, formData: FormData): Promise<DriverActionState> {
  const name = formData.get("name")?.toString().trim();
  const licenseNumber = formData.get("licenseNumber")?.toString().trim().toUpperCase();
  const licenseCategory = formData.get("licenseCategory")?.toString().trim();
  const licenseExpiryVal = formData.get("licenseExpiry")?.toString();
  const contactNumber = formData.get("contactNumber")?.toString().trim();
  const safetyScore = parseFloat(formData.get("safetyScore")?.toString() || "100");
  const safetyComplianceStatus = formData.get("safetyComplianceStatus")?.toString() || "Available";
  const activeStatus = formData.get("activeStatus")?.toString() || "Available";

  if (!name || !licenseNumber || !licenseCategory || !licenseExpiryVal || !contactNumber || isNaN(safetyScore)) {
    return { success: false, error: "Please fill out all fields with valid information." };
  }

  try {
    // Check uniqueness excluding current driver
    const existing = await prisma.driver.findFirst({
      where: {
        licenseNumber,
        id: { not: id },
      },
    });

    if (existing) {
      return { success: false, error: `Driver with license number ${licenseNumber} already exists.` };
    }

    const licenseExpiry = new Date(licenseExpiryVal);

    await prisma.driver.update({
      where: { id },
      data: {
        name,
        licenseNumber,
        licenseCategory,
        licenseExpiry,
        contactNumber,
        tripCompletionRate: safetyScore,
        safetyComplianceStatus,
        activeStatus,
      },
    });

    revalidatePath("/drivers");
    revalidatePath("/dashboard");
    revalidatePath("/trips");
    return { success: true };
  } catch (error) {
    console.error("Failed to update driver:", error);
    return { success: false, error: "Database error occurred." };
  }
}

export async function deleteDriver(id: number): Promise<DriverActionState> {
  try {
    // Check active dispatches
    const activeTrips = await prisma.trip.findFirst({
      where: {
        driverId: id,
        status: { in: ["On Trip", "Dispatched"] },
      },
    });

    if (activeTrips) {
      return { success: false, error: "Cannot delete driver assigned to active trips." };
    }

    await prisma.trip.deleteMany({ where: { driverId: id } });
    await prisma.driver.delete({ where: { id } });

    revalidatePath("/drivers");
    revalidatePath("/dashboard");
    revalidatePath("/trips");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete driver:", error);
    return { success: false, error: "Database error occurred." };
  }
}
