import type { Metadata } from "next"
import WatchClient from "./WatchClient"
import {
  listVideos,
  fetchLivestreamRecord,
  parseSpeaker,
  formatDuration,
  extractDid,
  resolvePds,
  getLivestreamThumbUrl,
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
    let thumbUrl: string | undefined
    if (video.livestream?.uri) {
      const ls = await fetchLivestreamRecord(video.livestream.uri)
      if (ls) {
        const parsed = parseSpeaker(ls.title)
        speaker = parsed.speaker

        if (ls.thumb?.ref?.$link) {
          const creatorDid = extractDid(video.livestream.uri)
          const pds = await resolvePds(creatorDid)
          if (pds) {
            thumbUrl = getLivestreamThumbUrl(creatorDid, ls.thumb.ref.$link, pds)
          }
        }
      }
    }

    const duration = formatDuration(video.duration)
    const description = speaker
      ? `${video.title} by ${speaker} (${duration}) — ATmosphereConf 2026 replay on HUGHLOU.`
      : `${video.title} (${duration}) — ATmosphereConf 2026 replay on HUGHLOU.`
    const url = `${SITE_URL}/watch/${rkey}`

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
        ...(thumbUrl ? { images: [{ url: thumbUrl, width: 1280, height: 720, alt: video.title }] } : {}),
      },
      twitter: {
        card: "summary_large_image",
        title: video.title,
        description,
        ...(thumbUrl ? { images: [thumbUrl] } : {}),
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
