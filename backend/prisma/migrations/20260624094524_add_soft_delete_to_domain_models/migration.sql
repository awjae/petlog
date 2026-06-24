-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "medical_events" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "medications" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vaccinations" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "appointments_pet_id_deleted_at_idx" ON "appointments"("pet_id", "deleted_at");

-- CreateIndex
CREATE INDEX "medical_events_pet_id_deleted_at_idx" ON "medical_events"("pet_id", "deleted_at");

-- CreateIndex
CREATE INDEX "medications_pet_id_deleted_at_idx" ON "medications"("pet_id", "deleted_at");

-- CreateIndex
CREATE INDEX "vaccinations_pet_id_deleted_at_idx" ON "vaccinations"("pet_id", "deleted_at");
