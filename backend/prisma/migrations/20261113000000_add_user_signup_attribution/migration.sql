-- AlterTable
ALTER TABLE "users" ADD COLUMN     "signup_landing_path" TEXT,
ADD COLUMN     "signup_referrer" TEXT,
ADD COLUMN     "signup_utm_source" TEXT;
