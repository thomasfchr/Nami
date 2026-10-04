"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/list-entries";
import { computeScore } from "@/lib/ranking/score";
import type { RankTier, Prisma } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

export type TierItem = {
  anilistId: number;
  type: "ANIME" | "MANGA";
  title: string;
  coverUrl: string | null;
  score: number;
};

/** Items déjà classés dans un ressenti, du meilleur au moins bon (pour les duels côté client). */
export async function getTierItems(tier: RankTier): Promise<TierItem[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const items = await prisma.rankedItem.findMany({
    where: { userId, tier },
    include: { media: true },
    orderBy: { position: "asc" },
  });

  return items.map((item) => ({
    anilistId: item.media.anilistId,
    type: item.media.type,
    title: item.media.titleRomaji,
    coverUrl: item.media.coverUrl,
    score: Number(item.score),
  }));
}

async function reflowTier(tx: TxClient, userId: string, tier: RankTier) {
  const items = await tx.rankedItem.findMany({
    where: { userId, tier },
    orderBy: { position: "asc" },
  });
  const total = items.length;

  for (const [index, item] of items.entries()) {
    await tx.rankedItem.update({
      where: { id: item.id },
      data: { position: index, score: computeScore(tier, index, total) },
    });
  }
}

/** Insère (ou déplace) un média à un index précis d'un ressenti, puis recalcule tous les scores du groupe. */
export async function commitRanking(
  anilistId: number,
  mediaType: "ANIME" | "MANGA",
  tier: RankTier,
  insertIndex: number,
): Promise<
  { ok: true; position: number; total: number; score: number } | { ok: false; error: string }
> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "unauthenticated" };

  const media = await prisma.media.findUnique({ where: { anilistId } });
  if (!media) return { ok: false, error: "media_not_found" };

  await prisma.$transaction(async (tx) => {
    const existing = await tx.rankedItem.findUnique({
      where: { userId_mediaId: { userId, mediaId: media.id } },
    });

    let previousTier: RankTier | null = null;
    if (existing) {
      previousTier = existing.tier;
      await tx.rankedItem.delete({ where: { id: existing.id } });
    }

    const targetItems = await tx.rankedItem.findMany({
      where: { userId, tier },
      orderBy: { position: "asc" },
    });
    const clampedIndex = Math.min(Math.max(insertIndex, 0), targetItems.length);

    for (const item of targetItems.filter((entry) => entry.position >= clampedIndex)) {
      await tx.rankedItem.update({ where: { id: item.id }, data: { position: item.position + 1 } });
    }

    await tx.rankedItem.create({
      data: {
        userId,
        mediaId: media.id,
        mediaType,
        tier,
        position: clampedIndex,
        score: 0,
      },
    });

    await reflowTier(tx, userId, tier);
    if (previousTier && previousTier !== tier) {
      await reflowTier(tx, userId, previousTier);
    }
  });

  revalidatePath("/classement");
  revalidatePath(`/${mediaType === "ANIME" ? "anime" : "manga"}/${anilistId}`);

  const saved = await prisma.rankedItem.findUnique({
    where: { userId_mediaId: { userId, mediaId: media.id } },
  });
  if (!saved) return { ok: false, error: "insert_failed" };

  const total = await prisma.rankedItem.count({ where: { userId, tier } });

  return { ok: true, position: saved.position, total, score: Number(saved.score) };
}

/** Réordonnancement manuel par glisser-déposer au sein d'un même ressenti. */
export async function reorderWithinTier(
  tier: RankTier,
  orderedAnilistIds: number[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "unauthenticated" };

  await prisma.$transaction(async (tx) => {
    const items = await tx.rankedItem.findMany({
      where: { userId, tier },
      include: { media: { select: { anilistId: true } } },
    });
    const byAnilistId = new Map(items.map((item) => [item.media.anilistId, item]));

    for (const [index, anilistId] of orderedAnilistIds.entries()) {
      const item = byAnilistId.get(anilistId);
      if (item) await tx.rankedItem.update({ where: { id: item.id }, data: { position: index } });
    }

    await reflowTier(tx, userId, tier);
  });

  revalidatePath("/classement");
  return { ok: true };
}

/** Retire un média du classement (le reste du groupe se resserre). */
export async function removeFromRanking(
  anilistId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "unauthenticated" };

  const media = await prisma.media.findUnique({ where: { anilistId } });
  if (!media) return { ok: false, error: "media_not_found" };

  await prisma.$transaction(async (tx) => {
    const existing = await tx.rankedItem.findUnique({
      where: { userId_mediaId: { userId, mediaId: media.id } },
    });
    if (!existing) return;

    await tx.rankedItem.delete({ where: { id: existing.id } });
    await reflowTier(tx, userId, existing.tier);
  });

  revalidatePath("/classement");
  revalidatePath(`/${media.type === "ANIME" ? "anime" : "manga"}/${anilistId}`);
  return { ok: true };
}
