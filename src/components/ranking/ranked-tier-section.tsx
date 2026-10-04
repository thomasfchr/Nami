"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { RankTier } from "@prisma/client";
import { TIER_LABELS } from "@/lib/ranking/score";
import { reorderWithinTier } from "@/lib/actions/ranking";
import { RankedCard } from "./ranked-card";
import type { RankedEntryView } from "@/lib/ranking/read";

export function RankedTierSection({
  tier,
  entries,
  reorderable,
}: {
  tier: RankTier;
  entries: RankedEntryView[];
  reorderable: boolean;
}) {
  const [order, setOrder] = useState(entries);
  const dragIndex = useRef<number | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => setOrder(entries), [entries]);

  if (entries.length === 0) return null;

  function handleDrop(targetIndex: number) {
    if (!reorderable || dragIndex.current === null || dragIndex.current === targetIndex) {
      dragIndex.current = null;
      return;
    }
    const next = [...order];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(targetIndex, 0, moved);
    setOrder(next);
    dragIndex.current = null;
    startTransition(() => {
      reorderWithinTier(tier, next.map((entry) => entry.anilistId));
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-foreground">{TIER_LABELS[tier]}</h2>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
        {order.map((entry, index) => (
          <div
            key={entry.anilistId}
            draggable={reorderable}
            onDragStart={() => (dragIndex.current = index)}
            onDragOver={(e) => reorderable && e.preventDefault()}
            onDrop={() => handleDrop(index)}
            className={reorderable ? "cursor-grab active:cursor-grabbing" : undefined}
          >
            <RankedCard entry={entry} />
          </div>
        ))}
      </div>
    </section>
  );
}
