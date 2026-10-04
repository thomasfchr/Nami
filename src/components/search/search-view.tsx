"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaSearchResult } from "@/lib/anilist/cache";

type TypeFilter = "ALL" | "ANIME" | "MANGA";

const FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "ANIME", label: "Anime" },
  { value: "MANGA", label: "Manga" },
];

const DEBOUNCE_MS = 300;

export function SearchView() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TypeFilter>("ALL");
  const [results, setResults] = useState<MediaSearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setStatus("idle");
      abortRef.current?.abort();
      return;
    }

    const timeout = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("loading");

      const params = new URLSearchParams({ q: trimmed });
      if (filter !== "ALL") params.set("type", filter);

      fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data: { results: MediaSearchResult[] }) => {
          setResults(data.results ?? []);
          setStatus("done");
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setStatus("error");
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [query, filter]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8 md:px-8">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
        <SearchIcon className="size-5 shrink-0 text-foreground-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Chercher un anime ou un manga…"
          autoFocus
          className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-foreground-muted"
        />
      </div>

      <div className="flex gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={cn(
              "rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground-muted transition-colors",
              filter === item.value && "border-accent bg-accent/15 text-accent",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {status === "loading" && (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-2/3 animate-pulse rounded-lg bg-surface-elevated" />
          ))}
        </div>
      )}

      {status === "error" && (
        <p className="text-sm text-foreground-muted">
          La recherche AniList est momentanément indisponible. Réessaie dans un instant.
        </p>
      )}

      {status === "done" && results.length === 0 && (
        <p className="text-sm text-foreground-muted">
          Aucun résultat pour « {query.trim()} ».
        </p>
      )}

      {status === "done" && results.length > 0 && (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {results.map((media) => (
            <Link
              key={`${media.type}-${media.anilistId}`}
              href={`/${media.type === "ANIME" ? "anime" : "manga"}/${media.anilistId}`}
              className="group flex flex-col gap-2"
            >
              <div className="aspect-2/3 overflow-hidden rounded-lg bg-surface-elevated">
                {media.coverUrl ? (
                  <Image
                    src={media.coverUrl}
                    alt={media.title}
                    width={200}
                    height={300}
                    className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <span className="line-clamp-2 text-xs font-medium text-foreground">
                {media.title}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
