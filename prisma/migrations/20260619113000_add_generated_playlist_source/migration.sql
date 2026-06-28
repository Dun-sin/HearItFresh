-- AlterTable
ALTER TABLE "public"."generated_playlists" ADD COLUMN "source_playlist_id" TEXT;

-- CreateIndex
CREATE INDEX "generated_playlists_user_id_source_playlist_id_idx" ON "public"."generated_playlists"("user_id", "source_playlist_id");
