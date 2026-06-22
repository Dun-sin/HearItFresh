-- CreateTable
CREATE TABLE "public"."generated_playlists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "playlist_name" TEXT NOT NULL,
    "playlist_link" TEXT NOT NULL,
    "playlist_id" TEXT NOT NULL,
    "inngest_run_id" TEXT NOT NULL,
    "inngest_event_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "generated_playlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generated_playlists_user_id_idx" ON "public"."generated_playlists"("user_id");

-- AddForeignKey
ALTER TABLE "public"."generated_playlists" ADD CONSTRAINT "generated_playlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
