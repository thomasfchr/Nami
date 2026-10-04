/**
 * AniList ne précise pas si un lien de streaming est gratuit ou payant.
 * Heuristique approximative basée sur les plateformes qui proposent la
 * majorité de leur catalogue en simulcast gratuit (avec publicité) :
 * à affiner manuellement par série si besoin.
 */
export const FREE_STREAMING_SITES = new Set([
  "Crunchyroll",
  "YouTube",
  "Youtube",
  "VIZ",
  "MANGA Plus",
  "J-Novel Club",
]);

export function isLikelyFreeSite(site: string) {
  return FREE_STREAMING_SITES.has(site);
}
