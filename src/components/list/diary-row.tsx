"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Repeat, Eye } from "lucide-react";
import { StarRating } from "@/components/media/star-rating";
import type { DiaryEntryView } from "./types";

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function DiaryRow({ entry }: { entry: DiaryEntryView }) {
  const [revealed, setRevealed] = useState(false);
  const href = `/${entry.media.type === "ANIME" ? "anime" : "manga"}/${entry.media.anilistId}`;
  const showSpoilerGate = entry.spoiler && entry.review && !revealed;

  return (
    <div className="flex gap-4 border-b border-border py-4 last:border-b-0">
      <Link href={href} className="relative aspect-2/3 w-16 shrink-0 overflow-hidden rounded-md bg-surface-elevated">
        {entry.media.coverUrl ? (
          <Image src={entry.media.coverUrl} alt={entry.media.titleRomaji} fill sizes="64px" className="object-cover" />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={href} className="font-medium text-foreground hover:underline">
            {entry.media.titleRomaji}
          </Link>
          {entry.isRewatch && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] font-medium text-foreground-muted">
              <Repeat className="size-3" />
              Revisionnage
            </span>
          )}
        </div>

        <span className="text-xs text-foreground-muted">{DATE_FORMATTER.format(new Date(entry.watchedAt))}</span>

        {entry.rating != null && <StarRating value={entry.rating} readOnly size={14} />}

        {entry.review &&
          (showSpoilerGate ? (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="inline-flex w-fit items-center gap-1.5 rounded-md bg-surface-elevated px-2.5 py-1 text-xs font-medium text-foreground-muted hover:text-foreground"
            >
              <Eye className="size-3.5" />
              Contient des spoilers — afficher
            </button>
          ) : (
            <p className="text-sm text-foreground-muted">{entry.review}</p>
          ))}
      </div>
    </div>
  );
}
