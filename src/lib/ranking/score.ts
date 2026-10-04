import type { RankTier } from "@prisma/client";

export const TIER_RANGES: Record<RankTier, [number, number]> = {
  ADORE: [7.0, 10.0],
  BIEN: [4.0, 6.9],
  BOF: [0.0, 3.9],
};

export const TIER_LABELS: Record<RankTier, string> = {
  ADORE: "J'ai adoré",
  BIEN: "C'était bien",
  BOF: "Bof",
};

/** Score linéaire selon la position (0 = meilleur) dans un groupe de `total` éléments. */
export function computeScore(tier: RankTier, position: number, total: number): number {
  const [min, max] = TIER_RANGES[tier];
  if (total <= 1) return max;
  const ratio = position / (total - 1);
  const raw = max - ratio * (max - min);
  return Math.round(raw * 10) / 10;
}
