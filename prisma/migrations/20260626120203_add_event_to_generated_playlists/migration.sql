/*
  Warnings:

  - You are about to drop the column `inngest_event_id` on the `generated_playlists` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "generated_playlists" DROP COLUMN "inngest_event_id",
ADD COLUMN     "event" JSONB,
ALTER COLUMN "inngest_run_id" DROP NOT NULL;
