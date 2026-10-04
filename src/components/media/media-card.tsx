import Image from "next/image";
import Link from "next/link";
import type { MediaCardData } from "@/lib/anilist/cache";

function mediaHref(media: Pick<MediaCardData, "type" | "anilistId">) {
  return `/${media.type === "ANIME" ? "anime" : "manga"}/${media.anilistId}`;
}

export function MediaCard({ media }: { media: MediaCardData }) {
  return (
    <Link
      href={mediaHref(media)}
      className="group flex w-32 shrink-0 snap-start flex-col gap-2 sm:w-40"
    >
      <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-surface-elevated">
        {media.coverUrl ? (
          <Image
            src={media.coverUrl}
            alt={media.title}
            fill
            sizes="160px"
            className="object-cover transition-transform duration-200 ease-out group-hover:scale-105"
          />
        ) : null}

        <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
          {media.isNewEpisode && (
            <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
              Nouvel épisode
            </span>
          )}
        </div>
      </div>
      <span className="line-clamp-2 text-xs font-medium text-foreground">{media.title}</span>
    </Link>
  );
}
