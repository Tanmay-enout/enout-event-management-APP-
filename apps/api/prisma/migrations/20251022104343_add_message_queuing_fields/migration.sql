-- AlterTable
ALTER TABLE "mobile_messages" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "deliveryStatus" TEXT NOT NULL DEFAULT 'delivered',
ADD COLUMN     "inviteId" TEXT;

-- CreateIndex
CREATE INDEX "mobile_messages_inviteId_idx" ON "mobile_messages"("inviteId");

-- CreateIndex
CREATE INDEX "mobile_messages_deliveryStatus_idx" ON "mobile_messages"("deliveryStatus");

-- AddForeignKey
ALTER TABLE "mobile_messages" ADD CONSTRAINT "mobile_messages_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "invites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
