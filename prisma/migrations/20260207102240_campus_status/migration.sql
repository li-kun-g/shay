-- CreateEnum
CREATE TYPE "CampusStatus" AS ENUM ('ON', 'OFF');

-- CreateEnum
CREATE TYPE "CampusVisibility" AS ENUM ('ONLY_ME', 'FRIENDS', 'EVERYONE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "campusStatus" "CampusStatus",
ADD COLUMN     "campusStatusExpiresAt" TIMESTAMP(3),
ADD COLUMN     "campusStatusUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "campusStatusVisibility" "CampusVisibility" NOT NULL DEFAULT 'FRIENDS';
