/*
  Warnings:

  - You are about to drop the column `college` on the `Post` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PostCategory" AS ENUM ('GOSSIPS', 'UNI', 'CONFESSIONS', 'MARKET', 'OTHER');

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "college",
ADD COLUMN     "category" "PostCategory" NOT NULL DEFAULT 'OTHER';

-- CreateIndex
CREATE INDEX "Post_category_createdAt_idx" ON "Post"("category", "createdAt");

-- CreateIndex
CREATE INDEX "Post_authorId_createdAt_idx" ON "Post"("authorId", "createdAt");
