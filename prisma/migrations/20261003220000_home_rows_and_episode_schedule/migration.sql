-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "episodeSchedule" JSONB,
ADD COLUMN     "lastAiringAt" TIMESTAMP(3),
ADD COLUMN     "lastAiringEpisode" INTEGER;
