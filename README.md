# HughLou

**Conference replay, powered by the AT Protocol.**

HughLou is an open-source conference video replay app. It pulls talk recordings from [Streamplace](https://stream.place) VOD via the AT Protocol, threads in Bluesky discussion as comments, and gives every talk a permanent, shareable URL.

Currently serving [ATmosphereConf 2026](https://hughlou.com/events/atmosphereconf2026) — three days of talks on decentralized identity, social networking, data sovereignty, and the open web from Vancouver, BC.

Built for the [Streamplace VOD JAM](https://blog.stream.place/3micfu6ifyk2a).

## Features

- **Event archive structure** — `/events/atmosphereconf2026/` with room for future events
- Browse and search all conference talks by title, speaker, or Bluesky handle
- HLS video playback via [hls.js](https://github.com/video-dev/hls.js) with native Safari fallback
- Memory-optimized video: capped HLS buffers (30 MB), back-buffer eviction, lazy-loaded thumbnails
- Thumbnails from livestream records with async canvas-capture fallback, cached in localStorage
- Bluesky comment threads — replies to the stream post and mentions of the talk URL appear as comments
- Speaker handles auto-linked to Bluesky profiles
- Share to Bluesky, copy link, or send via Messages
- **Watch Later queue** — save talks for later (stored locally, no account needed)
- **Live transcription** — experimental browser-based transcription using the Web Speech API (see below)
- Prev/next talk navigation with breadcrumb trail
- OpenGraph and Twitter card metadata for every talk
- WCAG-compliant: skip links, focus-visible outlines, proper contrast ratios, ARIA labels, reduced-motion support
- Fully responsive with a slate-toned dark theme
- **No tracking, analytics, or cookies** — zero third-party scripts

## Local-First Design

HughLou has no login system or server-side user state. Everything personal is stored in your browser's localStorage:

- **Watch Later queue** — saved talks persist across sessions in the same browser
- **Thumbnail cache** — captured video frames are stored locally to avoid re-fetching
- **Transcripts** — generated transcripts are cached so you only need to run them once

Clear your browser data to reset everything.

## Experimental: Live Transcription

The transcript feature uses the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API), a browser-native speech recognition service. It listens to your device's audio output while a talk plays and generates a time-stamped transcript in real time.

**Important caveats:**
- Browser support varies — works best in Chrome/Edge, limited in Firefox, not available in all browsers
- Accuracy depends on audio quality, speaker clarity, and ambient noise
- The browser may request microphone permission even though it's listening to playback audio
- Transcripts are cached locally after generation
- This is not a server-side transcription service — no audio leaves your device

## How It Works

1. Fetches `place.stream.video` records from the AT Protocol PDS via `com.atproto.repo.listRecords`
2. Resolves livestream metadata (speaker names, handles, thumbnails) from linked `place.stream.livestream` records
3. Plays HLS video streams directly from the Streamplace VOD server (`vod-beta.stream.place`) — no video bytes are proxied through the app
4. Pulls Bluesky post threads via `app.bsky.feed.getPostThread` to populate discussion

**Note:** Streamplace VOD is in beta. The VOD endpoint URL, XRPC method names, and response formats may change as encoding and infrastructure evolve on the stream.place side. If video playback breaks after an upstream change, check `VOD_PLAYBACK_URL` in `src/lib/api.ts`. Video AT URIs (`at://` identifiers) are stable — only the playback delivery layer is subject to change.

## Getting Started

```bash
git clone https://github.com/shellen/hughlou.git
cd hughlou
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to browse and watch talks.

No environment variables or API keys required — all data is fetched from public AT Protocol endpoints.

## Deploying

HughLou is a standard Next.js 16 app. Deploy to any platform that supports it.

### Vercel

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repo at [vercel.com/new](https://vercel.com/new) for automatic deploys on push.

### Netlify

The repo includes a `netlify.toml` config. Connect your GitHub repo at [app.netlify.com](https://app.netlify.com) or deploy via CLI:

```bash
npm i -g netlify-cli
netlify deploy --build --prod
```

### Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy .next --project-name hughlou
```

Or connect your GitHub repo in the [Cloudflare dashboard](https://dash.cloudflare.com) with:
- Build command: `npm run build`
- Build output directory: `.next`
- Node.js version: 20+

You may need the [`@cloudflare/next-on-pages`](https://github.com/cloudflare/next-on-pages) adapter for full Next.js compatibility.

### Self-Hosted / Docker

```bash
npm run build
npm start
```

Runs on port 3000 by default. Put behind nginx, Caddy, or any reverse proxy.

## Tech Stack

- **Next.js 16** with App Router and Turbopack
- **TypeScript** in strict mode
- **Tailwind CSS v4** for styling (slate dark theme)
- **hls.js** for HLS video playback
- **AT Protocol** for data (via XRPC — no SDK required)
- **Bluesky API** for threaded comments
- **Web Speech API** for experimental transcription

## Project Structure

```
src/
  app/
    layout.tsx                              # Shell: header, footer, skip links
    page.tsx                                # Redirect to current event
    globals.css                             # Tailwind + custom props + a11y styles
    events/atmosphereconf2026/
      layout.tsx                            # Event SEO metadata
      page.tsx                              # Event listing: talk grid, search, day grouping
    api/
      bsky/route.ts                         # Proxy for Bluesky public API (getPostThread)
    watch/[rkey]/
      page.tsx                              # Server wrapper with generateMetadata
      WatchClient.tsx                       # Watch: player, breadcrumb, actions, comments
  components/
    VideoCard.tsx                           # Talk card (grid + compact sidebar variants)
    VideoPlayer.tsx                         # HLS player with poster, states, keyboard a11y
    BlueskyComments.tsx                     # Threaded Bluesky discussion
    TranscriptPanel.tsx                     # Experimental Web Speech API transcription
    WatchLaterButton.tsx                    # Watch Later toggle
    WatchLaterQueue.tsx                     # Sidebar queue of saved talks
  hooks/
    useWatchLater.ts                        # React hooks for Watch Later state
  lib/
    api.ts                                  # AT Protocol data fetching, parsing, formatting
    bluesky.ts                              # Bluesky thread + search comment aggregation
    thumbnails.ts                           # Async canvas-based thumbnail capture + caching
    transcription.ts                        # Web Speech API service
    watchLater.ts                           # Watch Later localStorage management
```

## Adapting for Another Conference

HughLou is built to replay Streamplace-powered conferences. To add a new event:

1. Create a new route at `src/app/events/yourconf2027/`
2. Update `REPO_DID` in `src/lib/api.ts` to the DID of the Streamplace account that recorded the conference
3. Update `DAY_LABELS` with the conference dates
4. Update the redirect in `src/app/page.tsx` to point to the new event
5. Update branding in `src/app/layout.tsx`

Previous events remain accessible at their original URLs as archives.

### Tangled

[Tangled](https://tangled.org) is a git collaboration platform built on the AT Protocol. To mirror your repo there:

1. Sign in at [tangled.org](https://tangled.org) with your AT Protocol identity (Bluesky handle works)
2. Create a new repository
3. Add Tangled as a remote and push:
   ```bash
   git remote add tangled https://tangled.org/<your-handle>/hughlou.git
   git push tangled main
   ```

## VOD JAM Submission

This project was built for the [Streamplace VOD JAM](https://blog.stream.place/3micfu6ifyk2a).

- **Public endpoint:** [hughlou.com](https://hughlou.com)
- **Source:** [github.com/shellen/hughlou](https://github.com/shellen/hughlou)
- **License:** MIT

## AI Disclosure

This project was built with the assistance of Claude (Anthropic) via Claude Code.

## License

MIT — see [LICENSE](./LICENSE)

## Credits

A [@shellen.com](https://bsky.app/profile/shellen.com) project. Powered by [Streamplace](https://stream.place).
