-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "groupId" TEXT;

-- CreateIndex
CREATE INDEX "Event_groupId_startsAt_idx" ON "Event"("groupId", "startsAt");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
