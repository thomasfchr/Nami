"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MediaCard } from "./media-card";
import type { MediaCardData } from "@/lib/anilist/cache";

export function MediaRow({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: MediaCardData[];
  emptyText?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (items.length === 0 && !emptyText) return null;

  function scrollBy(direction: 1 | -1) {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: "smooth" });
  }

  if (items.length === 0) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="px-6 text-lg font-semibold text-foreground md:px-8">{title}</h2>
        <p className="px-6 text-sm text-foreground-muted md:px-8">{emptyText}</p>
      </section>
    );
  }

  return (
    <section className="group/row relative flex flex-col gap-3">
      <h2 className="px-6 text-lg font-semibold text-foreground md:px-8">{title}</h2>

      <button
        type="button"
        aria-label="Précédent"
        onClick={() => scrollBy(-1)}
        className="absolute top-1/2 left-1 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-md transition-opacity group-hover/row:opacity-100 md:flex"
      >
        <ChevronLeft className="size-5" />
      </button>

      <div
        ref={scrollerRef}
        className="scrollbar-none flex snap-x gap-3 overflow-x-auto scroll-smooth px-6 pb-1 md:px-8"
      >
        {items.map((media) => (
          <MediaCard key={`${media.type}-${media.anilistId}`} media={media} />
        ))}
      </div>

      <button
        type="button"
        aria-label="Suivant"
        onClick={() => scrollBy(1)}
        className="absolute top-1/2 right-1 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-md transition-opacity group-hover/row:opacity-100 md:flex"
      >
        <ChevronRight className="size-5" />
      </button>
    </section>
  );
}
