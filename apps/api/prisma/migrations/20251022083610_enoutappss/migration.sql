-- AlterEnum
ALTER TYPE "user_roles" ADD VALUE 'USER';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "mobile_messages" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'sent';
