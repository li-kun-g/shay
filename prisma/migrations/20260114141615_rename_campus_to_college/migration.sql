/*
  Warnings:

  - You are about to drop the column `campus` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "campus",
ADD COLUMN     "college" TEXT NOT NULL DEFAULT 'Bang College of Business';
