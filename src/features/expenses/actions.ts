"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface ExpenseActionState {
  success: boolean;
  error?: string;
}

export async function createFuelLog(prevState: any, formData: FormData): Promise<ExpenseActionState> {
  const vehicleIdVal = formData.get("vehicleId")?.toString();
  const liters = parseFloat(formData.get("liters")?.toString() || "0");
  const cost = parseFloat(formData.get("cost")?.toString() || "0");
  const dateVal = formData.get("date")?.toString();

  if (!vehicleIdVal || isNaN(liters) || liters <= 0 || isNaN(cost) || cost <= 0) {
    return { success: false, error: "Please enter valid vehicle, liters, and cost numbers." };
  }

  const vehicleId = parseInt(vehicleIdVal);
  const date = dateVal ? new Date(dateVal) : new Date();

  // Block future dates
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date > today) {
    return { success: false, error: "Cannot log fuel receipt on a future date." };
  }

  try {
    await prisma.fuelLog.create({
      data: {
        vehicleId,
        liters,
        cost,
        date,
      },
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    revalidatePath("/analytics");
    return { success: true };
  } catch (error) {
    console.error("Failed to create fuel log:", error);
    return { success: false, error: "Database error occurred." };
  }
}

export async function createExpenseLog(prevState: any, formData: FormData): Promise<ExpenseActionState> {
  const tripIdVal = formData.get("tripId")?.toString();
  const toll = parseFloat(formData.get("toll")?.toString() || "0");
  const other = parseFloat(formData.get("other")?.toString() || "0");
  const dateVal = formData.get("date")?.toString();

  if (!tripIdVal || isNaN(toll) || toll < 0 || isNaN(other) || other < 0) {
    return { success: false, error: "Please choose a valid trip and enter positive amounts." };
  }

  const tripId = parseInt(tripIdVal);
  const total = toll + other;
  const date = dateVal ? new Date(dateVal) : new Date();

  // Block future dates
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date > today) {
    return { success: false, error: "Cannot log expense on a future date." };
  }

  try {
    await prisma.expense.create({
      data: {
        tripId,
        toll,
        other,
        total,
        date,
      },
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    revalidatePath("/analytics");
    return { success: true };
  } catch (error) {
    console.error("Failed to create expense log:", error);
    return { success: false, error: "Database error occurred." };
  }
}
