import Link from "next/link";
import { getCurrentUserId } from "@/lib/list-entries";
import { getMyRanking } from "@/lib/ranking/read";
import { ClassementView } from "@/components/ranking/classement-view";

export const metadata = {
  title: "Classement — Nami",
};

export default async function ClassementPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const userId = await getCurrentUserId();

  if (!userId) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-foreground-muted">Connecte-toi pour voir ton classement.</p>
        <Link
          href="/connexion"
          className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  const entries = await getMyRanking(userId);
  const initialType = type === "ANIME" || type === "MANGA" ? type : "ALL";

  return <ClassementView entries={entries} initialType={initialType} />;
}
