const PARIS_TZ = "Europe/Paris";

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

export const WEEKDAY_LABELS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

function parisDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { y: get("year"), m: get("month"), d: get("day"), weekday: get("weekday") };
}

/** Clé "YYYY-MM-DD" du jour calendaire à Paris pour un instant donné. */
export function parisDateKey(date: Date) {
  const { y, m, d } = parisDateParts(date);
  return `${y}-${m}-${d}`;
}

/** 7 jours glissants à partir d'aujourd'hui (Paris), décalés de `weekOffset` × 7 jours. */
export function getUpcomingDays(weekOffset = 0): Date[] {
  const { y, m, d } = parisDateParts(new Date());
  const todayUTCMidnight = Date.UTC(Number(y), Number(m) - 1, Number(d));
  const start = todayUTCMidnight + weekOffset * 7 * 86_400_000;
  return Array.from({ length: 7 }, (_, i) => new Date(start + i * 86_400_000));
}

/** Libellé français du jour (Paris) pour une date renvoyée par getUpcomingDays. */
export function dayLabelFor(date: Date) {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(date);
  const index = WEEKDAY_INDEX[weekday] ?? 0;
  return WEEKDAY_LABELS[index];
}

/** Les 7 dates (lundi→dimanche) de la semaine Paris courante, décalée de `weekOffset` semaines. */
export function getWeekDays(weekOffset = 0): Date[] {
  const { y, m, d, weekday } = parisDateParts(new Date());
  const todayUTCMidnight = Date.UTC(Number(y), Number(m) - 1, Number(d));
  const dow = WEEKDAY_INDEX[weekday] ?? 0;
  const mondayUTCMidnight = todayUTCMidnight - dow * 86_400_000 + weekOffset * 7 * 86_400_000;
  return Array.from({ length: 7 }, (_, i) => new Date(mondayUTCMidnight + i * 86_400_000));
}

/** Fenêtre [début, fin] en secondes Unix à interroger sur AniList pour couvrir toute la semaine à Paris. */
export function getQueryRangeForWeek(weekDays: Date[]) {
  const padMs = 4 * 60 * 60 * 1000; // marge pour couvrir CET/CEST sans calcul de décalage
  const start = Math.floor((weekDays[0].getTime() - padMs) / 1000);
  const end = Math.floor((weekDays[6].getTime() + 86_400_000 + padMs) / 1000);
  return { start, end };
}
