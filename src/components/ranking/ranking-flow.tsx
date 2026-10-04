"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { RankTier } from "@prisma/client";
import { TIER_LABELS } from "@/lib/ranking/score";
import { getTierItems, commitRanking, type TierItem } from "@/lib/actions/ranking";

type MediaType = "ANIME" | "MANGA";

type Phase = "tier" | "loading" | "duel" | "result";

const TIERS: RankTier[] = ["ADORE", "BIEN", "BOF"];

export function RankingFlow({
  anilistId,
  mediaType,
  title,
  coverUrl,
}: {
  anilistId: number;
  mediaType: MediaType;
  title: string;
  coverUrl: string | null;
}) {
  const [phase, setPhase] = useState<Phase>("tier");
  const [tier, setTier] = useState<RankTier | null>(null);
  const [items, setItems] = useState<TierItem[]>([]);
  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(0);
  const [result, setResult] = useState<{ position: number; total: number; score: number } | null>(
    null,
  );
  const [revealScore, setRevealScore] = useState(false);

  const mid = Math.floor((low + high) / 2);
  const opponent = phase === "duel" ? items[mid] : null;

  async function finish(t: RankTier, insertIndex: number) {
    setPhase("loading");
    const res = await commitRanking(anilistId, mediaType, t, insertIndex);
    if (res.ok) {
      setResult({ position: res.position, total: res.total, score: res.score });
      setPhase("result");
    }
  }

  async function pickTier(t: RankTier) {
    setTier(t);
    setPhase("loading");
    const tierItems = await getTierItems(t);

    if (tierItems.length === 0) {
      await finish(t, 0);
      return;
    }

    setItems(tierItems);
    setLow(0);
    setHigh(tierItems.length);
    setPhase("duel");
  }

  function choose(winnerIsNew: boolean) {
    if (!tier) return;
    const newLow = winnerIsNew ? low : mid + 1;
    const newHigh = winnerIsNew ? mid : high;

    if (newLow >= newHigh) {
      finish(tier, newLow);
    } else {
      setLow(newLow);
      setHigh(newHigh);
    }
  }

  function tooHard() {
    if (!tier) return;
    finish(tier, mid + 1);
  }

  useEffect(() => {
    if (phase !== "result") return;
    const timeout = setTimeout(() => setRevealScore(true), 500);
    return () => clearTimeout(timeout);
  }, [phase]);

  if (phase === "tier") {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-8 px-6 py-16 text-center">
        <Poster coverUrl={coverUrl} title={title} size={160} />
        <div>
          <h1 className="font-display text-2xl tracking-wide text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-foreground-muted">Comment l&apos;as-tu trouvée ?</p>
        </div>
        <div className="flex w-full flex-col gap-3">
          {TIERS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => pickTier(t)}
              className="rounded-lg border border-border bg-surface px-6 py-4 text-base font-semibold text-foreground transition-colors hover:border-accent hover:bg-accent/10"
            >
              {TIER_LABELS[t]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-8 animate-pulse rounded-full bg-accent/40" />
      </div>
    );
  }

  if (phase === "duel" && opponent) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-6 py-16">
        <p className="text-sm font-medium text-foreground-muted">Laquelle as-tu préférée ?</p>

        <div className="grid w-full grid-cols-2 gap-4 sm:gap-8">
          <button
            type="button"
            onClick={() => choose(true)}
            className="group flex flex-col items-center gap-3 rounded-lg p-3 transition-colors hover:bg-surface-elevated"
          >
            <Poster coverUrl={coverUrl} title={title} size={160} />
            <span className="text-sm font-medium text-foreground">{title}</span>
          </button>

          <button
            type="button"
            onClick={() => choose(false)}
            className="group flex flex-col items-center gap-3 rounded-lg p-3 transition-colors hover:bg-surface-elevated"
          >
            <Poster coverUrl={opponent.coverUrl} title={opponent.title} size={160} />
            <span className="text-sm font-medium text-foreground">{opponent.title}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={tooHard}
          className="rounded-md px-4 py-2 text-xs font-medium text-foreground-muted underline-offset-4 hover:text-foreground hover:underline"
        >
          Trop dur à dire
        </button>
      </div>
    );
  }

  if (phase === "result" && result && tier) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-6 py-20 text-center">
        <Poster coverUrl={coverUrl} title={title} size={180} />
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-accent">
            {TIER_LABELS[tier]}
          </span>
          <h1
            className={`font-display text-3xl tracking-wide text-foreground transition-all duration-500 ${
              revealScore ? "scale-100 opacity-100" : "scale-90 opacity-0"
            }`}
          >
            Classée n° {result.position + 1} sur {result.total}
          </h1>
          <p
            className={`mt-2 text-2xl font-semibold text-accent transition-all delay-150 duration-500 ${
              revealScore ? "scale-100 opacity-100" : "scale-90 opacity-0"
            }`}
          >
            {result.score.toFixed(1)} / 10
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Link
            href="/classement"
            className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
          >
            Voir mon classement
          </Link>
          <Link
            href={`/${mediaType === "ANIME" ? "anime" : "manga"}/${anilistId}`}
            className="rounded-md bg-surface-elevated px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-border"
          >
            Retour à la fiche
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

function Poster({
  coverUrl,
  title,
  size,
}: {
  coverUrl: string | null;
  title: string;
  size: number;
}) {
  return (
    <div
      className="relative aspect-2/3 overflow-hidden rounded-lg bg-surface-elevated shadow-lg"
      style={{ width: size }}
    >
      {coverUrl ? (
        <Image src={coverUrl} alt={title} fill sizes={`${size}px`} className="object-cover" />
      ) : null}
    </div>
  );
}
