import Link from "next/link";
import Image from "next/image";
import type { MediaCardData } from "@/lib/anilist/cache";
import { cn } from "@/lib/utils";

const TIME_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

export function CalendarEntry({
  media,
  airingAt,
  episode,
  highlighted,
}: {
  media: MediaCardData;
  airingAt: number;
  episode: number;
  highlighted: boolean;
}) {
  return (
    <Link
      href={`/anime/${media.anilistId}`}
      className={cn(
        "flex w-36 shrink-0 flex-col gap-2 rounded-lg p-1.5 transition-colors hover:bg-surface-elevated",
        highlighted && "ring-1 ring-accent/60",
      )}
    >
      <div className="relative aspect-2/3 w-full overflow-hidden rounded-md bg-surface-elevated">
        {media.coverUrl ? (
          <Image src={media.coverUrl} alt={media.title} fill sizes="144px" className="object-cover" />
        ) : null}
        <span className="absolute left-1.5 top-1.5 rounded bg-background/85 px-1.5 py-0.5 text-[11px] font-semibold text-foreground">
          {TIME_FORMATTER.format(new Date(airingAt * 1000))}
        </span>
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="line-clamp-2 text-xs font-medium text-foreground">{media.title}</span>
        <span className="text-[11px] text-foreground-muted">Ép. {episode}</span>
      </div>
    </Link>
  );
}
