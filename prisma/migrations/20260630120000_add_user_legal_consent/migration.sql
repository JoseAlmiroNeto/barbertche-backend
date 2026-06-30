-- Add legal consent metadata to users.
-- IF NOT EXISTS keeps this migration safe in databases already updated with prisma db push.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsVersion" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "privacyVersion" TEXT;