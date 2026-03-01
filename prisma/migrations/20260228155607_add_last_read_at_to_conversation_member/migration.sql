-- AlterTable
ALTER TABLE "ConversationMember" ADD COLUMN     "lastReadAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ConversationMember_userId_idx" ON "ConversationMember"("userId");

-- CreateIndex
CREATE INDEX "ConversationMember_conversationId_idx" ON "ConversationMember"("conversationId");
