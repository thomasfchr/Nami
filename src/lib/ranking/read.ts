import "server-only";
import { prisma } from "@/lib/prisma";
import type { RankTier } from "@prisma/client";

export type RankedEntryView = {
  anilistId: number;
  type: "ANIME" | "MANGA";
  title: string;
  coverUrl: string | null;
  genres: string[];
  year: number | null;
  tier: RankTier;
  position: number;
  score: number;
  rank: number;
};

const TIER_ORDER: RankTier[] = ["ADORE", "BIEN", "BOF"];

/** Tout le classement de l'utilisateur, avec un rang global (1..N) tous ressentis confondus. */
export async function getMyRanking(userId: string | null): Promise<RankedEntryView[]> {
  if (!userId) return [];

  const items = await prisma.rankedItem.findMany({
    where: { userId },
    include: { media: true },
  });

  const byTier = new Map<RankTier, typeof items>();
  for (const item of items) {
    const list = byTier.get(item.tier) ?? [];
    list.push(item);
    byTier.set(item.tier, list);
  }
  for (const list of byTier.values()) {
    list.sort((a, b) => a.position - b.position);
  }

  const result: RankedEntryView[] = [];
  let rank = 1;
  for (const tier of TIER_ORDER) {
    const list = byTier.get(tier) ?? [];
    for (const item of list) {
      result.push({
        anilistId: item.media.anilistId,
        type: item.media.type,
        title: item.media.titleRomaji,
        coverUrl: item.media.coverUrl,
        genres: item.media.genres,
        year: item.media.seasonYear,
        tier: item.tier,
        position: item.position,
        score: Number(item.score),
        rank: rank++,
      });
    }
  }

  return result;
}

export async function getTop10(userId: string | null): Promise<RankedEntryView[]> {
  const all = await getMyRanking(userId);
  return all.slice(0, 10);
}
