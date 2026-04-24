-- Convert any existing DELIVERED records to SENT
UPDATE "NotificationLog" SET status = 'SENT' WHERE status = 'DELIVERED';

-- Drop the old enum type
DROP TYPE IF EXISTS "NotificationStatus";

-- Create new enum without DELIVERED
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- Update the NotificationLog table to use the new type
ALTER TABLE "NotificationLog" ALTER COLUMN status TYPE "NotificationStatus" USING status::"NotificationStatus";
