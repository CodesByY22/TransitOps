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

  // 1. Clean existing records
  await prisma.settings.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  console.log("Existing tables cleaned.");

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

  // 3. Create Users
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

  // 4. Create Vehicles (15 units)
  const v1 = await prisma.vehicle.create({ data: { registrationNumber: "GJ01AB4521", model: "VAN-05", type: "Van", maxCapacity: 500, odometer: 74000, acquisitionCost: 620000, status: "On Trip", region: "West" } });
  const v2 = await prisma.vehicle.create({ data: { registrationNumber: "GJ01AB9981", model: "TRUCK-11", type: "Truck", maxCapacity: 5000, odometer: 182000, acquisitionCost: 2450000, status: "Available", region: "North" } });
  const v3 = await prisma.vehicle.create({ data: { registrationNumber: "GJ01AB1120", model: "MINI-03", type: "Mini", maxCapacity: 1000, odometer: 66000, acquisitionCost: 410000, status: "On Trip", region: "East" } });
  const v4 = await prisma.vehicle.create({ data: { registrationNumber: "GJ01AB0008", model: "VAN-09", type: "Van", maxCapacity: 750, odometer: 241900, acquisitionCost: 590000, status: "Retired", region: "South" } });
  
  const v5 = await prisma.vehicle.create({ data: { registrationNumber: "GJ03XY1001", model: "TRUCK-01", type: "Truck", maxCapacity: 8000, odometer: 104000, acquisitionCost: 3100000, status: "Available", region: "West" } });
  const v6 = await prisma.vehicle.create({ data: { registrationNumber: "GJ03XY1002", model: "TRUCK-02", type: "Truck", maxCapacity: 6000, odometer: 112000, acquisitionCost: 2800000, status: "Available", region: "North" } });
  const v7 = await prisma.vehicle.create({ data: { registrationNumber: "GJ05LM3344", model: "VAN-01", type: "Van", maxCapacity: 600, odometer: 52000, acquisitionCost: 650000, status: "Available", region: "East" } });
  const v8 = await prisma.vehicle.create({ data: { registrationNumber: "GJ05LM3345", model: "VAN-02", type: "Van", maxCapacity: 650, odometer: 49000, acquisitionCost: 680000, status: "Available", region: "South" } });
  const v9 = await prisma.vehicle.create({ data: { registrationNumber: "GJ07PR8800", model: "MINI-01", type: "Mini", maxCapacity: 1200, odometer: 87000, acquisitionCost: 450000, status: "In Shop", region: "West" } });
  const v10 = await prisma.vehicle.create({ data: { registrationNumber: "GJ07PR8801", model: "MINI-02", type: "Mini", maxCapacity: 1500, odometer: 93000, acquisitionCost: 480000, status: "Available", region: "North" } });
  
  const v11 = await prisma.vehicle.create({ data: { registrationNumber: "GJ12JK9999", model: "TRUCK-12", type: "Truck", maxCapacity: 12000, odometer: 205000, acquisitionCost: 4200000, status: "On Trip", region: "East" } });
  const v12 = await prisma.vehicle.create({ data: { registrationNumber: "GJ12JK8888", model: "TRUCK-15", type: "Truck", maxCapacity: 10000, odometer: 154000, acquisitionCost: 3800000, status: "Available", region: "South" } });
  const v13 = await prisma.vehicle.create({ data: { registrationNumber: "GJ14JK7777", model: "MINI-04", type: "Mini", maxCapacity: 1800, odometer: 32000, acquisitionCost: 510000, status: "Available", region: "West" } });
  const v14 = await prisma.vehicle.create({ data: { registrationNumber: "GJ14JK6666", model: "VAN-07", type: "Van", maxCapacity: 800, odometer: 28000, acquisitionCost: 710000, status: "Available", region: "North" } });
  const v15 = await prisma.vehicle.create({ data: { registrationNumber: "GJ16TR5555", model: "TRUCK-18", type: "Truck", maxCapacity: 15000, odometer: 310000, acquisitionCost: 4900000, status: "In Shop", region: "South" } });

  console.log("15 Vehicles created.");

  // 5. Create Drivers (15 units)
  const d1 = await prisma.driver.create({ data: { name: "Alex Kumar", licenseNumber: "DL-88213", licenseCategory: "LMV", licenseExpiry: new Date("2028-12-31"), contactNumber: "9876543210", tripCompletionRate: 98, safetyComplianceStatus: "Available", activeStatus: "On Trip" } });
  const d2 = await prisma.driver.create({ data: { name: "John Doe", licenseNumber: "DL-44120", licenseCategory: "HMV", licenseExpiry: new Date("2025-03-15"), contactNumber: "9822011223", tripCompletionRate: 81, safetyComplianceStatus: "Suspended", activeStatus: "Available" } });
  const d3 = await prisma.driver.create({ data: { name: "Priya Sharma", licenseNumber: "DL-77031", licenseCategory: "LMV", licenseExpiry: new Date("2027-08-20"), contactNumber: "9911044332", tripCompletionRate: 99, safetyComplianceStatus: "Available", activeStatus: "On Trip" } });
  const d4 = await prisma.driver.create({ data: { name: "Suresh Raina", licenseNumber: "DL-90045", licenseCategory: "HMV", licenseExpiry: new Date("2027-01-10"), contactNumber: "9744099887", tripCompletionRate: 92, safetyComplianceStatus: "Available", activeStatus: "Available" } });
  
  const d5 = await prisma.driver.create({ data: { name: "Rajesh Kumar", licenseNumber: "DL-11223", licenseCategory: "HMV", licenseExpiry: new Date("2028-05-12"), contactNumber: "9633211440", tripCompletionRate: 95, safetyComplianceStatus: "Available", activeStatus: "Available" } });
  const d6 = await prisma.driver.create({ data: { name: "Amit Shah", licenseNumber: "DL-33445", licenseCategory: "LMV", licenseExpiry: new Date("2029-10-09"), contactNumber: "9511200334", tripCompletionRate: 97, safetyComplianceStatus: "Available", activeStatus: "Available" } });
  const d7 = await prisma.driver.create({ data: { name: "Vikram Rathore", licenseNumber: "DL-55667", licenseCategory: "HMV", licenseExpiry: new Date("2026-11-22"), contactNumber: "9422311445", tripCompletionRate: 89, safetyComplianceStatus: "Available", activeStatus: "Available" } });
  const d8 = await prisma.driver.create({ data: { name: "Sunita Rao", licenseNumber: "DL-77889", licenseCategory: "LMV", licenseExpiry: new Date("2027-04-18"), contactNumber: "9311022998", tripCompletionRate: 94, safetyComplianceStatus: "Available", activeStatus: "Available" } });
  const d9 = await prisma.driver.create({ data: { name: "Kavita Patel", licenseNumber: "DL-99001", licenseCategory: "LMV", licenseExpiry: new Date("2028-09-05"), contactNumber: "9200111223", tripCompletionRate: 96, safetyComplianceStatus: "Available", activeStatus: "Available" } });
  const d10 = await prisma.driver.create({ data: { name: "Manish Pandey", licenseNumber: "DL-12123", licenseCategory: "HMV", licenseExpiry: new Date("2029-02-14"), contactNumber: "9133444555", tripCompletionRate: 93, safetyComplianceStatus: "Available", activeStatus: "Available" } });
  
  const d11 = await prisma.driver.create({ data: { name: "Rohan Das", licenseNumber: "DL-45456", licenseCategory: "HMV", licenseExpiry: new Date("2027-12-25"), contactNumber: "9044555666", tripCompletionRate: 90, safetyComplianceStatus: "Available", activeStatus: "On Trip" } });
  const d12 = await prisma.driver.create({ data: { name: "Rahul Dravid", licenseNumber: "DL-78789", licenseCategory: "HMV", licenseExpiry: new Date("2026-06-30"), contactNumber: "8955666777", tripCompletionRate: 99, safetyComplianceStatus: "Available", activeStatus: "Available" } });
  const d13 = await prisma.driver.create({ data: { name: "Vijay Singh", licenseNumber: "DL-98980", licenseCategory: "LMV", licenseExpiry: new Date("2028-03-20"), contactNumber: "8866777888", tripCompletionRate: 91, safetyComplianceStatus: "Available", activeStatus: "Available" } });
  const d14 = await prisma.driver.create({ data: { name: "Deepak Chahar", licenseNumber: "DL-34342", licenseCategory: "HMV", licenseExpiry: new Date("2027-05-15"), contactNumber: "8777888999", tripCompletionRate: 88, safetyComplianceStatus: "Available", activeStatus: "Available" } });
  const d15 = await prisma.driver.create({ data: { name: "Anita Desai", licenseNumber: "DL-56567", licenseCategory: "LMV", licenseExpiry: new Date("2029-08-01"), contactNumber: "8688999000", tripCompletionRate: 95, safetyComplianceStatus: "Available", activeStatus: "Available" } });

  console.log("15 Drivers created.");

  // 6. Create Depot Settings
  await prisma.settings.create({
    data: {
      depotName: "Gandhinagar Depot GJ14",
      currency: "INR (Rs)",
      distanceUnit: "Kilometers",
    },
  });

  // 7. Create Maintenance Logs (10 logs)
  await prisma.maintenanceLog.create({ data: { vehicleId: v3.id, description: "Tyre Replacement", cost: 6200, startDate: new Date("2026-07-10"), status: "Active" } });
  await prisma.maintenanceLog.create({ data: { vehicleId: v2.id, description: "Engine Overhaul", cost: 18000, startDate: new Date("2026-06-15"), endDate: new Date("2026-06-20"), status: "Completed" } });
  await prisma.maintenanceLog.create({ data: { vehicleId: v9.id, description: "Brake Pads Fitting", cost: 4500, startDate: new Date("2026-07-11"), status: "Active" } });
  await prisma.maintenanceLog.create({ data: { vehicleId: v15.id, description: "Clutch Plate Repair", cost: 12500, startDate: new Date("2026-07-09"), status: "Active" } });
  await prisma.maintenanceLog.create({ data: { vehicleId: v1.id, description: "Windshield Replacement", cost: 7200, startDate: new Date("2026-05-10"), endDate: new Date("2026-05-12"), status: "Completed" } });
  await prisma.maintenanceLog.create({ data: { vehicleId: v5.id, description: "Suspension Tuning", cost: 11000, startDate: new Date("2026-05-20"), endDate: new Date("2026-05-22"), status: "Completed" } });
  await prisma.maintenanceLog.create({ data: { vehicleId: v6.id, description: "Radiator Flush", cost: 3500, startDate: new Date("2026-06-01"), endDate: new Date("2026-06-02"), status: "Completed" } });
  await prisma.maintenanceLog.create({ data: { vehicleId: v7.id, description: "Oil Filter Change", cost: 2500, startDate: new Date("2026-06-10"), endDate: new Date("2026-06-10"), status: "Completed" } });
  await prisma.maintenanceLog.create({ data: { vehicleId: v10.id, description: "Battery Replacement", cost: 5800, startDate: new Date("2026-06-28"), endDate: new Date("2026-06-29"), status: "Completed" } });
  await prisma.maintenanceLog.create({ data: { vehicleId: v12.id, description: "Alternator Service", cost: 6800, startDate: new Date("2026-07-01"), endDate: new Date("2026-07-03"), status: "Completed" } });

  console.log("10 Maintenance logs created.");

  // 8. Create Fuel Logs (15 logs)
  const fuelReceipts = [
    { vehicleId: v1.id, liters: 42, cost: 3150, date: new Date("2026-07-05") },
    { vehicleId: v2.id, liters: 120, cost: 9600, date: new Date("2026-07-08") },
    { vehicleId: v3.id, liters: 35, cost: 2800, date: new Date("2026-07-09") },
    { vehicleId: v5.id, liters: 150, cost: 12000, date: new Date("2026-06-02") },
    { vehicleId: v6.id, liters: 140, cost: 11200, date: new Date("2026-06-08") },
    { vehicleId: v7.id, liters: 50, cost: 4000, date: new Date("2026-06-15") },
    { vehicleId: v8.id, liters: 48, cost: 3840, date: new Date("2026-06-20") },
    { vehicleId: v10.id, liters: 38, cost: 3040, date: new Date("2026-06-28") },
    { vehicleId: v11.id, liters: 180, cost: 14400, date: new Date("2026-07-01") },
    { vehicleId: v12.id, liters: 165, cost: 13200, date: new Date("2026-07-02") },
    { vehicleId: v13.id, liters: 40, cost: 3200, date: new Date("2026-07-04") },
    { vehicleId: v14.id, liters: 45, cost: 3600, date: new Date("2026-07-06") },
    { vehicleId: v1.id, liters: 44, cost: 3300, date: new Date("2026-07-10") },
    { vehicleId: v2.id, liters: 115, cost: 9200, date: new Date("2026-07-11") },
    { vehicleId: v3.id, liters: 32, cost: 2560, date: new Date("2026-07-12") },
  ];

  for (const f of fuelReceipts) {
    await prisma.fuelLog.create({ data: f });
  }

  console.log("15 Fuel logs created.");

  // 9. Create Trips (18 trips)
  // Trips are distributed: 10 Completed, 3 On Trip/Transit, 2 Dispatched, 2 Draft, 1 Cancelled
  const t1 = await prisma.trip.create({ data: { source: "Gandhinagar Depot", destination: "Ahmedabad Hub", vehicleId: v1.id, driverId: d1.id, cargoWeight: 450, plannedDistance: 38, status: "On Trip", eta: "45 min", createdById: dispatcher.id } });
  const t2 = await prisma.trip.create({ data: { source: "Vatva Industrial", destination: "Sanand Warehouse", vehicleId: v2.id, driverId: d2.id, cargoWeight: 2500, plannedDistance: 45, status: "Completed", finalOdometer: 182100, fuelConsumed: 12, createdById: dispatcher.id } });
  const t3 = await prisma.trip.create({ data: { source: "Mansa", destination: "Kalol Depot", vehicleId: v3.id, driverId: d3.id, cargoWeight: 800, plannedDistance: 15, status: "On Trip", eta: "1h 10m", createdById: dispatcher.id } });
  const t4 = await prisma.trip.create({ data: { source: "Gandhinagar Depot", destination: "Surat Hub", vehicleId: null, driverId: null, cargoWeight: 0, plannedDistance: 280, status: "Draft", eta: "Awaiting vehicle", createdById: dispatcher.id } });
  
  const t5 = await prisma.trip.create({ data: { source: "Mehsana Hub", destination: "Palanpur Junction", vehicleId: v5.id, driverId: d5.id, cargoWeight: 4200, plannedDistance: 74, status: "Completed", finalOdometer: 104085, fuelConsumed: 22, createdById: dispatcher.id } });
  const t6 = await prisma.trip.create({ data: { source: "Ahmedabad Airport", destination: "Baroda Terminal", vehicleId: v6.id, driverId: d6.id, cargoWeight: 3100, plannedDistance: 110, status: "Completed", finalOdometer: 112115, fuelConsumed: 28, createdById: dispatcher.id } });
  const t7 = await prisma.trip.create({ data: { source: "Nadiad GIDC", destination: "Anand Food Park", vehicleId: v7.id, driverId: d7.id, cargoWeight: 520, plannedDistance: 22, status: "Completed", finalOdometer: 52024, fuelConsumed: 6, createdById: dispatcher.id } });
  const t8 = await prisma.trip.create({ data: { source: "Bharuch Chemical", destination: "Ankleshwar GIDC", vehicleId: v8.id, driverId: d8.id, cargoWeight: 610, plannedDistance: 16, status: "Completed", finalOdometer: 49018, fuelConsumed: 5, createdById: dispatcher.id } });
  const t9 = await prisma.trip.create({ data: { source: "Rajkot Yard", destination: "Morbi Ceramic Hub", vehicleId: v10.id, driverId: d10.id, cargoWeight: 1400, plannedDistance: 65, status: "Completed", finalOdometer: 93072, fuelConsumed: 14, createdById: dispatcher.id } });
  
  const t10 = await prisma.trip.create({ data: { source: "Gandhidham Cargo", destination: "Mundra Port", vehicleId: v11.id, driverId: d11.id, cargoWeight: 9800, plannedDistance: 72, status: "On Trip", eta: "2h 30m", createdById: dispatcher.id } });
  const t11 = await prisma.trip.create({ data: { source: "Jamnagar Refinery", destination: "Pipavav Port", vehicleId: v12.id, driverId: d12.id, cargoWeight: 8800, plannedDistance: 290, status: "Completed", finalOdometer: 154302, fuelConsumed: 82, createdById: dispatcher.id } });
  const t12 = await prisma.trip.create({ data: { source: "Bhavnagar Depot", destination: "Alang Port", vehicleId: v13.id, driverId: d13.id, cargoWeight: 1700, plannedDistance: 50, status: "Completed", finalOdometer: 32052, fuelConsumed: 11, createdById: dispatcher.id } });
  const t13 = await prisma.trip.create({ data: { source: "Kadi Cotton Ginnery", destination: "Kadi GIDC", vehicleId: v14.id, driverId: d14.id, cargoWeight: 750, plannedDistance: 12, status: "Completed", finalOdometer: 28014, fuelConsumed: 3, createdById: dispatcher.id } });
  
  const t14 = await prisma.trip.create({ data: { source: "Himmatnagar", destination: "Idar Depot", vehicleId: null, driverId: null, cargoWeight: 0, plannedDistance: 32, status: "Draft", eta: "Awaiting resources", createdById: dispatcher.id } });
  const t15 = await prisma.trip.create({ data: { source: "Godhra Junction", destination: "Dahod Warehouse", vehicleId: v13.id, driverId: d15.id, cargoWeight: 1200, plannedDistance: 75, status: "Dispatched", eta: "1h 45m", createdById: dispatcher.id } });
  const t16 = await prisma.trip.create({ data: { source: "Valsad GIDC", destination: "Vapi Chemical Zone", vehicleId: v5.id, driverId: d6.id, cargoWeight: 4900, plannedDistance: 30, status: "Completed", finalOdometer: 104120, fuelConsumed: 10, createdById: dispatcher.id } });
  const t17 = await prisma.trip.create({ data: { source: "Veraval Sea Food", destination: "Porbandar Terminal", vehicleId: v10.id, driverId: d12.id, cargoWeight: 1350, plannedDistance: 130, status: "Dispatched", eta: "3h 15m", createdById: dispatcher.id } });
  const t18 = await prisma.trip.create({ data: { source: "Junagadh Depot", destination: "Jetpur Textiles", vehicleId: v1.id, driverId: d9.id, cargoWeight: 400, plannedDistance: 35, status: "Cancelled", eta: "Cancelled due to fog", createdById: dispatcher.id } });

  console.log("18 Trips created.");

  // 10. Create Expenses (12 expense entries linked to trips)
  await prisma.expense.create({ data: { tripId: t1.id, toll: 120, other: 0, maintenanceLinked: 0, total: 120, date: new Date("2026-07-05") } });
  await prisma.expense.create({ data: { tripId: t2.id, toll: 340, other: 150, maintenanceLinked: 18000, total: 18490, date: new Date("2026-06-20") } });
  
  await prisma.expense.create({ data: { tripId: t5.id, toll: 220, other: 80, maintenanceLinked: 0, total: 300, date: new Date("2026-05-12") } });
  await prisma.expense.create({ data: { tripId: t6.id, toll: 580, other: 120, maintenanceLinked: 0, total: 700, date: new Date("2026-06-08") } });
  await prisma.expense.create({ data: { tripId: t7.id, toll: 110, other: 40, maintenanceLinked: 2500, total: 2650, date: new Date("2026-06-10") } });
  await prisma.expense.create({ data: { tripId: t8.id, toll: 80, other: 30, maintenanceLinked: 0, total: 110, date: new Date("2026-06-20") } });
  await prisma.expense.create({ data: { tripId: t9.id, toll: 290, other: 90, maintenanceLinked: 5800, total: 6180, date: new Date("2026-06-29") } });
  
  await prisma.expense.create({ data: { tripId: t11.id, toll: 850, other: 340, maintenanceLinked: 6800, total: 7990, date: new Date("2026-07-03") } });
  await prisma.expense.create({ data: { tripId: t12.id, toll: 190, other: 60, maintenanceLinked: 0, total: 250, date: new Date("2026-07-04") } });
  await prisma.expense.create({ data: { tripId: t13.id, toll: 50, other: 20, maintenanceLinked: 0, total: 70, date: new Date("2026-07-06") } });
  await prisma.expense.create({ data: { tripId: t16.id, toll: 140, other: 50, maintenanceLinked: 11000, total: 11190, date: new Date("2026-05-22") } });
  await prisma.expense.create({ data: { tripId: t3.id, toll: 90, other: 0, maintenanceLinked: 0, total: 90, date: new Date("2026-07-09") } });

  console.log("12 Expenses created.");
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
