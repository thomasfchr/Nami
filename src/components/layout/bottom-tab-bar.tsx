"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navLinks } from "./nav-links";

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-surface/95 backdrop-blur-md md:hidden"
    >
      <ul className="flex items-stretch justify-between">
        {navLinks.map((link) => {
          const active = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <li key={link.href} className="flex-1">
              <Link
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[11px] font-medium text-foreground-muted transition-colors",
                  active && "text-accent",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-5" />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
