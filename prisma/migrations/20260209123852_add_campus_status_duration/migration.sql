-- CreateEnum
CREATE TYPE "CampusDuration" AS ENUM ('H2', 'H4', 'EOD');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "campusStatusDuration" "CampusDuration" NOT NULL DEFAULT 'H2';
