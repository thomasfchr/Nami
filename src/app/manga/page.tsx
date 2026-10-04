import { CatalogueHome } from "@/components/home/catalogue-home";

export const metadata = {
  title: "Manga — Nami",
};

export default function MangaPage() {
  return <CatalogueHome type="MANGA" />;
}
