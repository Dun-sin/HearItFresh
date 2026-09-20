/*
  Warnings:

  - You are about to drop the column `themesClassified` on the `Song` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Song" DROP COLUMN "themesClassified",
ADD COLUMN     "themesDeriveVersion" INTEGER,
ADD COLUMN     "themesQuestionVersions" JSONB;
