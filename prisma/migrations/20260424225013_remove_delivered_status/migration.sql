-- Convert any existing DELIVERED records to SENT
UPDATE "NotificationLog" SET status = 'SENT' WHERE status = 'DELIVERED';

-- Drop the old enum type and its dependent column, recreating with new enum
DROP TYPE IF EXISTS "NotificationStatus" CASCADE;

-- Create new enum without DELIVERED
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- Recreate the NotificationLog column with the new type
ALTER TABLE "NotificationLog" ADD COLUMN "status_new" "NotificationStatus" NOT NULL DEFAULT 'QUEUED';
UPDATE "NotificationLog" SET "status_new" = status::"NotificationStatus";
ALTER TABLE "NotificationLog" DROP COLUMN "status";
ALTER TABLE "NotificationLog" RENAME COLUMN "status_new" TO "status";

