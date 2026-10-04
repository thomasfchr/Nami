"use client";

import { useState, useTransition } from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleMyList } from "@/lib/actions/list";

export function AddToListButton({
  anilistId,
  mediaType,
  initialInList,
  className,
}: {
  anilistId: number;
  mediaType: "ANIME" | "MANGA";
  initialInList: boolean;
  className?: string;
}) {
  const [inList, setInList] = useState(initialInList);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const optimistic = !inList;
    setInList(optimistic);
    startTransition(async () => {
      const result = await toggleMyList(anilistId, mediaType);
      if (!result.ok) {
        setInList(!optimistic);
        if (result.error === "unauthenticated") {
          window.location.href = "/connexion";
        }
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-2 rounded-md bg-surface-elevated px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-border disabled:opacity-60",
        className,
      )}
    >
      {inList ? <Check className="size-4" /> : <Plus className="size-4" />}
      {inList ? "Dans ma liste" : "Ma liste"}
    </button>
  );
}
