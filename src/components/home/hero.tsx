import Image from "next/image";
import Link from "next/link";
import { Info } from "lucide-react";
import type { MediaCardData } from "@/lib/anilist/cache";
import { Countdown } from "@/components/media/countdown";
import { AddToListButton } from "@/components/media/add-to-list-button";

function stripHtml(html: string) {
  return html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "");
}

export function Hero({ media, inList }: { media: MediaCardData; inList: boolean }) {
  const href = `/${media.type === "ANIME" ? "anime" : "manga"}/${media.anilistId}`;
  const watchLink =
    media.streamingLinks.find((link) => link.isFree) ?? media.streamingLinks[0] ?? null;

  return (
    <section className="relative flex h-[60vh] min-h-[420px] w-full items-end overflow-hidden md:h-[70vh]">
      {media.bannerUrl ? (
        <Image
          src={media.bannerUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : media.coverUrl ? (
        <>
          <Image
            src={media.coverUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="scale-110 object-cover blur-2xl"
          />
          <div className="absolute inset-0 bg-background/40" />
        </>
      ) : (
        <div className="absolute inset-0 bg-surface" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/20 to-transparent" />

      <div className="relative z-10 flex max-w-xl flex-col gap-4 px-6 pb-10 md:px-8 md:pb-14">
        <h1 className="font-display text-4xl leading-tight tracking-wide text-foreground drop-shadow-sm md:text-5xl">
          {media.title}
        </h1>

        {media.nextAiringAt && (
          <p className="text-sm font-medium text-foreground-muted">
            {media.type === "ANIME" ? "Épisode" : "Chapitre"} {media.nextEpisode} dans{" "}
            <Countdown targetUnixSeconds={media.nextAiringAt} />
          </p>
        )}

        {media.synopsis && (
          <p className="line-clamp-3 text-sm text-foreground-muted md:text-base">
            {stripHtml(media.synopsis)}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {watchLink && (
            <a
              href={watchLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Regarder sur {watchLink.site}
            </a>
          )}

          <AddToListButton
            anilistId={media.anilistId}
            mediaType={media.type}
            initialInList={inList}
          />

          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold text-foreground-muted transition-colors hover:text-foreground"
          >
            <Info className="size-4" />
            Plus d&apos;infos
          </Link>
        </div>
      </div>
    </section>
  );
}
