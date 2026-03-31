import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "HughLou — ATmosphereConf 2026 Replay",
  description:
    "Every talk from ATmosphereConf 2026, on demand. Open-source conference replay powered by AT Protocol and Streamplace.",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%2309090b' width='100' height='100' rx='20'/><text x='50' y='70' text-anchor='middle' fill='%232563eb' font-family='system-ui' font-weight='900' font-size='46'>HL</text></svg>",
        type: "image/svg+xml",
      },
    ],
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <header className="sticky top-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-b border-[#1c1c1f]">
          <nav
            aria-label="Main navigation"
            className="max-w-[1400px] mx-auto px-6 h-16 flex items-center gap-6"
          >
            <a
              href="/"
              className="flex items-center gap-3 shrink-0 group"
              aria-label="HughLou — Home"
            >
              <div
                className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center"
                aria-hidden="true"
              >
                <span className="text-white font-black text-[11px] leading-none tracking-tight">
                  HL
                </span>
              </div>
              <span className="text-sm font-bold text-white tracking-tight hidden sm:block">
                Hugh<span className="text-[#2563eb]">Lou</span>
              </span>
            </a>
            <div id="header-search" className="flex-1 max-w-md" role="search" />
          </nav>
        </header>
        <main id="main-content" className="min-h-screen">
          {children}
        </main>
        <footer className="border-t border-[#1c1c1f] py-8 mt-16">
          <div className="max-w-[1400px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#8b8b96] tracking-wide">
              ATmosphereConf 2026 &middot; Vancouver, BC &middot; March 28–30
            </p>
            <div className="flex items-center gap-4 text-xs text-[#8b8b96]">
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
              <span className="text-[#1c1c1f]">|</span>
              <a
                href="https://stream.place"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Powered by Streamplace
              </a>
              <span className="text-[#1c1c1f]">|</span>
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
        </footer>
      </body>
    </html>
  )
}
