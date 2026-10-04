import { Modal } from "@/components/ui/modal";
import { MediaDetail } from "@/components/media/media-detail";

export default async function MangaModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Modal>
      <MediaDetail anilistId={Number(id)} />
    </Modal>
  );
}
