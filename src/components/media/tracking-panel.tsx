"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart, ListOrdered, Minus, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { ListStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/media/star-rating";
import {
  setListStatus,
  updateProgress,
  setRating,
  toggleLiked,
  setReview,
  startRewatch,
  toggleMyList,
} from "@/lib/actions/list";

type MediaType = "ANIME" | "MANGA";

type EntryState = {
  status: ListStatus;
  progress: number;
  rating: number | null;
  liked: boolean;
  review: string;
  spoiler: boolean;
};

const STATUS_OPTIONS: { value: ListStatus; label: string }[] = [
  { value: "PLANNING", label: "À voir" },
  { value: "WATCHING", label: "En cours" },
  { value: "COMPLETED", label: "Terminé" },
  { value: "DROPPED", label: "Abandonné" },
];

export function TrackingPanel({
  anilistId,
  mediaType,
  totalCount,
  initialEntry,
  isRanked,
}: {
  anilistId: number;
  mediaType: MediaType;
  totalCount: number | null;
  initialEntry: EntryState | null;
  isRanked: boolean;
}) {
  const [entry, setEntry] = useState(initialEntry);
  const [reviewDraft, setReviewDraft] = useState(initialEntry?.review ?? "");
  const [spoilerDraft, setSpoilerDraft] = useState(initialEntry?.spoiler ?? false);
  const [isPending, startTransition] = useTransition();

  const unit = mediaType === "ANIME" ? "épisode" : "chapitre";

  function handleJoinList() {
    setEntry({
      status: "PLANNING",
      progress: 0,
      rating: null,
      liked: false,
      review: "",
      spoiler: false,
    });
    startTransition(async () => {
      const result = await toggleMyList(anilistId, mediaType);
      if (!result.ok) {
        setEntry(null);
        if (result.error === "unauthenticated") window.location.href = "/connexion";
      }
    });
  }

  function handleRemove() {
    const previous = entry;
    setEntry(null);
    startTransition(async () => {
      const result = await toggleMyList(anilistId, mediaType);
      if (!result.ok) setEntry(previous);
    });
  }

  function handleStatusChange(status: ListStatus) {
    if (!entry) return;
    const previous = entry;
    setEntry({ ...entry, status });
    startTransition(async () => {
      const result = await setListStatus(anilistId, mediaType, status);
      if (!result.ok) setEntry(previous);
    });
  }

  function handleProgress(delta: 1 | -1) {
    if (!entry) return;
    const previous = entry;
    const optimisticProgress = Math.min(
      Math.max(entry.progress + delta, 0),
      totalCount ?? Number.POSITIVE_INFINITY,
    );
    setEntry({
      ...entry,
      progress: optimisticProgress,
      status: entry.progress === 0 && delta === 1 ? "WATCHING" : entry.status,
    });
    startTransition(async () => {
      const result = await updateProgress(anilistId, mediaType, delta);
      if (!result.ok) setEntry(previous);
    });
  }

  function handleRating(rating: number) {
    if (!entry) return;
    const previous = entry;
    setEntry({ ...entry, rating });
    startTransition(async () => {
      const result = await setRating(anilistId, rating);
      if (!result.ok) setEntry(previous);
    });
  }

  function handleLiked() {
    if (!entry) return;
    const previous = entry;
    setEntry({ ...entry, liked: !entry.liked });
    startTransition(async () => {
      const result = await toggleLiked(anilistId);
      if (!result.ok) setEntry(previous);
    });
  }

  function handleSaveReview() {
    startTransition(async () => {
      const result = await setReview(anilistId, reviewDraft, spoilerDraft);
      if (result.ok && entry) {
        setEntry({ ...entry, review: reviewDraft.trim(), spoiler: spoilerDraft });
      }
    });
  }

  function handleRewatch() {
    if (!entry) return;
    const previous = entry;
    setEntry({ ...entry, status: "WATCHING", progress: 0 });
    startTransition(async () => {
      const result = await startRewatch(anilistId, mediaType);
      if (!result.ok) setEntry(previous);
    });
  }

  if (!entry) {
    return (
      <button
        type="button"
        onClick={handleJoinList}
        disabled={isPending}
        className="inline-flex w-fit items-center gap-2 rounded-md bg-surface-elevated px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-border disabled:opacity-60"
      >
        <Plus className="size-4" />
        Ajouter à ma liste
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleStatusChange(option.value)}
            className={cn(
              "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors",
              entry.status === option.value && "border-accent bg-accent/15 text-accent",
            )}
          >
            {option.label}
          </button>
        ))}

        <button
          type="button"
          onClick={handleRemove}
          aria-label="Retirer de ma liste"
          className="ml-auto flex size-8 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {entry.status === "COMPLETED" ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRewatch}
            className="inline-flex w-fit items-center gap-2 rounded-md bg-surface-elevated px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-border"
          >
            <RotateCcw className="size-4" />
            Revoir
          </button>
          <Link
            href={`/classement/comparer/${anilistId}`}
            className="inline-flex w-fit items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
          >
            <ListOrdered className="size-4" />
            {isRanked ? "Reclasser" : "Classer"}
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleProgress(-1)}
            aria-label={`${unit} précédent`}
            disabled={entry.progress <= 0}
            className="flex size-8 items-center justify-center rounded-full bg-surface-elevated text-foreground transition-colors hover:bg-border disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-[5rem] text-center text-sm font-medium text-foreground">
            {entry.progress} / {totalCount ?? "?"}
          </span>
          <button
            type="button"
            onClick={() => handleProgress(1)}
            aria-label={`${unit} suivant`}
            disabled={totalCount != null && entry.progress >= totalCount}
            className="flex size-8 items-center justify-center rounded-full bg-surface-elevated text-foreground transition-colors hover:bg-border disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <StarRating value={entry.rating ?? 0} onChange={handleRating} />
        <button
          type="button"
          onClick={handleLiked}
          aria-label="Coup de cœur"
          aria-pressed={entry.liked}
          className={cn(
            "flex size-9 items-center justify-center rounded-full transition-colors hover:bg-surface-elevated",
            entry.liked ? "text-accent" : "text-foreground-muted",
          )}
        >
          <Heart className="size-5" fill={entry.liked ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <textarea
          value={reviewDraft}
          onChange={(e) => setReviewDraft(e.target.value)}
          placeholder="Ta critique (optionnel)…"
          rows={3}
          className="resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground-muted focus:border-accent"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-foreground-muted">
            <input
              type="checkbox"
              checked={spoilerDraft}
              onChange={(e) => setSpoilerDraft(e.target.checked)}
              className="size-3.5 accent-accent"
            />
            Contient des spoilers
          </label>
          <button
            type="button"
            onClick={handleSaveReview}
            disabled={isPending}
            className="rounded-md bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-border disabled:opacity-60"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
