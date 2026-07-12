"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface TripActionState {
  success: boolean;
  error?: string;
}

export async function createTrip(prevState: any, formData: FormData): Promise<TripActionState> {
  const source = formData.get("source")?.toString().trim();
  const destination = formData.get("destination")?.toString().trim();
  const vehicleIdVal = formData.get("vehicleId")?.toString();
  const driverIdVal = formData.get("driverId")?.toString();
  const cargoWeight = parseFloat(formData.get("cargoWeight")?.toString() || "0");
  const plannedDistance = parseFloat(formData.get("plannedDistance")?.toString() || "0");
  const eta = formData.get("eta")?.toString().trim() || "Awaiting dispatch";
  const createdById = parseInt(formData.get("createdById")?.toString() || "1");

  if (!source || !destination || isNaN(cargoWeight) || isNaN(plannedDistance)) {
    return { success: false, error: "Please enter valid route details." };
  }

  const vehicleId = vehicleIdVal ? parseInt(vehicleIdVal) : null;
  const driverId = driverIdVal ? parseInt(driverIdVal) : null;

  try {
    // 1. Initial Validation Checks for assignments if they are set
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (vehicle) {
        if (cargoWeight > vehicle.maxCapacity) {
          return {
            success: false,
            error: `Cargo weight (${cargoWeight} kg) exceeds vehicle maximum capacity (${vehicle.maxCapacity} kg).`,
          };
        }
      }
    }

    await prisma.trip.create({
      data: {
        source,
        destination,
        vehicleId,
        driverId,
        cargoWeight,
        plannedDistance,
        status: "Draft",
        eta,
        createdById,
      },
    });

    revalidatePath("/trips");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to create trip draft:", error);
    return { success: false, error: "Database error occurred." };
  }
}

export async function dispatchTrip(tripId: number): Promise<TripActionState> {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });

    if (!trip) {
      return { success: false, error: "Trip not found." };
    }

    if (!trip.vehicleId || !trip.driverId) {
      return { success: false, error: "Cannot dispatch a trip without a vehicle and driver assigned." };
    }

    const { vehicle, driver, cargoWeight } = trip;

    if (!vehicle || !driver) {
      return { success: false, error: "Assigned vehicle or driver record is missing." };
    }

    // 2. Strict Dispatch Validations
    // Check Vehicle Status
    if (vehicle.status !== "Available") {
      return {
        success: false,
        error: `Vehicle ${vehicle.registrationNumber} is not available (Current status: ${vehicle.status}).`,
      };
    }

    // Check Driver Duty Status
    if (driver.activeStatus !== "Available") {
      return {
        success: false,
        error: `Driver ${driver.name} is not available (Current status: ${driver.activeStatus}).`,
      };
    }

    // Check Driver License Expiry
    const today = new Date();
    if (new Date(driver.licenseExpiry) <= today) {
      return {
        success: false,
        error: `Cannot dispatch: Driver ${driver.name} has an expired license (Expired on: ${new Date(
          driver.licenseExpiry
        ).toLocaleDateString()}).`,
      };
    }

    // Check Capacity
    if (cargoWeight > vehicle.maxCapacity) {
      return {
        success: false,
        error: `Cannot dispatch: Cargo weight (${cargoWeight} kg) exceeds vehicle max capacity (${vehicle.maxCapacity} kg).`,
      };
    }

    // 3. Perform atomic state changes
    await prisma.$transaction([
      // Update Trip Status
      prisma.trip.update({
        where: { id: tripId },
        data: { status: "Dispatched" },
      }),
      // Update Vehicle Status
      prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { status: "On Trip" },
      }),
      // Update Driver Status
      prisma.driver.update({
        where: { id: driver.id },
        data: { activeStatus: "On Trip" },
      }),
    ]);

    revalidatePath("/trips");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to dispatch trip:", error);
    return { success: false, error: "Database transaction error occurred during dispatch." };
  }
}

export async function advanceTripStatus(
  tripId: number,
  nextStatus: string,
  finalOdometer?: number,
  fuelConsumed?: number
): Promise<TripActionState> {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });

    if (!trip) {
      return { success: false, error: "Trip not found." };
    }

    if (nextStatus === "Completed") {
      if (finalOdometer === undefined || fuelConsumed === undefined) {
        return { success: false, error: "Final odometer and fuel consumed are required to complete a trip." };
      }

      const vehicle = trip.vehicle;
      if (!vehicle) {
        return { success: false, error: "Vehicle not found on this trip." };
      }

      if (finalOdometer < vehicle.odometer) {
        return {
          success: false,
          error: `Final odometer (${finalOdometer} km) cannot be less than initial odometer (${vehicle.odometer} km).`,
        };
      }

      // Complete trip, update vehicle odometer, reset vehicle & driver to Available
      await prisma.$transaction(async (tx) => {
        // Update Trip
        await tx.trip.update({
          where: { id: tripId },
          data: {
            status: "Completed",
            finalOdometer,
            fuelConsumed,
            eta: "—",
          },
        });

        // Update Vehicle Odometer and reset Status
        await tx.vehicle.update({
          where: { id: vehicle.id },
          data: {
            odometer: finalOdometer,
            status: "Available",
          },
        });

        // Reset Driver
        if (trip.driverId) {
          await tx.driver.update({
            where: { id: trip.driverId },
            data: { activeStatus: "Available" },
          });
        }

        // Auto log fuel receipt if fuelConsumed and cost are simulated
        const fuelCost = fuelConsumed * 95.0;
        await tx.fuelLog.create({
          data: {
            vehicleId: vehicle.id,
            liters: fuelConsumed,
            cost: fuelCost,
          },
        });

        // Log trip expenses (Toll cost = ₹150, Other misc = ₹80)
        await tx.expense.create({
          data: {
            tripId,
            toll: 150.0,
            other: 80.0,
            total: 230.0,
          },
        });
      });
    } else if (nextStatus === "Cancelled") {
      // Cancel trip, reset vehicle & driver to Available
      await prisma.$transaction([
        prisma.trip.update({
          where: { id: tripId },
          data: { status: "Cancelled", eta: "—" },
        }),
        ...(trip.vehicleId
          ? [
              prisma.vehicle.update({
                where: { id: trip.vehicleId },
                data: { status: "Available" },
              }),
            ]
          : []),
        ...(trip.driverId
          ? [
              prisma.driver.update({
                where: { id: trip.driverId },
                data: { activeStatus: "Available" },
              }),
            ]
          : []),
      ]);
    } else {
      // Simple status transition (e.g. Dispatched -> In Transit)
      await prisma.trip.update({
        where: { id: tripId },
        data: { status: nextStatus },
      });
    }

    revalidatePath("/trips");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to advance trip status:", error);
    return { success: false, error: "Database transaction error occurred." };
  }
}

export async function dispatchDraftTrip(
  tripId: number,
  vehicleId: number,
  driverId: number,
  eta: string
): Promise<TripActionState> {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      return { success: false, error: "Trip not found." };
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return { success: false, error: "Vehicle not found." };
    }
    if (vehicle.status !== "Available") {
      return { success: false, error: `Vehicle is currently unavailable (Status: ${vehicle.status}).` };
    }
    if (trip.cargoWeight > vehicle.maxCapacity) {
      return { success: false, error: `Cargo weight (${trip.cargoWeight} kg) exceeds vehicle capacity (${vehicle.maxCapacity} kg).` };
    }

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      return { success: false, error: "Driver not found." };
    }
    if (driver.activeStatus !== "Available") {
      return { success: false, error: "Driver is currently active on another trip." };
    }
    if (driver.safetyComplianceStatus === "Suspended") {
      return { success: false, error: "Selected driver is suspended." };
    }
    if (new Date(driver.licenseExpiry) <= new Date()) {
      return { success: false, error: "Selected driver has an expired driving license." };
    }

    await prisma.$transaction([
      prisma.trip.update({
        where: { id: tripId },
        data: {
          vehicleId,
          driverId,
          status: "Dispatched",
          eta: eta || "Awaiting dispatch",
        },
      }),
      prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: "On Trip" },
      }),
      prisma.driver.update({
        where: { id: driverId },
        data: { activeStatus: "On Trip" },
      }),
    ]);

    revalidatePath("/trips");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to dispatch draft trip:", error);
    return { success: false, error: "Database transaction error occurred during dispatch." };
  }
}
