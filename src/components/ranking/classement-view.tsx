"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { RankedTierSection } from "./ranked-tier-section";
import type { RankedEntryView } from "@/lib/ranking/read";
import type { RankTier } from "@prisma/client";

const TIERS: RankTier[] = ["ADORE", "BIEN", "BOF"];

type TypeFilter = "ALL" | "ANIME" | "MANGA";

export function ClassementView({
  entries,
  initialType = "ALL",
}: {
  entries: RankedEntryView[];
  initialType?: TypeFilter;
}) {
  const [type, setType] = useState<TypeFilter>(initialType);
  const [genre, setGenre] = useState<string>("ALL");
  const [year, setYear] = useState<string>("ALL");

  const genres = useMemo(
    () => Array.from(new Set(entries.flatMap((e) => e.genres))).sort(),
    [entries],
  );
  const years = useMemo(
    () =>
      Array.from(new Set(entries.map((e) => e.year).filter((y): y is number => y != null))).sort(
        (a, b) => b - a,
      ),
    [entries],
  );

  const filtersActive = type !== "ALL" || genre !== "ALL" || year !== "ALL";

  const filtered = useMemo(
    () =>
      entries.filter(
        (e) =>
          (type === "ALL" || e.type === type) &&
          (genre === "ALL" || e.genres.includes(genre)) &&
          (year === "ALL" || String(e.year) === year),
      ),
    [entries, type, genre, year],
  );

  if (entries.length === 0) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 px-6 py-20 text-center">
        <h1 className="font-display text-2xl tracking-wide text-foreground">Classement</h1>
        <p className="text-sm text-foreground-muted">
          Termine une série puis clique sur « Classer » sur sa fiche pour commencer ton
          classement.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl tracking-wide text-foreground">Classement</h1>
        <Link
          href="/classement/top10"
          className="inline-flex items-center gap-2 rounded-md bg-surface-elevated px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-border"
        >
          <Share2 className="size-4" />
          Partager mon top 10
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={type} onChange={(v) => setType(v as TypeFilter)}>
          <option value="ALL">Tous types</option>
          <option value="ANIME">Anime</option>
          <option value="MANGA">Manga</option>
        </Select>

        <Select value={genre} onChange={setGenre}>
          <option value="ALL">Tous genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Select>

        <Select value={year} onChange={setYear}>
          <option value="ALL">Toutes années</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>

      {filtersActive && (
        <p className="text-xs text-foreground-muted">
          Le glisser-déposer est désactivé pendant qu&apos;un filtre est actif.
        </p>
      )}

      <div className="flex flex-col gap-10">
        {TIERS.map((tier) => (
          <RankedTierSection
            key={tier}
            tier={tier}
            entries={filtered.filter((e) => e.tier === tier)}
            reorderable={!filtersActive}
          />
        ))}
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-foreground-muted outline-none focus:border-accent",
      )}
    >
      {children}
    </select>
  );
}
