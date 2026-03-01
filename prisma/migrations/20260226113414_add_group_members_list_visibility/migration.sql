-- CreateEnum
CREATE TYPE "MembersListVisibility" AS ENUM ('EVERYONE', 'MEMBERS_ONLY');

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "membersListVisibility" "MembersListVisibility" NOT NULL DEFAULT 'EVERYONE';
