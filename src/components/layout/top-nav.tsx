"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { navLinks } from "./nav-links";

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="pt-safe sticky top-0 z-40 hidden w-full border-b border-border/60 bg-background/80 backdrop-blur-md md:block">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-8 px-8">
        <Link
          href="/"
          className="font-display text-2xl tracking-wide text-accent"
        >
          NAMI
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground",
                  active && "text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/recherche"
            aria-label="Rechercher"
            className="flex size-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-surface-elevated hover:text-foreground"
          >
            <Search className="size-5" />
          </Link>
          <ThemeToggle />
          <Link
            href="/profil"
            aria-label="Mon profil"
            className="ml-1 flex size-8 items-center justify-center rounded-md bg-accent/90 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent"
          >
            N
          </Link>
        </div>
      </div>
    </header>
  );
}
