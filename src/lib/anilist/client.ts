import "server-only";

const ANILIST_API_URL = process.env.ANILIST_API_URL ?? "https://graphql.anilist.co";

// AniList autorise 90 requêtes/min ; on garde une marge pour les pics concurrents.
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 80;
const requestTimestamps: number[] = [];

export class AniListError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "AniListError";
    this.status = status;
  }
}

async function waitForRateLimitSlot() {
  for (;;) {
    const now = Date.now();
    while (requestTimestamps.length && now - requestTimestamps[0] > WINDOW_MS) {
      requestTimestamps.shift();
    }
    if (requestTimestamps.length < MAX_REQUESTS_PER_WINDOW) {
      requestTimestamps.push(now);
      return;
    }
    const waitMs = WINDOW_MS - (now - requestTimestamps[0]) + 10;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

export async function anilistFetch<TData>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<TData> {
  await waitForRateLimitSlot();

  const response = await fetch(ANILIST_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after") ?? "2");
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return anilistFetch<TData>(query, variables);
  }

  const json: { data?: TData; errors?: { message: string }[] } = await response.json();

  if (!response.ok || json.errors) {
    const message =
      json.errors?.[0]?.message ?? `Requête AniList échouée (statut ${response.status})`;
    throw new AniListError(message, response.status);
  }

  return json.data as TData;
}
