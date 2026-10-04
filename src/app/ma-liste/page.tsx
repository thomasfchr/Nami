import Link from "next/link";
import { getCurrentUserId, getAllListEntries, getDiaryEntries } from "@/lib/list-entries";
import { MyListView } from "@/components/list/my-list-view";
import type { ListEntryView, DiaryEntryView } from "@/components/list/types";

export const metadata = {
  title: "Ma liste — Nami",
};

export default async function MaListePage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-foreground-muted">Connecte-toi pour voir ta liste.</p>
        <Link
          href="/connexion"
          className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  const rawEntries = await getAllListEntries(userId);
  const rawDiary = await getDiaryEntries(userId);

  const entries: ListEntryView[] = rawEntries.map((entry) => ({
    id: entry.id,
    status: entry.status,
    progress: entry.progress,
    rating: entry.rating != null ? Number(entry.rating) : null,
    liked: entry.liked,
    updatedAt: entry.updatedAt.toISOString(),
    media: {
      anilistId: entry.media.anilistId,
      type: entry.media.type,
      titleRomaji: entry.media.titleRomaji,
      coverUrl: entry.media.coverUrl,
      episodes: entry.media.episodes,
      chapters: entry.media.chapters,
    },
  }));

  const diary: DiaryEntryView[] = rawDiary.map((entry) => ({
    id: entry.id,
    watchedAt: entry.watchedAt.toISOString(),
    rating: entry.rating != null ? Number(entry.rating) : null,
    review: entry.review,
    spoiler: entry.spoiler,
    isRewatch: entry.isRewatch,
    media: {
      anilistId: entry.media.anilistId,
      type: entry.media.type,
      titleRomaji: entry.media.titleRomaji,
      coverUrl: entry.media.coverUrl,
    },
  }));

  return <MyListView entries={entries} diary={diary} />;
}
