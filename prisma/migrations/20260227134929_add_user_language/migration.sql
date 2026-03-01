-- CreateEnum
CREATE TYPE "AppLanguage" AS ENUM ('EN', 'RU', 'KK');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "language" "AppLanguage" NOT NULL DEFAULT 'EN';
