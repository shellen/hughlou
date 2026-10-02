const REPO_DID = "did:plc:rbvrr34edl5ddpuwcubjiost"
const VOD_PLAYBACK_URL = `https://vod-beta.stream.place/xrpc/place.stream.playback.getVideoPlaylist`

// Cached PDS URL — resolved once from plc.directory, then reused.
// istream does this too: they resolve the PDS dynamically instead of hardcoding it,
// so video listing keeps working if the PDS migrates.
let resolvedPdsUrl: string | null = null

async function getRepoPdsUrl(): Promise<string> {
  if (resolvedPdsUrl) return resolvedPdsUrl
  const pds = await resolvePds(REPO_DID)
  if (pds) {
    resolvedPdsUrl = pds
    return pds
  }
  // Fallback to known PDS if resolution fails
  return "https://iameli.com"
}

export interface VideoRecord {
  $type: string
  title: string
  source: {
    ref: string
    size: number
    $type: string
    mimeType: string
  }
  creator: string
  duration: number // nanoseconds
  createdAt: string // ISO date
  livestream?: {
    cid: string
    uri: string
  }
  thumbUrl?: string
  uri: string // at://did:plc:.../place.stream.video/{rkey}
}

interface BlobRef {
  ref: { $link: string }
  size: number
  $type: string
  mimeType: string
}

// A place.stream.video record as stored on the PDS. Older records are
// standalone videos linked to a livestream; newer ones are clips of a
// full-day room recording with the thumbnail on the record itself.
export interface RawVideoRecord {
  $type: string
  title: string
  source?: {
    $type?: string
    size?: number
    ref?: unknown
    mimeType?: string
    video?: string // sourceClip: at:// URI of the full recording
    start?: number // sourceClip: ms into the full recording
    end?: number
  }
  creator?: string
  duration?: number // nanoseconds (old records)
  durationMs?: number // milliseconds (new records)
  createdAt: string
  livestream?: { cid: string; uri: string }
  thumb?: BlobRef
}

// Map either record shape onto VideoRecord
export function normalizeVideo(value: RawVideoRecord, uri: string, pdsUrl: string): VideoRecord {
  const did = extractDid(uri)
  return {
    $type: value.$type,
    title: value.title,
    source: {
      ref: typeof value.source?.ref === "string" ? value.source.ref : "",
      size: value.source?.size || 0,
      $type: value.source?.$type || "",
      mimeType: value.source?.mimeType || "",
    },
    creator: value.creator || did,
    duration: value.duration ?? (value.durationMs ?? 0) * 1_000_000,
    createdAt: value.createdAt,
    livestream: value.livestream,
    thumbUrl: value.thumb?.ref?.$link ? getLivestreamThumbUrl(did, value.thumb.ref.$link, pdsUrl) : undefined,
    uri,
  }
}

export interface LivestreamRecord {
  $type: string
  title: string // includes speaker: "Talk Title\nSpeaker Name · @handle"
  url: string
  agent: string
  createdAt: string
  endedAt?: string
  thumb?: {
    ref: { $link: string }
    size: number
    $type: string
    mimeType: string
  }
  post?: {
    cid: string
    uri: string // at://did/app.bsky.feed.post/rkey
  }
}

export interface ListRecordsResponse {
  records: Array<{
    uri: string
    value: VideoRecord
  }>
  cursor?: string
}

// Caches
const pdsCache = new Map<string, string>()
const handleCache = new Map<string, string>()

export async function listVideos(
  cursor?: string
): Promise<ListRecordsResponse> {
  const pdsUrl = await getRepoPdsUrl()

  const params = new URLSearchParams({
    repo: REPO_DID,
    collection: "place.stream.video",
    limit: "100",
  })

  if (cursor) {
    params.append("cursor", cursor)
  }

  const response = await fetch(`${pdsUrl}/xrpc/com.atproto.repo.listRecords?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch videos: ${response.statusText}`)
  }

  const data: { records: Array<{ uri: string; value: RawVideoRecord }>; cursor?: string } = await response.json()
  return {
    records: data.records.map((r) => ({ uri: r.uri, value: normalizeVideo(r.value, r.uri, pdsUrl) })),
    cursor: data.cursor,
  }
}

// Fetch every video record, following the cursor across pages
export async function listAllVideos(): Promise<VideoRecord[]> {
  const all: VideoRecord[] = []
  let cursor: string | undefined
  do {
    const response = await listVideos(cursor)
    all.push(...response.records.map((r) => ({ ...r.value, uri: r.uri })))
    cursor = response.cursor
  } while (cursor)
  return all
}

export function getVideoHlsUrl(rkey: string): string {
  const videoUri = `at://${REPO_DID}/place.stream.video/${rkey}`
  const params = new URLSearchParams({
    uri: videoUri,
  })

  return `${VOD_PLAYBACK_URL}?${params.toString()}`
}

// Resolve a DID to its PDS host via plc.directory
export async function resolvePds(did: string): Promise<string> {
  if (pdsCache.has(did)) return pdsCache.get(did)!

  try {
    const resp = await fetch(`https://plc.directory/${did}`)
    if (!resp.ok) throw new Error("DID resolution failed")
    const doc = await resp.json()
    const pdsService = doc.service?.find(
      (s: { id: string; serviceEndpoint: string }) =>
        s.id === "#atproto_pds"
    )
    const host = pdsService?.serviceEndpoint || ""
    pdsCache.set(did, host)
    return host
  } catch {
    return ""
  }
}

// Resolve a DID to its Bluesky handle via plc.directory
export async function resolveHandle(did: string): Promise<string> {
  if (handleCache.has(did)) return handleCache.get(did)!

  try {
    const resp = await fetch(`https://plc.directory/${did}`)
    if (!resp.ok) throw new Error("DID resolution failed")
    const doc = await resp.json()
    const handle =
      doc.alsoKnownAs
        ?.find((aka: string) => aka.startsWith("at://"))
        ?.replace("at://", "") || did
    handleCache.set(did, handle)
    return handle
  } catch {
    return did
  }
}

// Fetch the livestream record linked from a video
export async function fetchLivestreamRecord(
  livestreamUri: string
): Promise<LivestreamRecord | null> {
  try {
    // Parse the AT URI: at://did/collection/rkey
    const parts = livestreamUri.replace("at://", "").split("/")
    const did = parts[0]
    const collection = parts.slice(1, -1).join("/")
    const rkey = parts[parts.length - 1]

    const pds = await resolvePds(did)
    if (!pds) return null

    const params = new URLSearchParams({
      repo: did,
      collection,
      rkey,
    })

    const resp = await fetch(
      `${pds}/xrpc/com.atproto.repo.getRecord?${params.toString()}`
    )
    if (!resp.ok) return null

    const data = await resp.json()
    return data.value as LivestreamRecord
  } catch {
    return null
  }
}

// Get thumbnail URL from a livestream record's blob
export function getLivestreamThumbUrl(
  creatorDid: string,
  thumbCid: string,
  pdsHost: string
): string {
  return `${pdsHost}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(creatorDid)}&cid=${encodeURIComponent(thumbCid)}`
}

// Parse speaker name from livestream title: "Talk Title\nSpeaker · @handle"
export function parseSpeaker(livestreamTitle: string): {
  talkTitle: string
  speaker: string
  handle: string
  handles: string[]
} {
  const lines = livestreamTitle.split("\n")
  if (lines.length > 1) {
    const raw = lines.slice(1).join(" ").trim()
    // Extract ALL @handles (e.g. "@werd.io · @joe.germuska.com")
    const handleMatches = [...raw.matchAll(/@([\w.-]+\.[\w.-]+)/g)]
    const handles = handleMatches.map((m) => m[1])
    const handle = handles[0] || ""
    // Strip all handles and separators from the speaker name
    const speaker = raw
      .replace(/@[\w.-]+\.[\w.-]+/g, "")
      .replace(/\s*[·•|]\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    return {
      talkTitle: lines[0].trim(),
      speaker,
      handle,
      handles,
    }
  }
  return { talkTitle: livestreamTitle, speaker: "", handle: "", handles: [] }
}

// Convert a Bluesky post AT URI to a bsky.app URL
export function bskyPostUrl(postUri: string): string {
  // at://did:plc:xxx/app.bsky.feed.post/rkey -> need handle, but fallback to DID
  const parts = postUri.replace("at://", "").split("/")
  const did = parts[0]
  const rkey = parts[parts.length - 1]
  return `https://bsky.app/profile/${did}/post/${rkey}`
}

export function bskyShareUrl(title: string, pageUrl: string): string {
  const text = `${title}\n\n${pageUrl}`
  return `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`
}

export function extractRkey(uri: string): string {
  return uri.split("/").pop() || ""
}

export function extractDid(uri: string): string {
  return uri.replace("at://", "").split("/")[0]
}

export function formatDuration(nanoseconds: number): string {
  const seconds = Math.floor(nanoseconds / 1_000_000_000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000_000)
    return `${(bytes / 1_000_000_000).toFixed(1)} GB`
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(0)} MB`
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`
  return `${bytes} B`
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

// Resolve thumbnail URLs for a batch of videos via their livestream records
// Returns a Map of video rkey -> thumbnail URL
export async function resolveVideoThumbnails(
  videos: VideoRecord[]
): Promise<Map<string, string>> {
  const thumbMap = new Map<string, string>()

  const tasks = videos
    .map(async (v) => {
      const livestreamUri = v.livestream?.uri
      if (!livestreamUri) return
      try {
        const rkey = extractRkey(v.uri)
        const ls = await fetchLivestreamRecord(livestreamUri)
        if (ls?.thumb?.ref?.$link) {
          const creatorDid = extractDid(livestreamUri)
          const pds = await resolvePds(creatorDid)
          if (pds) {
            thumbMap.set(
              rkey,
              getLivestreamThumbUrl(creatorDid, ls.thumb.ref.$link, pds)
            )
          }
        }
      } catch {
        // skip individual failures
      }
    })

  await Promise.allSettled(tasks)
  return thumbMap
}

export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}
