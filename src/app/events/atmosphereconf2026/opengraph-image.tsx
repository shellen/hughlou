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
          background: "#0f172a",
          fontFamily: "system-ui, sans-serif",
          padding: 0,
        }}
      >
        {/* Top bar with HUGHLOU branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "24px 48px",
          }}
        >
          <span style={{ fontSize: 28, fontWeight: 900, color: "#ffffff", letterSpacing: "0.05em" }}>HUGH</span>
          <span style={{ fontSize: 28, fontWeight: 900, color: "#2563eb", letterSpacing: "0.05em" }}>LOU</span>
        </div>

        {/* Main banner area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "0 48px",
          }}
        >
          {/* ATMOSPHERE - big text */}
          <div
            style={{
              display: "flex",
              background: "#1e293b",
              borderRadius: "24px 24px 0 0",
              padding: "48px 56px 16px",
            }}
          >
            <span
              style={{
                fontSize: 120,
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 0.9,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
              }}
            >
              ATMOSPHERE
            </span>
          </div>

          {/* CONF + VANCOUVER 2026 split row */}
          <div style={{ display: "flex", height: 120 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#1e293b",
                padding: "0 56px 0 56px",
              }}
            >
              <span
                style={{
                  fontSize: 80,
                  fontWeight: 900,
                  color: "#ffffff",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                }}
              >
                CONF
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#2563eb",
                flex: 1,
                padding: "0 56px",
                borderRadius: "24px 0 0 0",
              }}
            >
              <span
                style={{
                  fontSize: 80,
                  fontWeight: 900,
                  color: "#ffffff",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                }}
              >
                VANCOUVER · 2026
              </span>
            </div>
          </div>
        </div>

        {/* Bottom info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 48px 32px",
          }}
        >
          <span style={{ fontSize: 24, color: "#94a3b8" }}>
            Every talk, on demand — 3 days of workshops, demos, and deep dives
          </span>
          <span style={{ fontSize: 20, color: "#475569", fontFamily: "monospace" }}>
            hughlou.com
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
