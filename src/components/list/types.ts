import type { ListStatus } from "@prisma/client";

export type ListEntryView = {
  id: string;
  status: ListStatus;
  progress: number;
  rating: number | null;
  liked: boolean;
  updatedAt: string;
  media: {
    anilistId: number;
    type: "ANIME" | "MANGA";
    titleRomaji: string;
    coverUrl: string | null;
    episodes: number | null;
    chapters: number | null;
  };
};

export type DiaryEntryView = {
  id: string;
  watchedAt: string;
  rating: number | null;
  review: string | null;
  spoiler: boolean;
  isRewatch: boolean;
  media: {
    anilistId: number;
    type: "ANIME" | "MANGA";
    titleRomaji: string;
    coverUrl: string | null;
  };
};
