import "server-only";
import { after } from "next/server";
import { anilistFetchCached } from "./client";
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

const WARM_TTL_MS = 6 * 60 * 60 * 1000;
const warmedAt = new Map<number, number>();

/**
 * Enregistre en base les séries vues dans les rangées, au plus une fois toutes
 * les 6 h par série et par instance : chaque écriture coûte plusieurs allers-retours
 * vers Postgres, et les refaire à chaque page saturait la connexion.
 */
function warmCache(mediaList: AniListMedia[]) {
  const now = Date.now();
  const toWarm = new Map<number, AniListMedia>();
  for (const media of mediaList) {
    if (now - (warmedAt.get(media.id) ?? 0) < WARM_TTL_MS) continue;
    toWarm.set(media.id, media);
    warmedAt.set(media.id, now);
  }
  if (!toWarm.size) return;
  after(async () => {
    for (const media of toWarm.values()) {
      await upsertMediaFromAniList(media).catch(() => warmedAt.delete(media.id));
    }
  });
}

const MINUTE = 60;
const HOUR = 60 * MINUTE;

/** Arrondit un horodatage (secondes) à la tranche inférieure, pour stabiliser les clés de cache. */
function floorTo(unixSeconds: number, step: number) {
  return Math.floor(unixSeconds / step) * step;
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
  const data = await anilistFetchCached<{ Page: { media: AniListMedia[] } }>(
    SEASON_POPULAR_QUERY,
    { season, seasonYear, perPage },
    6 * HOUR,
  );
  warmCache(data.Page.media);
  return data.Page.media.map(toCardData);
}

/** Les plus populaires dans l'absolu (utilisé pour le manga, sans notion de saison). */
export async function getPopular(type: AniListMediaType, perPage = 18): Promise<MediaCardData[]> {
  const data = await anilistFetchCached<{ Page: { media: AniListMedia[] } }>(
    POPULAR_QUERY,
    { type, perPage },
    6 * HOUR,
  );
  warmCache(data.Page.media);
  return data.Page.media.map(toCardData);
}

/** Classiques : séries terminées avant 2000, les mieux notées. */
export async function getClassics(type: AniListMediaType, perPage = 18): Promise<MediaCardData[]> {
  const data = await anilistFetchCached<{ Page: { media: AniListMedia[] } }>(
    CLASSICS_QUERY,
    { type, perPage },
    24 * HOUR,
  );
  warmCache(data.Page.media);
  return data.Page.media.map(toCardData);
}

export type AiringThisWeekItem = MediaCardData & { episode: number; airingAt: number };

/** Épisodes diffusés entre maintenant et dans 7 jours, triés par date (anime uniquement). */
export async function getAiringThisWeek(perPage = 30): Promise<AiringThisWeekItem[]> {
  const start = floorTo(Math.floor(Date.now() / 1000), 10 * MINUTE);
  const end = start + 7 * 24 * HOUR;

  const data = await anilistFetchCached<{
    Page: { airingSchedules: AniListAiringScheduleEntry[] };
  }>(AIRING_THIS_WEEK_QUERY, { start, end, perPage }, 10 * MINUTE);

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
async function getPopularReleasingIds(): Promise<number[]> {
  const ids: number[] = [];
  for (let page = 1; page <= CALENDAR_SHOW_PAGES; page++) {
    const data = await anilistFetchCached<{ Page: { media: { id: number }[] } }>(
      POPULAR_RELEASING_IDS_QUERY,
      { page, perPage: 50 },
      HOUR,
    );
    ids.push(...data.Page.media.map((media) => media.id));
  }
  return ids;
}

async function getSchedulesForIds(
  ids: number[],
  startUnixSeconds: number,
  endUnixSeconds: number,
): Promise<AniListAiringScheduleEntry[]> {
  const schedules: AniListAiringScheduleEntry[] = [];
  for (let page = 1; page <= CALENDAR_SCHEDULE_PAGES; page++) {
    const data = await anilistFetchCached<{
      Page: { pageInfo: { hasNextPage: boolean }; airingSchedules: AniListAiringScheduleEntry[] };
    }>(
      AIRING_BY_MEDIA_QUERY,
      { ids, start: startUnixSeconds, end: endUnixSeconds, page, perPage: 50 },
      10 * MINUTE,
    );
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

/**
 * Séries populaires ayant diffusé un épisode dans les dernières 48 h :
 * leurs identifiants (badge « Nouvel épisode ») et la sortie la plus récente (héros d'accueil).
 */
export async function getRecentlyAired(): Promise<{
  ids: Set<number>;
  latest: AiringThisWeekItem | null;
}> {
  const now = floorTo(Math.floor(Date.now() / 1000), 10 * MINUTE);
  const ids = await getPopularReleasingIds();
  const schedules = await getSchedulesForIds(ids, now - 48 * HOUR, now);
  // Triées par date croissante : la dernière émission avec une bannière est la
  // sortie la plus récente affichable en héros.
  const last = schedules.findLast((s) => s.media.bannerImage);
  return {
    ids: new Set(schedules.map((s) => s.media.id)),
    latest: last
      ? { ...toCardData(last.media), episode: last.episode, airingAt: last.airingAt }
      : null,
  };
}
