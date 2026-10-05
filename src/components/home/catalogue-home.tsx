import Link from "next/link";
import { Trophy } from "lucide-react";
import {
  getAiringThisWeek,
  getSeasonPopular,
  getPopular,
  getClassics,
  getRecentlyAired,
} from "@/lib/anilist/home";
import { toCardDataFromPrismaMedia, type MediaCardData } from "@/lib/anilist/cache";
import {
  getContinueWatching,
  getNextUpForMe,
  getMyListEntry,
  getCurrentUserId,
  getToCatchUp,
} from "@/lib/list-entries";

const TO_CATCH_UP_EMPTY = "Aucune série terminée en attente dans ta liste « À voir ».";
import { Hero } from "@/components/home/hero";
import { MediaRow } from "@/components/media/media-row";

export async function CatalogueHome({ type }: { type: "ANIME" | "MANGA" }) {
  // Résolu avant toute requête AniList : auth() lit les headers de la
  // requête, ce que Next interdit une fois qu'un after(...) a été planifié
  // (réchauffement du cache AniList plus bas).
  const userId = await getCurrentUserId();
  // Séquentiel plutôt que Promise.all : la base Postgres locale de dev
  // (`prisma dev`) ne supporte pas bien les connexions concurrentes.
  const continueList = await getContinueWatching(userId, type);
  const nextUp = await getNextUpForMe(userId, type);
  const toCatchUp = await getToCatchUp(userId, type);

  if (type === "ANIME") {
    const [airingThisWeek, seasonPopular, classics, { ids: recentlyAired, latest }] =
      await Promise.all([
        getAiringThisWeek(),
        getSeasonPopular(),
        getClassics("ANIME"),
        getRecentlyAired(),
      ]);

    const withNewBadge = (items: MediaCardData[]) =>
      items.map((item) => ({
        ...item,
        isNewEpisode: item.isNewEpisode || recentlyAired.has(item.anilistId),
      }));

    // Le héros suit la dernière sortie : il change à chaque nouvel épisode diffusé.
    // Uniquement des séries avec une bannière, sans quoi le haut de page reste vide.
    const nextUpCard = nextUp ? toCardDataFromPrismaMedia(nextUp) : null;
    const heroMedia =
      latest ??
      [nextUpCard, ...airingThisWeek, ...seasonPopular].find((media) => media?.bannerUrl) ??
      null;
    const heroInList = heroMedia
      ? Boolean(await getMyListEntry(userId, heroMedia.anilistId))
      : false;

    return (
      <div className="flex flex-col gap-10 pb-10">
        {heroMedia && <Hero media={heroMedia} inList={heroInList} />}
        <div className="flex flex-col gap-8">
          <MediaRow title="Reprendre" items={withNewBadge(continueList)} />
          <MediaRow title="Cette semaine" items={withNewBadge(airingThisWeek)} />
          <MediaRow title="Populaires de la saison" items={withNewBadge(seasonPopular)} />
          <MediaRow
            title="Séries terminées à rattraper"
            items={withNewBadge(toCatchUp)}
            emptyText={TO_CATCH_UP_EMPTY}
          />
          <MediaRow title="Classiques" items={withNewBadge(classics)} />
        </div>
      </div>
    );
  }

  const [popular, classics] = await Promise.all([getPopular("MANGA"), getClassics("MANGA")]);

  const nextUpCard = nextUp ? toCardDataFromPrismaMedia(nextUp) : null;
  const heroMedia = [nextUpCard, ...popular].find((media) => media?.bannerUrl) ?? null;
  const heroInList = heroMedia
    ? Boolean(await getMyListEntry(userId, heroMedia.anilistId))
    : false;

  return (
    <div className="flex flex-col gap-10 pb-10">
      {heroMedia && <Hero media={heroMedia} inList={heroInList} />}
      <div className="flex flex-col gap-8">
        <MediaRow title="Reprendre" items={continueList} />
        <MediaRow title="Populaires" items={popular} />
        <MediaRow
          title="Séries terminées à rattraper"
          items={toCatchUp}
          emptyText={TO_CATCH_UP_EMPTY}
        />
        <MediaRow title="Classiques" items={classics} />
      </div>

      <div className="px-6 md:px-8">
        <Link
          href="/classement?type=MANGA"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
        >
          <Trophy className="size-4" />
          Voir mon classement manga
        </Link>
      </div>
    </div>
  );
}
