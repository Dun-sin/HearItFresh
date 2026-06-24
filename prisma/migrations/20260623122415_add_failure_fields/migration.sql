-- AlterTable
ALTER TABLE "generated_playlists" ADD COLUMN     "error_message" TEXT,
ADD COLUMN     "retry_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "seeds" JSONB,
ALTER COLUMN "playlist_name" DROP NOT NULL,
ALTER COLUMN "playlist_link" DROP NOT NULL,
ALTER COLUMN "playlist_id" DROP NOT NULL,
ALTER COLUMN "inngest_event_id" DROP NOT NULL;
