"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface SettingsActionState {
  success: boolean;
  error?: string;
}

export async function updateSettings(prevState: any, formData: FormData): Promise<SettingsActionState> {
  const depotName = formData.get("depotName")?.toString().trim();
  const currency = formData.get("currency")?.toString().trim();
  const distanceUnit = formData.get("distanceUnit")?.toString().trim();

  if (!depotName || !currency || !distanceUnit) {
    return { success: false, error: "Please fill out all settings fields." };
  }

  try {
    // Update the singleton settings (id: 1)
    // Using upsert in case the record is deleted
    await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        depotName,
        currency,
        distanceUnit,
      },
      create: {
        id: 1,
        depotName,
        currency,
        distanceUnit,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to save settings:", error);
    return { success: false, error: "Database error occurred." };
  }
}
