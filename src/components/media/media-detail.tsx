import Image from "next/image";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getMediaByAnilistId } from "@/lib/anilist/cache";
import { getMyListEntry, getCurrentUserId } from "@/lib/list-entries";
import { prisma } from "@/lib/prisma";
import { TrackingPanel } from "@/components/media/tracking-panel";
import { EpisodeList } from "@/components/media/episode-list";

function stripHtml(html: string) {
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");
}

const STATUS_LABELS: Record<string, string> = {
  FINISHED: "Terminé",
  RELEASING: "En cours de diffusion",
  NOT_YET_RELEASED: "À venir",
  CANCELLED: "Annulé",
  HIATUS: "En pause",
};

export async function MediaDetail({ anilistId }: { anilistId: number }) {
  const userId = await getCurrentUserId();
  const media = await getMediaByAnilistId(anilistId);
  const listEntry = await getMyListEntry(userId, anilistId);

  if (!media) notFound();

  const rankedItem = userId
    ? await prisma.rankedItem.findUnique({
        where: { userId_mediaId: { userId, mediaId: media.id } },
      })
    : null;

  const countLabel =
    media.type === "ANIME"
      ? media.episodes
        ? `${media.episodes} épisodes`
        : "Épisodes à venir"
      : media.chapters
        ? `${media.chapters} chapitres`
        : "Chapitres à venir";

  return (
    <div className="flex flex-col">
      {media.bannerUrl && (
        <div className="relative h-48 w-full overflow-hidden md:h-64">
          <Image src={media.bannerUrl} alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}

      <div className="mx-auto w-full max-w-5xl px-6 py-8 md:px-8">
        <div className={`flex flex-col gap-8 sm:flex-row ${media.bannerUrl ? "-mt-20 sm:-mt-28" : ""}`}>
          {media.coverUrl ? (
            <Image
              src={media.coverUrl}
              alt={media.titleRomaji}
              width={240}
              height={360}
              className="aspect-2/3 w-40 shrink-0 self-start rounded-lg object-cover shadow-lg sm:w-56"
              priority
            />
          ) : (
            <div className="aspect-2/3 w-40 shrink-0 rounded-lg bg-surface-elevated sm:w-56" />
          )}

          <div className="flex flex-col gap-4">
            <div>
              <h1 className="font-display text-3xl tracking-wide text-foreground md:text-4xl">
                {media.titleRomaji}
              </h1>
              {media.titleNative && (
                <p className="mt-1 text-sm text-foreground-muted">{media.titleNative}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-foreground-muted">
              {media.status && (
                <span className="rounded-full border border-border px-3 py-1">
                  {STATUS_LABELS[media.status] ?? media.status}
                </span>
              )}
              <span className="rounded-full border border-border px-3 py-1">{countLabel}</span>
              {media.seasonYear && (
                <span className="rounded-full border border-border px-3 py-1">
                  {media.seasonYear}
                </span>
              )}
              {media.studio && (
                <span className="rounded-full border border-border px-3 py-1">
                  {media.studio}
                </span>
              )}
            </div>

            {media.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {media.genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {media.synopsis && (
              <p className="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-foreground-muted">
                {stripHtml(media.synopsis)}
              </p>
            )}

            <div className="pt-1">
              <TrackingPanel
                anilistId={media.anilistId}
                mediaType={media.type}
                totalCount={media.type === "ANIME" ? media.episodes : media.chapters}
                initialEntry={
                  listEntry
                    ? {
                        status: listEntry.status,
                        progress: listEntry.progress,
                        rating: listEntry.rating != null ? Number(listEntry.rating) : null,
                        liked: listEntry.liked,
                        review: listEntry.review ?? "",
                        spoiler: listEntry.spoiler,
                      }
                    : null
                }
                isRanked={Boolean(rankedItem)}
              />
            </div>

            {media.streamingLinks.length > 0 && (
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  Où regarder
                </span>
                <div className="flex flex-wrap gap-2">
                  {media.streamingLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md bg-surface-elevated px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-border"
                    >
                      {link.site}
                      <ExternalLink className="size-3.5" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <EpisodeList media={media} watchedCount={listEntry?.progress ?? 0} />
      </div>
    </div>
  );
}
