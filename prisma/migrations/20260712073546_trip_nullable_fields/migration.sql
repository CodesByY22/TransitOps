-- DropForeignKey
ALTER TABLE "trips" DROP CONSTRAINT "trips_driver_id_fkey";

-- DropForeignKey
ALTER TABLE "trips" DROP CONSTRAINT "trips_vehicle_id_fkey";

-- AlterTable
ALTER TABLE "trips" ALTER COLUMN "vehicle_id" DROP NOT NULL,
ALTER COLUMN "driver_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
