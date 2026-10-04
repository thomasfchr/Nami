import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, getMyListEntry } from "@/lib/list-entries";
import { RankingFlow } from "@/components/ranking/ranking-flow";

export default async function ComparerPage({
  params,
}: {
  params: Promise<{ anilistId: string }>;
}) {
  const { anilistId: anilistIdParam } = await params;
  const anilistId = Number(anilistIdParam);

  const userId = await getCurrentUserId();
  if (!userId) notFound();

  const media = await prisma.media.findUnique({ where: { anilistId } });
  const listEntry = await getMyListEntry(userId, anilistId);

  if (!media || !listEntry || listEntry.status !== "COMPLETED") notFound();

  return (
    <RankingFlow
      anilistId={media.anilistId}
      mediaType={media.type}
      title={media.titleRomaji}
      coverUrl={media.coverUrl}
    />
  );
}
