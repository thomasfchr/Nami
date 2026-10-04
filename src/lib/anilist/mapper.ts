import "server-only";
import { prisma } from "@/lib/prisma";
import type { MediaStatus, MediaType, Prisma } from "@prisma/client";
import type { AniListMedia, AniListMediaStatus } from "./types";
import { isLikelyFreeSite } from "./free-sites";

const STATUS_MAP: Record<AniListMediaStatus, MediaStatus> = {
  FINISHED: "FINISHED",
  RELEASING: "RELEASING",
  NOT_YET_RELEASED: "NOT_YET_RELEASED",
  CANCELLED: "CANCELLED",
  HIATUS: "HIATUS",
};

export async function upsertMediaFromAniList(media: AniListMedia) {
  const type: MediaType = media.type === "MANGA" ? "MANGA" : "ANIME";
  const status = media.status ? STATUS_MAP[media.status] : null;

  // N'est défini que pour les requêtes "détail" (MEDIA_DETAIL_FRAGMENT) :
  // les requêtes "liste" (recherche, rangées, calendrier) n'incluent pas ce
  // champ, coûteux à grande échelle — on ne doit alors pas écraser le
  // planning déjà stocké en base lors d'un précédent appel détaillé.
  const episodeScheduleNodes = media.episodeSchedule?.nodes;
  const hasScheduleData = episodeScheduleNodes !== undefined;
  const now = Date.now();
  const lastAiring = (episodeScheduleNodes ?? [])
    .filter((node) => node.airingAt * 1000 <= now)
    .sort((a, b) => b.airingAt - a.airingAt)[0];
  // AniList ne remplit pas toujours nextAiringEpisode pour les séries tout
  // juste lancées : on retombe sur le planning d'épisodes si besoin.
  const nextAiringFallback = (episodeScheduleNodes ?? [])
    .filter((node) => node.airingAt * 1000 > now)
    .sort((a, b) => a.airingAt - b.airingAt)[0];
  const nextAiring = media.nextAiringEpisode ?? nextAiringFallback ?? null;

  const data = {
    anilistId: media.id,
    type,
    titleRomaji:
      media.title.romaji ?? media.title.english ?? media.title.native ?? "Sans titre",
    titleEnglish: media.title.english,
    titleNative: media.title.native,
    synopsis: media.description,
    coverUrl: media.coverImage?.extraLarge ?? media.coverImage?.large ?? null,
    bannerUrl: media.bannerImage,
    color: media.coverImage?.color ?? null,
    episodes: media.episodes,
    chapters: media.chapters,
    duration: media.duration,
    status,
    season: media.season,
    seasonYear: media.seasonYear,
    genres: media.genres ?? [],
    studio: media.studios?.nodes?.[0]?.name ?? null,
    nextAiringAt: nextAiring ? new Date(nextAiring.airingAt * 1000) : null,
    nextEpisode: nextAiring?.episode ?? null,
    ...(hasScheduleData
      ? {
          lastAiringAt: lastAiring ? new Date(lastAiring.airingAt * 1000) : null,
          lastAiringEpisode: lastAiring?.episode ?? null,
          episodeSchedule: (episodeScheduleNodes ?? []) as unknown as Prisma.InputJsonValue,
        }
      : {}),
  };

  const saved = await prisma.media.upsert({
    where: { anilistId: media.id },
    create: data,
    update: data,
  });

  const links = (media.externalLinks ?? []).filter((link) => link.url && !link.isDisabled);

  await prisma.$transaction([
    prisma.streamingLink.deleteMany({ where: { mediaId: saved.id } }),
    ...(links.length
      ? [
          prisma.streamingLink.createMany({
            data: links.map((link) => ({
              mediaId: saved.id,
              site: link.site,
              url: link.url,
              isFree: isLikelyFreeSite(link.site),
            })),
          }),
        ]
      : []),
  ]);

  return saved;
}
