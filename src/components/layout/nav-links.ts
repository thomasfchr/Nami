import type { LucideIcon } from "lucide-react";
import { CalendarDays, Clapperboard, ListVideo, Trophy, BookOpen } from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navLinks: NavLink[] = [
  { href: "/anime", label: "Anime", icon: Clapperboard },
  { href: "/manga", label: "Manga", icon: BookOpen },
  { href: "/calendrier", label: "Calendrier", icon: CalendarDays },
  { href: "/ma-liste", label: "Ma liste", icon: ListVideo },
  { href: "/classement", label: "Classement", icon: Trophy },
];
