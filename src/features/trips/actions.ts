"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface ActionResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Creates or plans a trip (Draft or Dispatched)
 */
export async function createTrip(formData: {
  source: string;
  destination: string;
  vehicleId: number | null;
  driverId: number | null;
  cargoWeight: number;
  plannedDistance: number;
  status: "Draft" | "Dispatched";
  eta: string;
}): Promise<ActionResponse> {
  try {
    const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance, status, eta } = formData;

    // Hard validations for Dispatch status
    if (status === "Dispatched") {
      if (!vehicleId) {
        return { success: false, message: "A vehicle must be selected to dispatch a trip." };
      }
      if (!driverId) {
        return { success: false, message: "A driver must be assigned to dispatch a trip." };
      }
    }

    // 1. Vehicle checks (if assigned)
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle) {
        return { success: false, message: "Selected vehicle does not exist." };
      }
      
      // Prevent retired vehicles
      if (vehicle.status === "Retired") {
        return { success: false, message: "Selected vehicle is retired and cannot be used." };
      }

      // If dispatching, check if vehicle is already occupied
      if (status === "Dispatched" && vehicle.status !== "Available") {
        return { 
          success: false, 
          message: `Vehicle is currently unavailable (Status: ${vehicle.status}).` 
        };
      }

      // Check cargo weight capacity
      if (cargoWeight > vehicle.maxCapacity) {
        return { 
          success: false, 
          message: `Cargo weight (${cargoWeight} kg) exceeds vehicle's maximum capacity (${vehicle.maxCapacity} kg).` 
        };
      }
    }

    // 2. Driver checks (if assigned)
    if (driverId) {
      const driver = await prisma.driver.findUnique({ where: { id: driverId } });
      if (!driver) {
        return { success: false, message: "Selected driver does not exist." };
      }

      // If dispatching, check if driver is already occupied
      if (status === "Dispatched" && driver.activeStatus !== "Available") {
        return { 
          success: false, 
          message: "Selected driver is already active on another trip." 
        };
      }

      // Check safety compliance & license expiry
      if (driver.safetyComplianceStatus === "Suspended") {
        return { success: false, message: "Selected driver is suspended and cannot be dispatched." };
      }

      if (new Date(driver.licenseExpiry) < new Date()) {
        return { success: false, message: "Selected driver has an expired driving license." };
      }
    }

    // 3. Create the Trip
    // Note: We use a default hardcoded dispatcher ID of 1 (or the first user) for simplicity
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      return { success: false, message: "No dispatchers/users found in database to link trip creation." };
    }

    const trip = await prisma.trip.create({
      data: {
        source,
        destination,
        vehicleId,
        driverId,
        cargoWeight,
        plannedDistance,
        status,
        eta,
        createdById: defaultUser.id,
      },
    });

    // 4. Update Vehicle and Driver status to "On Trip" if status is "Dispatched"
    if (status === "Dispatched") {
      if (vehicleId) {
        await prisma.vehicle.update({
          where: { id: vehicleId },
          data: { status: "On Trip" },
        });
      }
      if (driverId) {
        await prisma.driver.update({
          where: { id: driverId },
          data: { activeStatus: "On Trip" },
        });
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/trips");
    return { success: true, message: `Trip planned successfully as ${status}.`, data: trip };

  } catch (error: any) {
    console.error("Failed to create trip:", error);
    return { success: false, message: `Internal server error: ${error.message || error}` };
  }
}

/**
 * Completes an active trip
 */
export async function completeTrip(
  tripId: number,
  finalOdometer: number,
  fuelConsumed: number
): Promise<ActionResponse> {
  try {
    // 1. Fetch Trip details
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });

    if (!trip) {
      return { success: false, message: "Trip not found." };
    }

    if (trip.status !== "On Trip" && trip.status !== "Dispatched") {
      return { success: false, message: "Only active or dispatched trips can be completed." };
    }

    if (!trip.vehicleId) {
      return { success: false, message: "Cannot complete a trip that has no vehicle assigned." };
    }

    // 2. Validate Odometer
    if (trip.vehicle && finalOdometer <= trip.vehicle.odometer) {
      return {
        success: false,
        message: `Final odometer (${finalOdometer} km) must be greater than the vehicle's current odometer (${trip.vehicle.odometer} km).`,
      };
    }

    // 3. Update Trip
    await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: "Completed",
        finalOdometer,
        fuelConsumed,
      },
    });

    // 4. Update Vehicle (odometer, set status to Available)
    await prisma.vehicle.update({
      where: { id: trip.vehicleId },
      data: {
        odometer: finalOdometer,
        status: "Available",
      },
    });

    // 5. Update Driver (set status to Available)
    if (trip.driverId) {
      await prisma.driver.update({
        where: { id: trip.driverId },
        data: { activeStatus: "Available" },
      });
    }

    // 6. Automatically log a fuel entry for financial analysis
    await prisma.fuelLog.create({
      data: {
        vehicleId: trip.vehicleId,
        liters: fuelConsumed,
        // Assume average cost of 100 INR per liter for realism
        cost: fuelConsumed * 100,
        date: new Date(),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/trips");
    return { success: true, message: "Trip successfully completed, odometer updated, and fuel log recorded." };

  } catch (error: any) {
    console.error("Failed to complete trip:", error);
    return { success: false, message: `Internal server error: ${error.message || error}` };
  }
}

/**
 * Cancels a planned or active trip
 */
export async function cancelTrip(tripId: number): Promise<ActionResponse> {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return { success: false, message: "Trip not found." };
    }

    if (trip.status === "Completed" || trip.status === "Cancelled") {
      return { success: false, message: "Completed or already cancelled trips cannot be modified." };
    }

    // If trip was active/dispatched, restore vehicle & driver status to Available
    if (trip.status === "Dispatched" || trip.status === "On Trip") {
      if (trip.vehicleId) {
        await prisma.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: "Available" },
        });
      }
      if (trip.driverId) {
        await prisma.driver.update({
          where: { id: trip.driverId },
          data: { activeStatus: "Available" },
        });
      }
    }

    // Update Trip status to Cancelled
    await prisma.trip.update({
      where: { id: tripId },
      data: { status: "Cancelled" },
    });

    revalidatePath("/dashboard");
    revalidatePath("/trips");
    return { success: true, message: "Trip successfully cancelled and resources released." };

  } catch (error: any) {
    console.error("Failed to cancel trip:", error);
    return { success: false, message: `Internal server error: ${error.message || error}` };
  }
}
