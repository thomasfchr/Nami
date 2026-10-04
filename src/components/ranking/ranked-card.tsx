import Link from "next/link";
import Image from "next/image";
import type { RankedEntryView } from "@/lib/ranking/read";

export function RankedCard({ entry }: { entry: RankedEntryView }) {
  const href = `/${entry.type === "ANIME" ? "anime" : "manga"}/${entry.anilistId}`;

  return (
    <Link href={href} className="group flex flex-col gap-2">
      <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-surface-elevated">
        {entry.coverUrl ? (
          <Image
            src={entry.coverUrl}
            alt={entry.title}
            fill
            sizes="160px"
            className="object-cover transition-transform duration-200 ease-out group-hover:scale-105"
            draggable={false}
          />
        ) : null}
        <span className="absolute left-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-background/90 text-xs font-bold text-foreground">
          {entry.rank}
        </span>
        <span className="absolute bottom-1.5 right-1.5 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
          {entry.score.toFixed(1)}
        </span>
      </div>
      <span className="line-clamp-2 text-xs font-medium text-foreground">{entry.title}</span>
    </Link>
  );
}
