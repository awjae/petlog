-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "is_neutered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profile_image_url" TEXT;
