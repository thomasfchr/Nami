import { ImageResponse } from "next/og";

/** Logo "N" sur fond rouge Nami, utilisé pour le favicon et les icônes PWA. */
export function renderAppIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#e50914",
        }}
      >
        <span
          style={{
            fontSize: Math.round(size * 0.58),
            fontWeight: 900,
            color: "#ffffff",
            fontFamily: "sans-serif",
            lineHeight: 1,
          }}
        >
          N
        </span>
      </div>
    ),
    { width: size, height: size },
  );
}
