import Link from "next/link";
import { getCurrentUserId } from "@/lib/list-entries";
import { getProfileStats } from "@/lib/stats/profile";
import { StatTile } from "@/components/profile/stat-tile";
import { RatingHistogram } from "@/components/profile/rating-histogram";

export const metadata = {
  title: "Profil — Nami",
};

export default async function ProfilPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-foreground-muted">Connecte-toi pour voir ton profil.</p>
        <Link
          href="/connexion"
          className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  const stats = await getProfileStats(userId);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl tracking-wide text-foreground">Mon profil</h1>
        <div className="flex gap-2">
          <Link
            href="/classement/top10"
            className="rounded-md bg-surface-elevated px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-border"
          >
            Partager mon top 10
          </Link>
          <Link
            href="/classement"
            className="rounded-md bg-surface-elevated px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-border"
          >
            Mon classement
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Séries suivies" value={String(stats.seriesTotal)} />
        <StatTile label="Terminées" value={String(stats.seriesCompleted)} />
        <StatTile label="Épisodes vus" value={String(stats.episodesWatched)} />
        <StatTile label="Heures" value={String(stats.hoursWatched)} />
        <StatTile label="Chapitres lus" value={String(stats.chaptersRead)} />
        <StatTile
          label="Note moyenne"
          value={stats.averageRating != null ? `${stats.averageRating.toFixed(1)} / 5` : "—"}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground">Répartition des notes</h2>
        {stats.ratingCount === 0 ? (
          <p className="text-sm text-foreground-muted">Aucune note pour l&apos;instant.</p>
        ) : (
          <RatingHistogram histogram={stats.histogram} />
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground">Genres préférés</h2>
        {stats.topGenres.length === 0 ? (
          <p className="text-sm text-foreground-muted">Ajoute des séries à ta liste pour voir tes genres.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {stats.topGenres.map((item) => (
              <span
                key={item.genre}
                className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent"
              >
                {item.genre} · {item.count}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
