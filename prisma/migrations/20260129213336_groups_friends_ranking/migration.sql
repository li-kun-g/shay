/*
  Warnings:

  - The values [OWNER] on the enum `GroupRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `ownerId` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `visibility` on the `Group` table. All the data in the column will be lost.
  - Added the required column `presidentId` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "GroupJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "GroupRole_new" AS ENUM ('PRESIDENT', 'ADMIN', 'MEMBER');
ALTER TABLE "public"."GroupMember" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "GroupMember" ALTER COLUMN "role" TYPE "GroupRole_new" USING ("role"::text::"GroupRole_new");
ALTER TYPE "GroupRole" RENAME TO "GroupRole_old";
ALTER TYPE "GroupRole_new" RENAME TO "GroupRole";
DROP TYPE "public"."GroupRole_old";
ALTER TABLE "GroupMember" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
COMMIT;

-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_ownerId_fkey";

-- AlterTable
ALTER TABLE "Group" DROP COLUMN "ownerId",
DROP COLUMN "visibility",
ADD COLUMN     "presidentId" TEXT NOT NULL,
ADD COLUMN     "status" "GroupStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "GroupMember" ADD COLUMN     "position" TEXT,
ADD COLUMN     "showPosition" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "GroupFollow" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "GroupFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupJoinRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "GroupJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT,

    CONSTRAINT "GroupJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupCreateRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "requestedById" TEXT NOT NULL,
    "status" "GroupStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,

    CONSTRAINT "GroupCreateRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupFollow_userId_idx" ON "GroupFollow"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupFollow_groupId_userId_key" ON "GroupFollow"("groupId", "userId");

-- CreateIndex
CREATE INDEX "GroupJoinRequest_groupId_status_idx" ON "GroupJoinRequest"("groupId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GroupJoinRequest_groupId_userId_key" ON "GroupJoinRequest"("groupId", "userId");

-- CreateIndex
CREATE INDEX "GroupCreateRequest_status_idx" ON "GroupCreateRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GroupCreateRequest_slug_key" ON "GroupCreateRequest"("slug");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_presidentId_fkey" FOREIGN KEY ("presidentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupFollow" ADD CONSTRAINT "GroupFollow_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupFollow" ADD CONSTRAINT "GroupFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupJoinRequest" ADD CONSTRAINT "GroupJoinRequest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupJoinRequest" ADD CONSTRAINT "GroupJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupCreateRequest" ADD CONSTRAINT "GroupCreateRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
