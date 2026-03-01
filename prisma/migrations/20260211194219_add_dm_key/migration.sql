/*
  Warnings:

  - A unique constraint covering the columns `[dmKey]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "dmKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_dmKey_key" ON "Conversation"("dmKey");
