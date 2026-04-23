ALTER TABLE "Post" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE TABLE "PostReport" (
  "id"        TEXT NOT NULL,
  "postId"    TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PostReport_postId_userId_key" ON "PostReport"("postId", "userId");
CREATE INDEX "PostReport_postId_idx" ON "PostReport"("postId");

ALTER TABLE "PostReport"
  ADD CONSTRAINT "PostReport_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PostReport"
  ADD CONSTRAINT "PostReport_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
