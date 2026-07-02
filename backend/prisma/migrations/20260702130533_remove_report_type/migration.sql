-- DropIndex
DROP INDEX "reports_pet_id_type_created_at_idx";

-- AlterTable
ALTER TABLE "reports" DROP COLUMN "type";
ALTER TABLE "reports" ADD CONSTRAINT "reports_period_valid" CHECK ("period_end" >= "period_start");

-- DropEnum
DROP TYPE "ReportType";
