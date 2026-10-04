import { ImageResponse } from "next/og";
import { getCurrentUserId } from "@/lib/list-entries";
import { getTop10 } from "@/lib/ranking/read";

export const runtime = "nodejs";
export const alt = "Mon Top 10 — Nami";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Top10Image() {
  const userId = await getCurrentUserId();
  const top10 = await getTop10(userId);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#141414",
          padding: "56px 64px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span style={{ fontSize: 40, fontWeight: 900, color: "#E50914", letterSpacing: 2 }}>
            NAMI
          </span>
          <span style={{ fontSize: 28, color: "#f5f5f1" }}>Mon Top 10</span>
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 48, flexWrap: "wrap" }}>
          {top10.map((entry) => (
            <div
              key={entry.anilistId}
              style={{
                display: "flex",
                flexDirection: "column",
                width: 168,
              }}
            >
              <div
                style={{
                  display: "flex",
                  position: "relative",
                  width: 168,
                  height: 252,
                  borderRadius: 8,
                  overflow: "hidden",
                  backgroundColor: "#2a2a2a",
                }}
              >
                {entry.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.coverUrl}
                    alt=""
                    width={168}
                    height={252}
                    style={{ objectFit: "cover" }}
                  />
                ) : null}
                <div
                  style={{
                    display: "flex",
                    position: "absolute",
                    top: 6,
                    left: 6,
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    backgroundColor: "rgba(20,20,20,0.85)",
                    color: "#f5f5f1",
                    fontSize: 14,
                    fontWeight: 700,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {entry.rank}
                </div>
              </div>
              <span
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  color: "#f5f5f1",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {entry.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
