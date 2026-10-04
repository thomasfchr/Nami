"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarEntry } from "./calendar-entry";
import type { AiringThisWeekItem } from "@/lib/anilist/home";

export type CalendarDay = {
  key: string;
  label: string;
  dayNumber: string;
  isToday: boolean;
  isPast: boolean;
  items: AiringThisWeekItem[];
};

export type MangaOngoing = {
  anilistId: number;
  title: string;
};

export function CalendarWeekView({
  days,
  myAnilistIds,
  weekOffset,
  mangaOngoing,
}: {
  days: CalendarDay[];
  myAnilistIds: number[];
  weekOffset: number;
  mangaOngoing: MangaOngoing[];
}) {
  const [onlyMine, setOnlyMine] = useState(false);
  const myIdSet = useMemo(() => new Set(myAnilistIds), [myAnilistIds]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl tracking-wide text-foreground">Calendrier</h1>

        <div className="flex items-center gap-2">
          <Link
            href={`/calendrier?week=${weekOffset - 1}`}
            aria-label="Semaine précédente"
            className="flex size-8 items-center justify-center rounded-full bg-surface-elevated text-foreground transition-colors hover:bg-border"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href="/calendrier"
            className="rounded-full bg-surface-elevated px-3 py-1 text-xs font-medium text-foreground-muted transition-colors hover:bg-border"
          >
            Aujourd&apos;hui
          </Link>
          <Link
            href={`/calendrier?week=${weekOffset + 1}`}
            aria-label="Semaine suivante"
            className="flex size-8 items-center justify-center rounded-full bg-surface-elevated text-foreground transition-colors hover:bg-border"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <label className="inline-flex w-fit items-center gap-2 text-sm text-foreground-muted">
        <input
          type="checkbox"
          checked={onlyMine}
          onChange={(e) => setOnlyMine(e.target.checked)}
          className="size-3.5 accent-accent"
        />
        Seulement ma liste
      </label>

      <div className="flex flex-col gap-8">
        {days
          .filter((day) => !day.isPast)
          .map((day) => {
            const items = onlyMine
              ? day.items.filter((item) => myIdSet.has(item.anilistId))
              : day.items;

            return (
              <section key={day.key} className="flex flex-col gap-3">
                <div className="flex items-baseline gap-3 px-6 md:px-8">
                  <h2
                    className={cn(
                      "text-sm font-semibold uppercase tracking-wide text-foreground-muted",
                      day.isToday && "text-accent",
                    )}
                  >
                    {day.isToday ? `Aujourd'hui · ${day.label}` : day.label}
                  </h2>
                  <span className="text-xs text-foreground-muted">{day.dayNumber}</span>
                </div>

                {items.length === 0 ? (
                  <p className="px-6 text-xs text-foreground-muted md:px-8">Aucune sortie.</p>
                ) : (
                  <div className="scrollbar-none flex gap-3 overflow-x-auto px-6 pb-2 md:px-8">
                    {items.map((item) => (
                      <CalendarEntry
                        key={`${item.anilistId}-${item.episode}`}
                        media={item}
                        airingAt={item.airingAt}
                        episode={item.episode}
                        highlighted={myIdSet.has(item.anilistId)}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
      </div>

      {mangaOngoing.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold text-foreground">Manga en cours de parution</h2>
          <p className="text-xs text-foreground-muted">
            AniList ne communique pas de jour de parution précis par chapitre — voici tes séries
            en cours.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {mangaOngoing.map((manga) => (
              <Link
                key={manga.anilistId}
                href={`/manga/${manga.anilistId}`}
                className="rounded-full bg-surface-elevated px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-border"
              >
                {manga.title}
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
