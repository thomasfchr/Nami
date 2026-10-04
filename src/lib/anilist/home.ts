import "server-only";
import { after } from "next/server";
import { anilistFetch } from "./client";
import {
  SEASON_POPULAR_QUERY,
  CLASSICS_QUERY,
  POPULAR_QUERY,
  AIRING_THIS_WEEK_QUERY,
  POPULAR_RELEASING_IDS_QUERY,
  AIRING_BY_MEDIA_QUERY,
} from "./queries";
import { upsertMediaFromAniList } from "./mapper";
import { toCardData, type MediaCardData } from "./cache";
import type { AniListAiringScheduleEntry, AniListMedia, AniListMediaType } from "./types";

function warmCache(mediaList: AniListMedia[]) {
  after(async () => {
    await Promise.all(mediaList.map((media) => upsertMediaFromAniList(media).catch(() => null)));
  });
}

function getCurrentAniListSeason(date = new Date()) {
  const month = date.getMonth(); // 0-11
  const seasonYear = date.getFullYear();
  if (month <= 1 || month === 11) return { season: "WINTER", seasonYear } as const;
  if (month <= 4) return { season: "SPRING", seasonYear } as const;
  if (month <= 7) return { season: "SUMMER", seasonYear } as const;
  return { season: "FALL", seasonYear } as const;
}

/** Anime les plus populaires de la saison AniList en cours. */
export async function getSeasonPopular(perPage = 18): Promise<MediaCardData[]> {
  const { season, seasonYear } = getCurrentAniListSeason();
  const data = await anilistFetch<{ Page: { media: AniListMedia[] } }>(SEASON_POPULAR_QUERY, {
    season,
    seasonYear,
    perPage,
  });
  warmCache(data.Page.media);
  return data.Page.media.map(toCardData);
}

/** Les plus populaires dans l'absolu (utilisé pour le manga, sans notion de saison). */
export async function getPopular(type: AniListMediaType, perPage = 18): Promise<MediaCardData[]> {
  const data = await anilistFetch<{ Page: { media: AniListMedia[] } }>(POPULAR_QUERY, {
    type,
    perPage,
  });
  warmCache(data.Page.media);
  return data.Page.media.map(toCardData);
}

/** Classiques : séries terminées avant 2000, les mieux notées. */
export async function getClassics(type: AniListMediaType, perPage = 18): Promise<MediaCardData[]> {
  const data = await anilistFetch<{ Page: { media: AniListMedia[] } }>(CLASSICS_QUERY, {
    type,
    perPage,
  });
  warmCache(data.Page.media);
  return data.Page.media.map(toCardData);
}

export type AiringThisWeekItem = MediaCardData & { episode: number; airingAt: number };

/** Épisodes diffusés entre maintenant et dans 7 jours, triés par date (anime uniquement). */
export async function getAiringThisWeek(perPage = 30): Promise<AiringThisWeekItem[]> {
  const now = Math.floor(Date.now() / 1000);
  const end = now + 7 * 24 * 60 * 60;

  const data = await anilistFetch<{ Page: { airingSchedules: AniListAiringScheduleEntry[] } }>(
    AIRING_THIS_WEEK_QUERY,
    { start: now, end, perPage },
  );

  const seen = new Set<number>();
  const entries: AiringThisWeekItem[] = [];

  for (const schedule of data.Page.airingSchedules) {
    if (seen.has(schedule.media.id)) continue;
    seen.add(schedule.media.id);
    entries.push({
      ...toCardData(schedule.media),
      episode: schedule.episode,
      airingAt: schedule.airingAt,
    });
  }

  warmCache(data.Page.airingSchedules.map((s) => s.media));

  return entries;
}

const CALENDAR_SHOW_PAGES = 3;
const CALENDAR_SCHEDULE_PAGES = 10;

/**
 * Épisodes diffusés dans une fenêtre de temps (calendrier), triés par date.
 * AniList renvoie au plus 50 émissions par page, sans filtre de popularité :
 * on part donc des séries populaires en cours, puis on parcourt leurs émissions.
 */
const POPULAR_IDS_TTL_MS = 60 * 60 * 1000;
let popularIdsCache: { at: number; ids: number[] } | null = null;

async function getPopularReleasingIds(): Promise<number[]> {
  if (popularIdsCache && Date.now() - popularIdsCache.at < POPULAR_IDS_TTL_MS) {
    return popularIdsCache.ids;
  }
  const ids: number[] = [];
  for (let page = 1; page <= CALENDAR_SHOW_PAGES; page++) {
    const data = await anilistFetch<{ Page: { media: { id: number }[] } }>(
      POPULAR_RELEASING_IDS_QUERY,
      { page, perPage: 50 },
    );
    ids.push(...data.Page.media.map((media) => media.id));
  }
  popularIdsCache = { at: Date.now(), ids };
  return ids;
}

async function getSchedulesForIds(
  ids: number[],
  startUnixSeconds: number,
  endUnixSeconds: number,
): Promise<AniListAiringScheduleEntry[]> {
  const schedules: AniListAiringScheduleEntry[] = [];
  for (let page = 1; page <= CALENDAR_SCHEDULE_PAGES; page++) {
    const data = await anilistFetch<{
      Page: { pageInfo: { hasNextPage: boolean }; airingSchedules: AniListAiringScheduleEntry[] };
    }>(AIRING_BY_MEDIA_QUERY, {
      ids,
      start: startUnixSeconds,
      end: endUnixSeconds,
      page,
      perPage: 50,
    });
    schedules.push(...data.Page.airingSchedules);
    if (!data.Page.pageInfo.hasNextPage) break;
  }
  return schedules;
}

/** Épisodes diffusés dans une fenêtre de temps (calendrier), triés par date. */
export async function getAiringInRange(
  startUnixSeconds: number,
  endUnixSeconds: number,
): Promise<AiringThisWeekItem[]> {
  const ids = await getPopularReleasingIds();
  const schedules = await getSchedulesForIds(ids, startUnixSeconds, endUnixSeconds);
  warmCache(schedules.map((s) => s.media));
  return schedules.map((schedule) => ({
    ...toCardData(schedule.media),
    episode: schedule.episode,
    airingAt: schedule.airingAt,
  }));
}

/** Identifiants des séries ayant diffusé un épisode dans les dernières 48 h (badge « Nouvel épisode »). */
export async function getRecentlyAiredIds(): Promise<Set<number>> {
  const now = Math.floor(Date.now() / 1000);
  const ids = await getPopularReleasingIds();
  const schedules = await getSchedulesForIds(ids, now - 48 * 60 * 60, now);
  return new Set(schedules.map((s) => s.media.id));
}
