/*
  Warnings:

  - Made the column `passwordHash` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "college" TEXT NOT NULL DEFAULT 'Bang College of Business',
ADD COLUMN     "kimepId" INTEGER,
ADD COLUMN     "major" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "yearOfStudy" INTEGER,
ALTER COLUMN "passwordHash" SET NOT NULL;

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Badge_userId_idx" ON "Badge"("userId");

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
