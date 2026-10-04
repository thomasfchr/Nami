import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { searchAniList } from "@/lib/anilist/cache";

const querySchema = z.object({
  q: z.string().trim().min(1).max(100),
  type: z.enum(["ANIME", "MANGA"]).optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: searchParams.get("q") ?? "",
    type: searchParams.get("type") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ results: [] });
  }

  const { q, type } = parsed.data;
  const types = type ? [type] : (["ANIME", "MANGA"] as const);

  try {
    const resultsByType = await Promise.all(types.map((t) => searchAniList(q, t)));
    return NextResponse.json({ results: resultsByType.flat() });
  } catch (error) {
    console.error("Recherche AniList échouée", error);
    return NextResponse.json({ results: [], error: "search_failed" }, { status: 502 });
  }
}
