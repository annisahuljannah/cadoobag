-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "proofImageUrl" TEXT;
ALTER TABLE "Payment" ADD COLUMN "rejectedAt" DATETIME;
ALTER TABLE "Payment" ADD COLUMN "rejectionNote" TEXT;
ALTER TABLE "Payment" ADD COLUMN "verifiedAt" DATETIME;
ALTER TABLE "Payment" ADD COLUMN "verifiedBy" TEXT;
