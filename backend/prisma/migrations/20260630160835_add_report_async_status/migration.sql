/*
  Warnings:

  - Added the required column `updated_at` to the `reports` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- DropIndex
DROP INDEX "reports_pet_id_type_period_start_period_end_key";

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "failed_reason" TEXT,
ADD COLUMN     "status" "ReportStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "overview" DROP NOT NULL,
ALTER COLUMN "highlights" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "concerns" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "recommendations" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "generated_by" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "reports_pet_id_type_created_at_idx" ON "reports"("pet_id", "type", "created_at" DESC);
