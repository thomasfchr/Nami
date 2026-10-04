import "server-only";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { anilistFetch } from "./client";
import { SEARCH_MEDIA_QUERY, MEDIA_BY_ID_QUERY } from "./queries";
import { upsertMediaFromAniList } from "./mapper";
import { isLikelyFreeSite } from "./free-sites";
import type { AniListMedia, AniListMediaType } from "./types";
import type { Media, StreamingLink } from "@prisma/client";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const AIRING_CACHE_TTL_MS = 15 * 60 * 1000;
const NEW_EPISODE_WINDOW_MS = 48 * 60 * 60 * 1000;

export type MediaCardData = {
  anilistId: number;
  type: AniListMediaType;
  title: string;
  titleNative: string | null;
  synopsis: string | null;
  coverUrl: string | null;
  bannerUrl: string | null;
  color: string | null;
  year: number | null;
  format: string | null;
  episodes: number | null;
  chapters: number | null;
  status: string | null;
  nextAiringAt: number | null;
  nextEpisode: number | null;
  isNewEpisode: boolean;
  isFreeAnywhere: boolean;
  streamingLinks: { site: string; url: string; isFree: boolean }[];
};

export type MediaSearchResult = MediaCardData;

export function toCardData(media: AniListMedia): MediaCardData {
  const now = Date.now();
  const scheduleNodes = media.episodeSchedule?.nodes ?? [];
  const lastAiringAt = scheduleNodes
    .map((node) => node.airingAt * 1000)
    .filter((ms) => ms <= now)
    .sort((a, b) => b - a)[0];
  const isNewEpisode = lastAiringAt ? now - lastAiringAt < NEW_EPISODE_WINDOW_MS : false;
  const links = (media.externalLinks ?? []).filter((link) => link.url && !link.isDisabled);
  const isFreeAnywhere = links.some((link) => isLikelyFreeSite(link.site));
  // AniList ne remplit pas toujours nextAiringEpisode pour les séries tout
  // juste lancées : on retombe sur le planning d'épisodes si besoin.
  const nextAiringFallback = scheduleNodes
    .filter((node) => node.airingAt * 1000 > now)
    .sort((a, b) => a.airingAt - b.airingAt)[0];
  const nextAiring = media.nextAiringEpisode ?? nextAiringFallback ?? null;

  return {
    anilistId: media.id,
    type: media.type === "MANGA" ? "MANGA" : "ANIME",
    title: media.title.romaji ?? media.title.english ?? media.title.native ?? "Sans titre",
    titleNative: media.title.native,
    synopsis: media.description,
    coverUrl: media.coverImage?.large ?? null,
    bannerUrl: media.bannerImage,
    color: media.coverImage?.color ?? null,
    year: media.seasonYear,
    format: media.format,
    episodes: media.episodes,
    chapters: media.chapters,
    status: media.status,
    nextAiringAt: nextAiring?.airingAt ?? null,
    nextEpisode: nextAiring?.episode ?? null,
    isNewEpisode,
    isFreeAnywhere,
    streamingLinks: links.map((link) => ({
      site: link.site,
      url: link.url,
      isFree: isLikelyFreeSite(link.site),
    })),
  };
}

/** Convertit une ligne Media déjà en base (ex: issue de ListEntry) en carte d'affichage. */
export function toCardDataFromPrismaMedia(
  media: Media & { streamingLinks?: StreamingLink[] },
): MediaCardData {
  const isNewEpisode = media.lastAiringAt
    ? Date.now() - media.lastAiringAt.getTime() < NEW_EPISODE_WINDOW_MS
    : false;

  return {
    anilistId: media.anilistId,
    type: media.type,
    title: media.titleRomaji,
    titleNative: media.titleNative,
    synopsis: media.synopsis,
    coverUrl: media.coverUrl,
    bannerUrl: media.bannerUrl,
    color: media.color,
    year: media.seasonYear,
    format: null,
    episodes: media.episodes,
    chapters: media.chapters,
    status: media.status,
    nextAiringAt: media.nextAiringAt ? Math.floor(media.nextAiringAt.getTime() / 1000) : null,
    nextEpisode: media.nextEpisode,
    isNewEpisode,
    isFreeAnywhere: media.streamingLinks?.some((link) => link.isFree) ?? false,
    streamingLinks: (media.streamingLinks ?? []).map((link) => ({
      site: link.site,
      url: link.url,
      isFree: link.isFree,
    })),
  };
}

/** Recherche en direct sur AniList (le cache local ne peut pas servir une recherche texte). */
export async function searchAniList(
  search: string,
  type: AniListMediaType,
): Promise<MediaCardData[]> {
  const data = await anilistFetch<{ Page: { media: AniListMedia[] } }>(SEARCH_MEDIA_QUERY, {
    search,
    type,
    perPage: 12,
  });

  const results = data.Page.media;

  // Réchauffe le cache local sans bloquer la réponse de recherche.
  after(async () => {
    await Promise.all(results.map((media) => upsertMediaFromAniList(media).catch(() => null)));
  });

  return results.map(toCardData);
}

/**
 * Lecture cache-first pour la fiche détaillée : ne retourne à AniList que si
 * l'entrée est absente, périmée (24 h, 15 min pour une série en cours), ou n'a encore jamais reçu le planning
 * d'épisodes (c-à-d qu'elle n'a été vue que via une recherche/rangée jusqu'ici).
 */
export async function getMediaByAnilistId(anilistId: number) {
  const cached = await prisma.media.findUnique({
    where: { anilistId },
    include: { streamingLinks: true },
  });

  const now = Date.now();
  const ttl = cached?.status === "RELEASING" ? AIRING_CACHE_TTL_MS : CACHE_TTL_MS;
  const isFresh = cached ? now - cached.updatedAt.getTime() < ttl : false;
  const nextAiringPassed = cached?.nextAiringAt ? cached.nextAiringAt.getTime() < now : false;
  const hasDetail = cached ? cached.episodeSchedule !== null : false;
  if (cached && isFresh && !nextAiringPassed && hasDetail) return cached;

  try {
    const data = await anilistFetch<{ Media: AniListMedia | null }>(MEDIA_BY_ID_QUERY, {
      id: anilistId,
    });
    if (!data.Media) return cached;

    const saved = await upsertMediaFromAniList(data.Media);
    return prisma.media.findUnique({
      where: { id: saved.id },
      include: { streamingLinks: true },
    });
  } catch (error) {
    // AniList indisponible : on sert la version en cache si on en a une, même périmée.
    console.error("Rafraîchissement AniList échoué", anilistId, error);
    return cached;
  }
}
