-- AlterTable
ALTER TABLE "Song" ADD COLUMN     "themes" TEXT[],
ADD COLUMN     "themesClassified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "themesRaw" JSONB;

-- CreateIndex
CREATE INDEX "Song_themes_idx" ON "Song" USING GIN ("themes");
