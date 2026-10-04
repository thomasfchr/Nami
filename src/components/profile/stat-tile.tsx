export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</span>
      <span className="font-display text-3xl tracking-wide text-foreground">{value}</span>
    </div>
  );
}
