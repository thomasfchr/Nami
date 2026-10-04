"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/list-entries";
import type { ListStatus, Media, Prisma } from "@prisma/client";

type MediaType = "ANIME" | "MANGA";
type ActionError = "unauthenticated" | "media_not_found" | "not_in_list";
type ActionResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: ActionError };

function revalidateMediaViews(anilistId: number, mediaType: MediaType) {
  const basePath = mediaType === "ANIME" ? "anime" : "manga";
  revalidatePath(`/${basePath}/${anilistId}`);
  revalidatePath("/");
  revalidatePath("/ma-liste");
}

function totalCountFor(media: Media) {
  return media.type === "ANIME" ? media.episodes : media.chapters;
}

async function requireUserAndMedia(
  anilistId: number,
): Promise<{ error: "unauthenticated" | "media_not_found" } | { userId: string; media: Media }> {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "unauthenticated" };

  const media = await prisma.media.findUnique({ where: { anilistId } });
  if (!media) return { error: "media_not_found" };

  return { userId, media };
}

async function getOrCreateEntry(userId: string, mediaId: string) {
  return prisma.listEntry.upsert({
    where: { userId_mediaId: { userId, mediaId } },
    create: { userId, mediaId, status: "PLANNING" },
    update: {},
  });
}

/** Marque l'entrée comme terminée : statut, progression au max, et une entrée de journal. */
async function completeEntry(
  userId: string,
  media: Media,
  entry: { id: string; rating: Prisma.Decimal | null; review: string | null; spoiler: boolean },
) {
  const totalCount = totalCountFor(media);
  const priorWatchCount = await prisma.diaryEntry.count({
    where: { userId, mediaId: media.id },
  });

  await prisma.$transaction([
    prisma.listEntry.update({
      where: { id: entry.id },
      data: {
        status: "COMPLETED",
        progress: totalCount ?? undefined,
        finishedAt: new Date(),
      },
    }),
    prisma.diaryEntry.create({
      data: {
        userId,
        mediaId: media.id,
        watchedAt: new Date(),
        rating: entry.rating,
        review: entry.review,
        spoiler: entry.spoiler,
        isRewatch: priorWatchCount > 0,
      },
    }),
  ]);
}

/** Ajoute ou retire un média de "Ma liste" (statut initial : à voir / à lire). */
export async function toggleMyList(
  anilistId: number,
  mediaType: MediaType,
): Promise<ActionResult<{ inList: boolean }>> {
  const ctx = await requireUserAndMedia(anilistId);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { userId, media } = ctx;

  const existing = await prisma.listEntry.findUnique({
    where: { userId_mediaId: { userId, mediaId: media.id } },
  });

  if (existing) {
    await prisma.listEntry.delete({ where: { id: existing.id } });
  } else {
    await prisma.listEntry.create({
      data: { userId, mediaId: media.id, status: "PLANNING" },
    });
  }

  revalidateMediaViews(anilistId, mediaType);
  return { ok: true, inList: !existing };
}

/** Change le statut de suivi. Passer à "COMPLETED" crée une entrée de journal. */
export async function setListStatus(
  anilistId: number,
  mediaType: MediaType,
  status: ListStatus,
): Promise<ActionResult> {
  const ctx = await requireUserAndMedia(anilistId);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { userId, media } = ctx;

  const entry = await getOrCreateEntry(userId, media.id);

  if (status === "COMPLETED") {
    await completeEntry(userId, media, entry);
  } else {
    await prisma.listEntry.update({
      where: { id: entry.id },
      data: {
        status,
        startedAt: status === "WATCHING" && !entry.startedAt ? new Date() : entry.startedAt,
      },
    });
  }

  revalidateMediaViews(anilistId, mediaType);
  return { ok: true };
}

/** +1 / -1 épisode (ou chapitre). Gère les transitions automatiques de statut. */
export async function updateProgress(
  anilistId: number,
  mediaType: MediaType,
  delta: 1 | -1,
): Promise<ActionResult<{ progress: number }>> {
  const ctx = await requireUserAndMedia(anilistId);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { userId, media } = ctx;

  const entry = await getOrCreateEntry(userId, media.id);
  const totalCount = totalCountFor(media);
  const upperBound = totalCount ?? Number.POSITIVE_INFINITY;
  const nextProgress = Math.min(Math.max(entry.progress + delta, 0), upperBound);

  if (nextProgress === entry.progress) {
    return { ok: true, progress: entry.progress };
  }

  const isFirstProgress = entry.progress === 0 && nextProgress >= 1 && entry.status === "PLANNING";
  const isFinalCount =
    totalCount != null && nextProgress >= totalCount && media.status === "FINISHED";

  if (isFinalCount) {
    await completeEntry(userId, media, entry);
  } else {
    await prisma.listEntry.update({
      where: { id: entry.id },
      data: {
        progress: nextProgress,
        status: isFirstProgress ? "WATCHING" : entry.status,
        startedAt: isFirstProgress ? new Date() : entry.startedAt,
      },
    });
  }

  revalidateMediaViews(anilistId, mediaType);
  return { ok: true, progress: nextProgress };
}

/** Repart pour un revisionnage : remet la progression à zéro sans effacer le journal. */
export async function startRewatch(
  anilistId: number,
  mediaType: MediaType,
): Promise<ActionResult> {
  const ctx = await requireUserAndMedia(anilistId);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { userId, media } = ctx;

  const entry = await prisma.listEntry.findUnique({
    where: { userId_mediaId: { userId, mediaId: media.id } },
  });
  if (!entry) return { ok: false, error: "not_in_list" };

  await prisma.listEntry.update({
    where: { id: entry.id },
    data: { status: "WATCHING", progress: 0, startedAt: new Date(), finishedAt: null },
  });

  revalidateMediaViews(anilistId, mediaType);
  return { ok: true };
}

/** Met à jour la note (0.5 à 5) ; synchronise aussi le dernier journal si la série est terminée. */
export async function setRating(anilistId: number, rating: number | null): Promise<ActionResult> {
  const ctx = await requireUserAndMedia(anilistId);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { userId, media } = ctx;

  const entry = await getOrCreateEntry(userId, media.id);

  await prisma.listEntry.update({ where: { id: entry.id }, data: { rating } });
  await syncLatestDiaryEntry(userId, media.id, entry.status, { rating });

  revalidateMediaViews(anilistId, media.type);
  return { ok: true };
}

/** Coup de cœur (toggle). */
export async function toggleLiked(anilistId: number): Promise<ActionResult<{ liked: boolean }>> {
  const ctx = await requireUserAndMedia(anilistId);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { userId, media } = ctx;

  const entry = await getOrCreateEntry(userId, media.id);
  const liked = !entry.liked;

  await prisma.listEntry.update({ where: { id: entry.id }, data: { liked } });
  revalidateMediaViews(anilistId, media.type);
  return { ok: true, liked };
}

/** Critique texte + marqueur spoiler. */
export async function setReview(
  anilistId: number,
  review: string,
  spoiler: boolean,
): Promise<ActionResult> {
  const ctx = await requireUserAndMedia(anilistId);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { userId, media } = ctx;

  const entry = await getOrCreateEntry(userId, media.id);
  const trimmed = review.trim();

  await prisma.listEntry.update({
    where: { id: entry.id },
    data: { review: trimmed || null, spoiler },
  });
  await syncLatestDiaryEntry(userId, media.id, entry.status, {
    review: trimmed || null,
    spoiler,
  });

  revalidateMediaViews(anilistId, media.type);
  return { ok: true };
}

/** Garde le dernier visionnage du journal aligné sur la note/critique courante. */
async function syncLatestDiaryEntry(
  userId: string,
  mediaId: string,
  status: ListStatus,
  data: { rating?: number | null; review?: string | null; spoiler?: boolean },
) {
  if (status !== "COMPLETED") return;

  const latest = await prisma.diaryEntry.findFirst({
    where: { userId, mediaId },
    orderBy: { watchedAt: "desc" },
  });
  if (!latest) return;

  await prisma.diaryEntry.update({ where: { id: latest.id }, data });
}
