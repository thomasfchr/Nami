import Link from "next/link";
import { Search } from "lucide-react";

export function MobileHeader() {
  return (
    <header className="pt-safe sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md md:hidden">
      <Link href="/" className="font-display text-xl tracking-wide text-accent">
        NAMI
      </Link>
      <div className="flex items-center gap-1">
        <Link
          href="/recherche"
          aria-label="Rechercher"
          className="flex size-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-surface-elevated hover:text-foreground"
        >
          <Search className="size-5" />
        </Link>
        <Link
          href="/profil"
          aria-label="Mon profil"
          className="flex size-9 items-center justify-center rounded-md bg-accent/90 text-sm font-semibold text-accent-foreground"
        >
          N
        </Link>
      </div>
    </header>
  );
}
