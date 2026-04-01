import type { Metadata } from "next"

const SITE_URL = "https://hughlou.com"

export const metadata: Metadata = {
  title: "ATmosphereConf 2026 Replay — HUGHLOU",
  description:
    "Every talk from ATmosphereConf 2026 in Vancouver, on demand. Three days of workshops, demos, and deep dives — powered by AT Protocol and Streamplace.",
  openGraph: {
    title: "ATmosphereConf 2026 Replay — HUGHLOU",
    description:
      "Every talk from ATmosphereConf 2026 in Vancouver, on demand. Three days of workshops, demos, and deep dives.",
    url: `${SITE_URL}/events/atmosphereconf2026`,
    siteName: "HUGHLOU",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ATmosphereConf 2026 Replay — HUGHLOU",
    description:
      "Every talk from ATmosphereConf 2026 in Vancouver, on demand.",
  },
  alternates: {
    canonical: `${SITE_URL}/events/atmosphereconf2026`,
  },
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
