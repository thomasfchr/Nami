import "server-only";
import { prisma } from "@/lib/prisma";

export const RATING_STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;

export type ProfileStats = {
  seriesTotal: number;
  seriesCompleted: number;
  episodesWatched: number;
  chaptersRead: number;
  hoursWatched: number;
  averageRating: number | null;
  ratingCount: number;
  histogram: { value: number; count: number }[];
  topGenres: { genre: string; count: number }[];
};

const TOP_GENRES_LIMIT = 8;

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const entries = await prisma.listEntry.findMany({
    where: { userId },
    include: { media: { select: { type: true, genres: true, duration: true } } },
  });

  let episodesWatched = 0;
  let chaptersRead = 0;
  let minutesWatched = 0;
  let seriesCompleted = 0;

  const ratings: number[] = [];
  const genreCounts = new Map<string, number>();

  for (const entry of entries) {
    if (entry.status === "COMPLETED") seriesCompleted++;

    if (entry.media.type === "ANIME") {
      episodesWatched += entry.progress;
      if (entry.media.duration) minutesWatched += entry.progress * entry.media.duration;
    } else {
      chaptersRead += entry.progress;
    }

    if (entry.rating != null) ratings.push(Number(entry.rating));

    for (const genre of entry.media.genres) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    }
  }

  const averageRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10
      : null;

  const histogram = RATING_STEPS.map((value) => ({
    value,
    count: ratings.filter((r) => r === value).length,
  }));

  const topGenres = Array.from(genreCounts.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre))
    .slice(0, TOP_GENRES_LIMIT);

  return {
    seriesTotal: entries.length,
    seriesCompleted,
    episodesWatched,
    chaptersRead,
    hoursWatched: Math.round((minutesWatched / 60) * 10) / 10,
    averageRating,
    ratingCount: ratings.length,
    histogram,
    topGenres,
  };
}
