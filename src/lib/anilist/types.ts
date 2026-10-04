export type AniListMediaType = "ANIME" | "MANGA";

export type AniListMediaStatus =
  | "FINISHED"
  | "RELEASING"
  | "NOT_YET_RELEASED"
  | "CANCELLED"
  | "HIATUS";

export type AniListTitle = {
  romaji: string | null;
  english: string | null;
  native: string | null;
};

export type AniListCoverImage = {
  extraLarge: string | null;
  large: string | null;
  color: string | null;
};

export type AniListExternalLink = {
  url: string;
  site: string;
  type: string | null;
  language: string | null;
  isDisabled: boolean | null;
};

export type AniListNextAiringEpisode = {
  airingAt: number;
  episode: number;
} | null;

export type AniListScheduleNode = {
  airingAt: number;
  episode: number;
};

export type AniListMedia = {
  id: number;
  type: AniListMediaType;
  format: string | null;
  status: AniListMediaStatus | null;
  season: string | null;
  seasonYear: number | null;
  episodes: number | null;
  chapters: number | null;
  duration: number | null;
  genres: string[];
  averageScore: number | null;
  popularity: number | null;
  studios: { nodes: { name: string }[] } | null;
  coverImage: AniListCoverImage | null;
  bannerImage: string | null;
  title: AniListTitle;
  description: string | null;
  nextAiringEpisode: AniListNextAiringEpisode;
  /** Présent uniquement pour les requêtes utilisant MEDIA_DETAIL_FRAGMENT (fiche série). */
  episodeSchedule?: { nodes: AniListScheduleNode[] } | null;
  externalLinks: AniListExternalLink[] | null;
};

export type AniListAiringScheduleEntry = {
  airingAt: number;
  episode: number;
  media: AniListMedia;
};
