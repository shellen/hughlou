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
          background: "#0f172a",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* HUGHLOU wordmark */}
        <div style={{ display: "flex", alignItems: "baseline", marginBottom: 32 }}>
          <span
            style={{
              fontSize: 140,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            HUGH
          </span>
          <span
            style={{
              fontSize: 140,
              fontWeight: 900,
              color: "#2563eb",
              letterSpacing: "-0.02em",
            }}
          >
            LOU
          </span>
        </div>

        {/* Tagline in blue pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#2563eb",
            borderRadius: 16,
            padding: "14px 40px",
            marginBottom: 32,
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            Every Talk, On Demand
          </span>
        </div>

        {/* Subtitle */}
        <span
          style={{
            fontSize: 24,
            color: "#64748b",
          }}
        >
          Conference replays from the ATmosphere
        </span>
      </div>
    ),
    { ...size }
  )
}
