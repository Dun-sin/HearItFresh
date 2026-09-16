-- AlterTable
ALTER TABLE "generated_playlists" ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'spotify';

-- CreateTable
CREATE TABLE "youtube_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "scope" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "youtube_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "youtube_connections_user_id_key" ON "youtube_connections"("user_id");

-- AddForeignKey
ALTER TABLE "youtube_connections" ADD CONSTRAINT "youtube_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
