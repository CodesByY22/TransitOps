import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding started...");

  // 1. Clean existing records (Optional, useful for clean re-seeds)
  await prisma.settings.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // 2. Create Roles
  const fleetManagerRole = await prisma.role.create({
    data: { name: "Fleet Manager" },
  });
  const dispatcherRole = await prisma.role.create({
    data: { name: "Dispatcher" },
  });
  const safetyOfficerRole = await prisma.role.create({
    data: { name: "Safety Officer" },
  });
  const financialAnalystRole = await prisma.role.create({
    data: { name: "Financial Analyst" },
  });

  console.log("Roles created.");

  // 3. Create Users (with simple placeholder password hashes for now)
  const manager = await prisma.user.create({
    data: {
      email: "manager@transitops.in",
      name: "Mahavir Patel",
      passwordHash: "pbkdf2_sha256$placeholder$mahavir123",
      roleId: fleetManagerRole.id,
    },
  });

  const dispatcher = await prisma.user.create({
    data: {
      email: "raven.k@transitops.in",
      name: "Raven K.",
      passwordHash: "pbkdf2_sha256$placeholder$raven123",
      roleId: dispatcherRole.id,
    },
  });

  const safetyOfficer = await prisma.user.create({
    data: {
      email: "safety@transitops.in",
      name: "Compliance Officer",
      passwordHash: "pbkdf2_sha256$placeholder$safety123",
      roleId: safetyOfficerRole.id,
    },
  });

  const analyst = await prisma.user.create({
    data: {
      email: "analyst@transitops.in",
      name: "Finance Lead",
      passwordHash: "pbkdf2_sha256$placeholder$finance123",
      roleId: financialAnalystRole.id,
    },
  });

  console.log("Users created.");

  // 4. Create Vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: {
      registrationNumber: "GJ01AB4521",
      model: "VAN-05",
      type: "Van",
      maxCapacity: 500.0, // kg
      odometer: 74000.0,
      acquisitionCost: 620000.0, // INR
      status: "Available",
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      registrationNumber: "GJ01AB9981",
      model: "TRUCK-11",
      type: "Truck",
      maxCapacity: 5000.0, // 5 Ton = 5000kg
      odometer: 182000.0,
      acquisitionCost: 2450000.0,
      status: "On Trip",
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      registrationNumber: "GJ01AB1120",
      model: "MINI-03",
      type: "Mini",
      maxCapacity: 1000.0, // 1 Ton = 1000kg
      odometer: 66000.0,
      acquisitionCost: 410000.0,
      status: "In Shop",
    },
  });

  const vehicle4 = await prisma.vehicle.create({
    data: {
      registrationNumber: "GJ01AB0008",
      model: "VAN-09",
      type: "Van",
      maxCapacity: 750.0,
      odometer: 241900.0,
      acquisitionCost: 590000.0,
      status: "Retired",
    },
  });

  console.log("Vehicles created.");

  // 5. Create Drivers
  const driver1 = await prisma.driver.create({
    data: {
      name: "Alex",
      licenseNumber: "DL-88213",
      licenseCategory: "LMV",
      licenseExpiry: new Date("2028-12-31T00:00:00Z"),
      contactNumber: "98765xxxxx",
      tripCompletionRate: 96.0,
      safetyComplianceStatus: "Available",
      activeStatus: "Available",
    },
  });

  const driver2 = await prisma.driver.create({
    data: {
      name: "John",
      licenseNumber: "DL-44120",
      licenseCategory: "HMV",
      licenseExpiry: new Date("2025-03-15T00:00:00Z"), // Expired!
      contactNumber: "98220xxxxx",
      tripCompletionRate: 81.0,
      safetyComplianceStatus: "Suspended",
      activeStatus: "Suspended",
    },
  });

  const driver3 = await prisma.driver.create({
    data: {
      name: "Priya",
      licenseNumber: "DL-77031",
      licenseCategory: "LMV",
      licenseExpiry: new Date("2027-08-20T00:00:00Z"),
      contactNumber: "99110xxxxx",
      tripCompletionRate: 99.0,
      safetyComplianceStatus: "Available",
      activeStatus: "On Trip",
    },
  });

  const driver4 = await prisma.driver.create({
    data: {
      name: "Suresh",
      licenseNumber: "DL-90045",
      licenseCategory: "HMV",
      licenseExpiry: new Date("2027-01-10T00:00:00Z"),
      contactNumber: "97440xxxxx",
      tripCompletionRate: 88.0,
      safetyComplianceStatus: "Available",
      activeStatus: "Off Duty",
    },
  });

  console.log("Drivers created.");

  // 6. Create initial Settings
  await prisma.settings.create({
    data: {
      depotName: "Gandhinagar Depot GJ14",
      currency: "INR (Rs)",
      distanceUnit: "Kilometers",
    },
  });

  // 7. Create some historical logs for demo validation
  // Maintenance log
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: vehicle3.id,
      description: "Tyre Replace",
      cost: 6200.0,
      startDate: new Date("2026-07-10T00:00:00Z"),
      status: "Active",
    },
  });
  
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: vehicle2.id,
      description: "Engine Repair",
      cost: 18000.0,
      startDate: new Date("2026-06-15T00:00:00Z"),
      endDate: new Date("2026-06-20T00:00:00Z"),
      status: "Completed",
    },
  });

  // Fuel log
  await prisma.fuelLog.create({
    data: {
      vehicleId: vehicle1.id,
      liters: 42.0,
      cost: 3150.0,
      date: new Date("2026-07-05T00:00:00Z"),
    },
  });

  // 8. Create mock trips for dashboard display
  const trip1 = await prisma.trip.create({
    data: {
      source: "Gandhinagar Depot",
      destination: "Ahmedabad Hub",
      vehicleId: vehicle1.id,
      driverId: driver1.id,
      cargoWeight: 450.0,
      plannedDistance: 38.0,
      status: "On Trip",
      eta: "45 min",
      createdById: dispatcher.id,
    },
  });

  const trip2 = await prisma.trip.create({
    data: {
      source: "Vatva Industrial Area",
      destination: "Sanand Warehouse",
      vehicleId: vehicle2.id,
      driverId: driver2.id,
      cargoWeight: 2500.0,
      plannedDistance: 45.0,
      status: "Completed",
      finalOdometer: 182100.0,
      fuelConsumed: 12.0,
      createdById: dispatcher.id,
    },
  });

  const trip3 = await prisma.trip.create({
    data: {
      source: "Mansa",
      destination: "Kalol Depot",
      vehicleId: vehicle3.id,
      driverId: driver3.id,
      cargoWeight: 800.0,
      plannedDistance: 15.0,
      status: "Dispatched",
      eta: "1h 10m",
      createdById: dispatcher.id,
    },
  });

  const trip4 = await prisma.trip.create({
    data: {
      source: "Gandhinagar Depot",
      destination: "Surat Hub",
      vehicleId: null,
      driverId: null,
      cargoWeight: 0.0,
      plannedDistance: 280.0,
      status: "Draft",
      eta: "Awaiting vehicle",
      createdById: dispatcher.id,
    },
  });

  // Create mock expenses for trip1 and trip2
  await prisma.expense.create({
    data: {
      tripId: trip1.id,
      toll: 120.0,
      other: 0.0,
      maintenanceLinked: 0.0,
      total: 120.0,
    },
  });

  await prisma.expense.create({
    data: {
      tripId: trip2.id,
      toll: 340.0,
      other: 150.0,
      maintenanceLinked: 18000.0, // Linked from completed maintenance record
      total: 18490.0,
    },
  });

  console.log("Settings, mock trips, expenses, and initial logs created.");
  console.log("Seeding successfully completed!");
}

main()
  .catch((e) => {
    console.error("Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
