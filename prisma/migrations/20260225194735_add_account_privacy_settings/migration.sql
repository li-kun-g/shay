-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('EVERYONE', 'FRIENDS_ONLY');

-- CreateEnum
CREATE TYPE "DmPrivacy" AS ENUM ('EVERYONE', 'FRIENDS_ONLY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dmPrivacy" "DmPrivacy" NOT NULL DEFAULT 'EVERYONE',
ADD COLUMN     "friendsListVisibility" "ProfileVisibility" NOT NULL DEFAULT 'EVERYONE',
ADD COLUMN     "groupsVisibility" "ProfileVisibility" NOT NULL DEFAULT 'EVERYONE';
