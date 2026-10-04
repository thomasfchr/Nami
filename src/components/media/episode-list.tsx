import type { Media } from "@prisma/client";
import { Countdown } from "@/components/media/countdown";

type ScheduleNode = { episode: number; airingAt: number };

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function parseSchedule(raw: Media["episodeSchedule"]): ScheduleNode[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (node): node is ScheduleNode =>
        typeof node === "object" &&
        node !== null &&
        typeof (node as ScheduleNode).episode === "number" &&
        typeof (node as ScheduleNode).airingAt === "number",
    )
    .sort((a, b) => a.episode - b.episode);
}

export function EpisodeList({
  media,
  watchedCount,
}: {
  media: Media;
  watchedCount: number;
}) {
  if (media.type !== "ANIME") return null;

  const schedule = parseSchedule(media.episodeSchedule);

  if (schedule.length === 0) {
    return null;
  }

  const now = Date.now();

  return (
    <div className="mt-10 flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-foreground">Épisodes</h2>
      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
        {schedule.map((node) => {
          const airingMs = node.airingAt * 1000;
          const isAired = airingMs <= now;
          const isWatched = node.episode <= watchedCount;

          return (
            <div
              key={node.episode}
              className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
            >
              <div className="flex flex-col">
                <span className="font-medium text-foreground">Épisode {node.episode}</span>
                <span className="text-xs text-foreground-muted">
                  {DATE_FORMATTER.format(new Date(airingMs))}
                </span>
              </div>

              <span className="shrink-0 text-xs font-medium text-foreground-muted">
                {isWatched ? (
                  <span className="text-accent">Vu</span>
                ) : isAired ? (
                  "Disponible"
                ) : (
                  <Countdown targetUnixSeconds={node.airingAt} />
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
