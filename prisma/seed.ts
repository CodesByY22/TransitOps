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

  console.log("Settings and initial logs created.");
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
