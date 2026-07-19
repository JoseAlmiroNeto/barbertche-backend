DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AppointmentStatus') THEN
    CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELED', 'NO_SHOW');
  END IF;
END
$$;

ALTER TABLE "Appointment"
  ADD COLUMN IF NOT EXISTS "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
  ADD COLUMN IF NOT EXISTS "canceledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;

CREATE INDEX IF NOT EXISTS "Appointment_date_status_start_idx"
  ON "Appointment"("date", "status", "start");
