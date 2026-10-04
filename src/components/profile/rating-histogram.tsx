import type { ProfileStats } from "@/lib/stats/profile";

export function RatingHistogram({ histogram }: { histogram: ProfileStats["histogram"] }) {
  const max = Math.max(1, ...histogram.map((bucket) => bucket.count));

  return (
    <div className="flex h-48 items-end gap-2">
      {histogram.map((bucket) => {
        const heightPct = (bucket.count / max) * 100;
        return (
          <div key={bucket.value} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] text-foreground-muted">{bucket.count || ""}</span>
            <div
              className="w-full rounded-t bg-accent/80"
              style={{ height: `${bucket.count ? Math.max(heightPct, 4) : 0}%` }}
              aria-label={`${bucket.count} note(s) de ${bucket.value}`}
            />
            <span className="text-[10px] text-foreground-muted">{bucket.value}</span>
          </div>
        );
      })}
    </div>
  );
}
