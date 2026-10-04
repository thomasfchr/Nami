import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { StarRating } from "@/components/media/star-rating";
import type { ListEntryView } from "./types";

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "À voir",
  WATCHING: "En cours",
  COMPLETED: "Terminé",
  DROPPED: "Abandonné",
};

export function ListEntryCard({ entry }: { entry: ListEntryView }) {
  const { media } = entry;
  const totalCount = media.type === "ANIME" ? media.episodes : media.chapters;
  const progressRatio =
    totalCount && totalCount > 0 ? Math.min(entry.progress / totalCount, 1) * 100 : 0;
  const href = `/${media.type === "ANIME" ? "anime" : "manga"}/${media.anilistId}`;

  return (
    <Link href={href} className="group flex flex-col gap-2">
      <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-surface-elevated">
        {media.coverUrl ? (
          <Image
            src={media.coverUrl}
            alt={media.titleRomaji}
            fill
            sizes="160px"
            className="object-cover transition-transform duration-200 ease-out group-hover:scale-105"
          />
        ) : null}

        <span className="absolute left-1.5 top-1.5 rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
          {STATUS_LABELS[entry.status]}
        </span>

        {entry.liked && (
          <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-background/85 text-accent">
            <Heart className="size-3.5" fill="currentColor" />
          </span>
        )}

        {progressRatio > 0 && entry.status !== "COMPLETED" && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/30">
            <div className="h-full bg-accent" style={{ width: `${progressRatio}%` }} />
          </div>
        )}
      </div>

      <span className="line-clamp-2 text-xs font-medium text-foreground">
        {media.titleRomaji}
      </span>

      {entry.rating != null ? (
        <StarRating value={entry.rating} readOnly size={12} />
      ) : (
        <span className="text-[11px] text-foreground-muted">
          {entry.progress} / {totalCount ?? "?"}
        </span>
      )}
    </Link>
  );
}
