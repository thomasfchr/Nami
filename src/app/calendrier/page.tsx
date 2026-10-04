import { getUpcomingDays, getQueryRangeForWeek, parisDateKey, dayLabelFor } from "@/lib/calendar/week";
import { getAiringInRange } from "@/lib/anilist/home";
import { getCurrentUserId } from "@/lib/list-entries";
import { prisma } from "@/lib/prisma";
import { CalendarWeekView, type CalendarDay } from "@/components/calendar/calendar-week-view";

export const metadata = {
  title: "Calendrier — Nami",
};

const DAY_NUMBER_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Paris",
});

export default async function CalendrierPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const weekOffset = week ? Number(week) || 0 : 0;

  // Résolu avant toute requête AniList (after()) : auth() ne peut plus être
  // appelé une fois after() planifié dans la requête.
  const userId = await getCurrentUserId();

  const weekDays = getUpcomingDays(weekOffset);
  const { start, end } = getQueryRangeForWeek(weekDays);

  // Appels Prisma séquentiels : la base Postgres locale de dev ne supporte
  // pas bien les connexions concurrentes.
  const airing = await getAiringInRange(start, end);
  const myEntries = userId
    ? await prisma.listEntry.findMany({
        where: { userId },
        select: { media: { select: { anilistId: true } } },
      })
    : [];
  const mangaOngoingEntries = userId
    ? await prisma.listEntry.findMany({
        where: {
          userId,
          status: { in: ["WATCHING", "PLANNING"] },
          media: { type: "MANGA", status: "RELEASING" },
        },
        include: { media: { select: { anilistId: true, titleRomaji: true } } },
      })
    : [];

  const myAnilistIds = myEntries.map((entry: { media: { anilistId: number } }) => entry.media.anilistId);

  const dayKeys = weekDays.map((d) => parisDateKey(d));
  const byDayKey = new Map(dayKeys.map((k) => [k, [] as typeof airing]));
  for (const item of airing) {
    const key = parisDateKey(new Date(item.airingAt * 1000));
    byDayKey.get(key)?.push(item);
  }

  const todayKey = parisDateKey(new Date());

  const days: CalendarDay[] = weekDays.map((date, i) => ({
    key: dayKeys[i],
    label: dayLabelFor(date),
    dayNumber: DAY_NUMBER_FORMATTER.format(date),
    isToday: dayKeys[i] === todayKey,
    isPast: dayKeys[i] < todayKey,
    items: (byDayKey.get(dayKeys[i]) ?? []).sort((a, b) => a.airingAt - b.airingAt),
  }));

  const mangaOngoing = mangaOngoingEntries.map((e) => ({
    anilistId: e.media.anilistId,
    title: e.media.titleRomaji,
  }));

  return (
    <CalendarWeekView
      days={days}
      myAnilistIds={myAnilistIds}
      weekOffset={weekOffset}
      mangaOngoing={mangaOngoing}
    />
  );
}
