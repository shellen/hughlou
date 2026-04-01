import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://hughlou.com"),
  title: {
    default: "HUGHLOU — Conference Replay",
    template: "%s — HUGHLOU",
  },
  description:
    "Open-source conference replay powered by AT Protocol and Streamplace.",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%230a0f1a' width='100' height='100' rx='20'/><text x='50' y='70' text-anchor='middle' fill='%232563eb' font-family='system-ui' font-weight='900' font-size='46'>HL</text></svg>",
        type: "image/svg+xml",
      },
    ],
  },
  openGraph: {
    siteName: "HUGHLOU",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <header className="sticky top-0 z-50 bg-[#0a0f1a]/90 backdrop-blur-md border-b border-[#1e293b]">
          <nav
            aria-label="Main navigation"
            className="max-w-[1400px] mx-auto px-6 h-16 flex items-center gap-6"
          >
            <a
              href="/"
              className="flex items-center gap-2.5 shrink-0 group"
              aria-label="HUGHLOU — Home"
            >
              <div
                className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center"
                aria-hidden="true"
              >
                <span className="text-white font-black text-[11px] leading-none tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  HL
                </span>
              </div>
              <span className="text-[15px] font-black text-white tracking-wide uppercase hidden sm:block" style={{ fontFamily: "'Outfit', sans-serif" }}>
                HUGH<span className="text-[#2563eb]">LOU</span>
              </span>
            </a>
            <div id="header-search" className="flex-1 max-w-md" role="search" />
          </nav>
        </header>
        <main id="main-content" className="min-h-screen">
          {children}
        </main>
        <footer className="border-t border-[#1e293b] py-8 mt-16">
          <div className="max-w-[1400px] mx-auto px-6 flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
              <p className="text-xs text-[#94a3b8] tracking-wide">
                ATmosphereConf 2026 &middot; Vancouver, BC &middot; March 28–30
              </p>
              <div className="flex items-center gap-4 text-xs text-[#94a3b8]">
                <span>
                  A{" "}
                  <a
                    href="https://bsky.app/profile/shellen.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#a0a0ff] hover:text-white transition-colors"
                  >
                    @shellen.com
                  </a>{" "}
                  project
                </span>
                <span className="text-[#1e293b]">|</span>
                <a
                  href="https://stream.place"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Powered by Streamplace
                </a>
                <span className="text-[#1e293b]">|</span>
                <a
                  href="https://github.com/shellen/hughlou"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Open Source
                </a>
              </div>
            </div>
            <p className="text-[10px] text-[#475569] text-center max-w-lg">
              HughLou is an independent, open-source project and is in no way affiliated with, endorsed by, or associated with{" "}
              <a href="https://stream.place" target="_blank" rel="noopener noreferrer" className="hover:text-[#94a3b8] transition-colors">Stream.place</a> or{" "}
              <a href="https://atmosphere.wtf" target="_blank" rel="noopener noreferrer" className="hover:text-[#94a3b8] transition-colors">ATmosphere Conf</a>.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
