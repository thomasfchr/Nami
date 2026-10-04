import "server-only";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toCardDataFromPrismaMedia, type MediaCardData } from "@/lib/anilist/cache";
import type { MediaType } from "@prisma/client";

let ownerUserId: string | null = null;

async function getOwnerUserId() {
  if (ownerUserId) return ownerUserId;
  const email = process.env.OWNER_EMAIL;
  if (!email) return null;

  const owner = await prisma.user.upsert({
    where: { email },
    create: { email, name: "Moi" },
    update: {},
  });
  ownerUserId = owner.id;
  return owner.id;
}

/** Usage personnel : sans session, on utilise le compte propriétaire (OWNER_EMAIL). */
export async function getCurrentUserId() {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  return getOwnerUserId();
}

/**
 * Prend `userId` déjà résolu (plutôt que d'appeler `auth()` ici) : `auth()`
 * lit les headers de la requête, ce que Next refuse une fois qu'un appel
 * `after(...)` a été planifié ailleurs dans la même requête (ex: le
 * réchauffement du cache AniList sur la page d'accueil).
 */
export async function getMyListEntry(userId: string | null, anilistId: number) {
  if (!userId) return null;

  return prisma.listEntry.findFirst({
    where: { userId, media: { anilistId } },
  });
}

/** Liste "Reprendre" : séries en cours de visionnage/lecture, triées par activité récente. */
export async function getContinueWatching(
  userId: string | null,
  mediaType?: MediaType,
  limit = 20,
): Promise<MediaCardData[]> {
  if (!userId) return [];

  const entries = await prisma.listEntry.findMany({
    where: { userId, status: "WATCHING", ...(mediaType ? { media: { type: mediaType } } : {}) },
    include: { media: { include: { streamingLinks: true } } },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return entries.map((entry) => toCardDataFromPrismaMedia(entry.media));
}

/** La prochaine série (en cours ou prévue) de ma liste dont un épisode arrive le plus tôt. */
export async function getNextUpForMe(userId: string | null, mediaType?: MediaType) {
  if (!userId) return null;

  const entry = await prisma.listEntry.findFirst({
    where: {
      userId,
      status: { in: ["WATCHING", "PLANNING"] },
      media: {
        nextAiringAt: { gt: new Date() },
        ...(mediaType ? { type: mediaType } : {}),
      },
    },
    include: { media: { include: { streamingLinks: true } } },
    orderBy: { media: { nextAiringAt: "asc" } },
  });

  return entry?.media ?? null;
}

/** Ma liste "à voir" dont la série est déjà terminée côté AniList : à rattraper. */
export async function getToCatchUp(
  userId: string | null,
  mediaType?: MediaType,
  limit = 20,
): Promise<MediaCardData[]> {
  if (!userId) return [];

  const entries = await prisma.listEntry.findMany({
    where: {
      userId,
      status: "PLANNING",
      media: { status: "FINISHED", ...(mediaType ? { type: mediaType } : {}) },
    },
    include: { media: { include: { streamingLinks: true } } },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return entries.map((entry) => toCardDataFromPrismaMedia(entry.media));
}

/** Toutes les entrées de "Ma liste" (tous statuts confondus), les plus récentes en premier. */
export async function getAllListEntries(userId: string | null) {
  if (!userId) return [];

  return prisma.listEntry.findMany({
    where: { userId },
    include: { media: true },
    orderBy: { updatedAt: "desc" },
  });
}

/** Journal de visionnage : chaque série terminée (y compris revisionnages). */
export async function getDiaryEntries(userId: string | null, limit = 50) {
  if (!userId) return [];

  return prisma.diaryEntry.findMany({
    where: { userId },
    include: { media: true },
    orderBy: { watchedAt: "desc" },
    take: limit,
  });
}
