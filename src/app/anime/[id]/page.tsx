import { MediaDetail } from "@/components/media/media-detail";

export default async function AnimeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MediaDetail anilistId={Number(id)} />;
}
