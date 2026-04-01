import { ImageResponse } from "next/og"

export const alt = "ATmosphereConf 2026 Replay — HUGHLOU"
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
          background: "linear-gradient(135deg, #0a0f1a 0%, #1e1b4b 50%, #0a0f1a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <span
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: "#ffffff",
            marginBottom: 12,
          }}
        >
          ATmosphereConf 2026
        </span>
        <span
          style={{
            fontSize: 32,
            color: "#94a3b8",
            marginBottom: 40,
          }}
        >
          Every talk, on demand
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            opacity: 0.7,
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "0.05em",
            }}
          >
            HUGH
          </span>
          <span
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: "#2563eb",
              letterSpacing: "0.05em",
            }}
          >
            LOU
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
