import type { Metadata } from "next"
import WatchClient from "./WatchClient"
import {
  listVideos,
  fetchLivestreamRecord,
  parseSpeaker,
  formatDuration,
} from "@/lib/api"

const SITE_URL = "https://hughlou.com"

interface PageProps {
  params: Promise<{ rkey: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { rkey } = await params

  try {
    const response = await listVideos()
    const videos = response.records.map((r) => ({ ...r.value, uri: r.uri }))
    const video = videos.find((v) => v.uri.endsWith(`/${rkey}`))

    if (!video) {
      return {
        title: "Talk Not Found — HUGHLOU",
      }
    }

    let speaker = ""
    if (video.livestream?.uri) {
      const ls = await fetchLivestreamRecord(video.livestream.uri)
      if (ls) {
        const parsed = parseSpeaker(ls.title)
        speaker = parsed.speaker
      }
    }

    const duration = formatDuration(video.duration)
    const description = speaker
      ? `${video.title} by ${speaker} (${duration}) — ATmosphereConf 2026 replay on HUGHLOU.`
      : `${video.title} (${duration}) — ATmosphereConf 2026 replay on HUGHLOU.`
    const url = `${SITE_URL}/events/atmosphereconf2026/watch/${rkey}`

    return {
      title: `${video.title} — HUGHLOU`,
      description,
      openGraph: {
        title: video.title,
        description,
        url,
        siteName: "HUGHLOU",
        type: "video.other",
        locale: "en_US",
      },
      twitter: {
        card: "summary_large_image",
        title: video.title,
        description,
      },
      alternates: {
        canonical: url,
      },
    }
  } catch {
    return {
      title: "HUGHLOU — ATmosphereConf 2026 Replay",
    }
  }
}

export default function WatchPage(props: PageProps) {
  return <WatchClient {...props} />
}
