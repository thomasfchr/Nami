"use client";

import { useEffect, useState } from "react";

function formatRemaining(targetMs: number) {
  const diff = Math.max(0, targetMs - Date.now());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds, done: diff <= 0 };
}

export function Countdown({ targetUnixSeconds }: { targetUnixSeconds: number }) {
  const targetMs = targetUnixSeconds * 1000;
  // null tant qu'on n'a pas hydraté : évite un mismatch SSR/client (Date.now() diffère).
  const [remaining, setRemaining] = useState<ReturnType<typeof formatRemaining> | null>(null);

  useEffect(() => {
    setRemaining(formatRemaining(targetMs));
    const interval = setInterval(() => setRemaining(formatRemaining(targetMs)), 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  if (!remaining) {
    return <span className="tabular-nums">--:--:--</span>;
  }

  if (remaining.done) {
    return <span>Épisode disponible</span>;
  }

  return (
    <span className="tabular-nums">
      {remaining.days > 0 && `${remaining.days}j `}
      {String(remaining.hours).padStart(2, "0")}:{String(remaining.minutes).padStart(2, "0")}:
      {String(remaining.seconds).padStart(2, "0")}
    </span>
  );
}
