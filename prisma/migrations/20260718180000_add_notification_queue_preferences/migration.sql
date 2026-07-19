CREATE TYPE "NotificationCategory" AS ENUM ('REMINDER', 'APPOINTMENT_CHANGES', 'PROMOTIONS');
CREATE TYPE "NotificationJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');
CREATE TYPE "NotificationReceiptStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED');

CREATE TABLE "NotificationPreference" (
  "userId" TEXT NOT NULL,
  "reminders" BOOLEAN NOT NULL DEFAULT true,
  "appointmentChanges" BOOLEAN NOT NULL DEFAULT true,
  "promotions" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "NotificationJob" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "category" "NotificationCategory" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "data" JSONB,
  "status" "NotificationJobStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "lastError" TEXT,
  "idempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationReceipt" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "receiptId" TEXT NOT NULL,
  "status" "NotificationReceiptStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checkedAt" TIMESTAMP(3),
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationJob_idempotencyKey_key" ON "NotificationJob"("idempotencyKey");
CREATE INDEX "NotificationJob_status_availableAt_idx" ON "NotificationJob"("status", "availableAt");
CREATE INDEX "NotificationJob_userId_category_idx" ON "NotificationJob"("userId", "category");
CREATE UNIQUE INDEX "NotificationReceipt_receiptId_key" ON "NotificationReceipt"("receiptId");
CREATE INDEX "NotificationReceipt_status_availableAt_idx" ON "NotificationReceipt"("status", "availableAt");
CREATE INDEX "NotificationReceipt_jobId_idx" ON "NotificationReceipt"("jobId");

ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationJob" ADD CONSTRAINT "NotificationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationReceipt" ADD CONSTRAINT "NotificationReceipt_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "NotificationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
