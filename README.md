# HughLou

**Conference replay, powered by the AT Protocol.**

HughLou is an open-source conference video replay app. It pulls talk recordings from [Streamplace](https://stream.place) VOD via the AT Protocol, threads in Bluesky discussion as comments, and gives every talk a permanent, shareable URL.

Currently serving [ATmosphereConf 2026](https://hughlou.com) — three days of talks on decentralized identity, social networking, data sovereignty, and the open web from Vancouver, BC.

Built for the [Streamplace VOD JAM](https://blog.stream.place/3micfu6ifyk2a).

## Features

- Browse and search all conference talks by title, speaker, or Bluesky handle
- HLS video playback via [hls.js](https://github.com/video-dev/hls.js) with native Safari fallback
- Async thumbnail generation (captured from video frames, cached in localStorage)
- Bluesky comment threads — replies to the stream post and mentions of the talk URL appear as comments
- Speaker handles auto-linked to Bluesky profiles
- Share to Bluesky, copy link, or send via Messages
- Prev/next talk navigation
- WCAG-compliant: skip links, focus-visible outlines, proper contrast ratios, ARIA labels, reduced-motion support
- Fully responsive

## How It Works

1. Fetches `place.stream.video` records from the AT Protocol PDS via `com.atproto.repo.listRecords`
2. Resolves livestream metadata (speaker names, handles, thumbnails) from linked `place.stream.livestream` records
3. Plays HLS video streams using the Streamplace VOD beta endpoint (`vod-beta.stream.place`)
4. Pulls Bluesky post threads via `app.bsky.feed.getPostThread` and search via `app.bsky.feed.searchPosts` to populate discussion

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

HughLou is a standard Next.js app. Deploy to any platform that supports it:

**Vercel** (recommended):
```bash
npx vercel
```

**Netlify**, **Cloudflare Pages**, or any Node.js host — just run `npm run build` and serve the output.

## Tech Stack

- **Next.js 16** with App Router and Turbopack
- **TypeScript** in strict mode
- **Tailwind CSS v4** for styling
- **hls.js** for HLS video playback
- **AT Protocol** for data (via XRPC — no SDK required)
- **Bluesky API** for threaded comments

## Project Structure

```
src/
  app/
    layout.tsx       # Shell: header, footer, skip links
    page.tsx         # Home: talk grid with search, day grouping
    globals.css      # Tailwind + custom props + a11y styles
    watch/[rkey]/
      page.tsx       # Watch: video player, metadata, actions, comments
  components/
    VideoCard.tsx    # Talk card (grid + compact sidebar variants)
    VideoPlayer.tsx  # HLS player with poster, states, keyboard a11y
    BlueskyComments.tsx  # Threaded Bluesky discussion
    TranscriptPanel.tsx  # Experimental Web Speech API transcription
  lib/
    api.ts           # AT Protocol data fetching, parsing, formatting
    bluesky.ts       # Bluesky thread + search comment aggregation
    thumbnails.ts    # Async canvas-based thumbnail capture + caching
    transcription.ts # Web Speech API service
```

## Adapting for Another Conference

HughLou is built to replay Streamplace-powered conferences. To point it at a different one:

1. Update `REPO_DID` in `src/lib/api.ts` to the DID of the Streamplace account that recorded the conference
2. Update `DAY_LABELS` in `src/app/page.tsx` with the conference dates
3. Update branding in `src/app/layout.tsx`

## AI Disclosure

This project was built with the assistance of Claude (Anthropic) via Cowork mode.

## License

MIT — see [LICENSE](./LICENSE)

## Credits

A [@shellen.com](https://bsky.app/profile/shellen.com) project. Powered by [Streamplace](https://stream.place).
