"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ListEntryCard } from "./list-entry-card";
import { DiaryRow } from "./diary-row";
import type { ListEntryView, DiaryEntryView } from "./types";

type Tab = "ALL" | "WATCHING" | "PLANNING" | "COMPLETED" | "DROPPED" | "JOURNAL";

const TABS: { value: Tab; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "WATCHING", label: "En cours" },
  { value: "PLANNING", label: "À voir" },
  { value: "COMPLETED", label: "Terminé" },
  { value: "DROPPED", label: "Abandonné" },
  { value: "JOURNAL", label: "Journal" },
];

export function MyListView({
  entries,
  diary,
}: {
  entries: ListEntryView[];
  diary: DiaryEntryView[];
}) {
  const [tab, setTab] = useState<Tab>("ALL");

  const filtered = useMemo(() => {
    if (tab === "ALL" || tab === "JOURNAL") return entries;
    return entries.filter((entry) => entry.status === tab);
  }, [entries, tab]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:px-8">
      <h1 className="font-display text-3xl tracking-wide text-foreground">Ma liste</h1>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setTab(item.value)}
            className={cn(
              "rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground-muted transition-colors",
              tab === item.value && "border-accent bg-accent/15 text-accent",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "JOURNAL" ? (
        diary.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            Ton journal se remplit automatiquement quand tu termines une série.
          </p>
        ) : (
          <div className="flex flex-col">
            {diary.map((entry) => (
              <DiaryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        <p className="text-sm text-foreground-muted">Rien ici pour l&apos;instant.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {filtered.map((entry) => (
            <ListEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
