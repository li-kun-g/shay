-- CreateEnum
CREATE TYPE "PostReactionType" AS ENUM ('LAUGH', 'SKULL');

-- CreateTable
CREATE TABLE "PostReaction" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "PostReactionType" NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PostReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostReaction_postId_idx" ON "PostReaction"("postId");

-- CreateIndex
CREATE INDEX "PostReaction_userId_idx" ON "PostReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PostReaction_postId_userId_type_key" ON "PostReaction"("postId", "userId", "type");

-- AddForeignKey
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
