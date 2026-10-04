import Link from "next/link";
import { getCurrentUserId } from "@/lib/list-entries";
import { getTop10 } from "@/lib/ranking/read";

export const metadata = {
  title: "Mon Top 10 — Nami",
};

export default async function Top10Page() {
  const userId = await getCurrentUserId();
  const top10 = await getTop10(userId);

  if (top10.length === 0) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 px-6 py-20 text-center">
        <p className="text-foreground-muted">
          Classe au moins une série pour générer ton image de partage.
        </p>
        <Link
          href="/classement"
          className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Voir mon classement
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-10 text-center">
      <h1 className="font-display text-2xl tracking-wide text-foreground">Mon Top 10</h1>
      <p className="text-sm text-foreground-muted">
        Fais un clic droit sur l&apos;image (ou appuie dessus) pour l&apos;enregistrer et la
        partager.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/classement/top10/opengraph-image"
        alt="Mon Top 10"
        width={1200}
        height={630}
        className="w-full rounded-lg border border-border"
      />
      <Link href="/classement" className="text-sm font-medium text-foreground-muted hover:text-foreground">
        ← Retour au classement
      </Link>
    </div>
  );
}
