import { ImageResponse } from "next/og"

export const alt = "HUGHLOU — Conference Replay"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0f1a 0%, #0f172a 50%, #0a0f1a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "0.05em",
            }}
          >
            HUGH
          </span>
          <span
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: "#2563eb",
              letterSpacing: "0.05em",
            }}
          >
            LOU
          </span>
        </div>
        <span
          style={{
            fontSize: 28,
            color: "#94a3b8",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Conference Replay
        </span>
      </div>
    ),
    { ...size }
  )
}
