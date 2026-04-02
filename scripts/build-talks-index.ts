/**
 * Build-time script: fetches all talks from the AT Protocol PDS,
 * enriches with speaker info, and writes static JSON files for the app.
 *
 * Run: npx tsx scripts/build-talks-index.ts
 * Output: src/data/talks.json
 */

const REPO_DID = "did:plc:rbvrr34edl5ddpuwcubjiost"

// Caches for PDS and handle resolution
const pdsCache = new Map<string, string>()
const handleCache = new Map<string, string>()

async function resolvePds(did: string): Promise<string> {
  if (pdsCache.has(did)) return pdsCache.get(did)!
  try {
    const resp = await fetch(`https://plc.directory/${did}`)
    if (!resp.ok) throw new Error("DID resolution failed")
    const doc = await resp.json()
    const svc = doc.service?.find((s: { id: string; serviceEndpoint: string }) => s.id === "#atproto_pds")
    const host = svc?.serviceEndpoint || ""
    pdsCache.set(did, host)
    return host
  } catch {
    return ""
  }
}

async function resolveHandle(did: string): Promise<string> {
  if (handleCache.has(did)) return handleCache.get(did)!
  try {
    const resp = await fetch(`https://plc.directory/${did}`)
    if (!resp.ok) throw new Error("DID resolution failed")
    const doc = await resp.json()
    const handle = doc.alsoKnownAs?.find((aka: string) => aka.startsWith("at://"))?.replace("at://", "") || did
    handleCache.set(did, handle)
    return handle
  } catch {
    return did
  }
}

function parseSpeaker(title: string): { talkTitle: string; speaker: string; handle: string; handles: string[] } {
  const lines = title.split("\n")
  if (lines.length > 1) {
    const raw = lines.slice(1).join(" ").trim()
    const handleMatches = [...raw.matchAll(/@([\w.-]+\.[\w.-]+)/g)]
    const handles = handleMatches.map((m) => m[1])
    const handle = handles[0] || ""
    const speaker = raw.replace(/@[\w.-]+\.[\w.-]+/g, "").replace(/\s*[·•|]\s*/g, " ").replace(/\s+/g, " ").trim()
    return { talkTitle: lines[0].trim(), speaker, handle, handles }
  }
  return { talkTitle: title, speaker: "", handle: "", handles: [] }
}

function extractRkey(uri: string): string {
  return uri.split("/").pop() || ""
}

function extractDid(uri: string): string {
  return uri.replace("at://", "").split("/")[0]
}

interface VideoRecord {
  $type: string
  title: string
  source: { ref: string; size: number; $type: string; mimeType: string }
  creator: string
  duration: number
  createdAt: string
  livestream: { cid: string; uri: string }
  uri: string
}

interface LivestreamRecord {
  $type: string
  title: string
  url: string
  agent: string
  createdAt: string
  endedAt?: string
  thumb?: { ref: { $link: string }; size: number; $type: string; mimeType: string }
  post?: { cid: string; uri: string }
}

export interface Talk {
  rkey: string
  uri: string
  title: string
  duration: number
  createdAt: string
  creator: string
  creatorHandle: string
  speaker: string
  handles: string[]
  thumbUrl: string | null
  livestreamUri: string | null
  postUri: string | null
}

async function fetchAllVideos(): Promise<VideoRecord[]> {
  const pdsUrl = await resolvePds(REPO_DID)
  const host = pdsUrl || "https://iameli.com"
  const all: VideoRecord[] = []
  let cursor: string | undefined

  while (true) {
    const params = new URLSearchParams({ repo: REPO_DID, collection: "place.stream.video", limit: "100" })
    if (cursor) params.append("cursor", cursor)

    const resp = await fetch(`${host}/xrpc/com.atproto.repo.listRecords?${params}`)
    if (!resp.ok) throw new Error(`Failed to fetch videos: ${resp.statusText}`)
    const data = await resp.json()

    for (const r of data.records) {
      all.push({ ...r.value, uri: r.uri })
    }

    if (!data.cursor) break
    cursor = data.cursor
  }

  console.log(`  Fetched ${all.length} video records`)
  return all
}

async function fetchLivestreamRecord(livestreamUri: string): Promise<LivestreamRecord | null> {
  try {
    const parts = livestreamUri.replace("at://", "").split("/")
    const did = parts[0]
    const collection = parts.slice(1, -1).join("/")
    const rkey = parts[parts.length - 1]
    const pds = await resolvePds(did)
    if (!pds) return null

    const params = new URLSearchParams({ repo: did, collection, rkey })
    const resp = await fetch(`${pds}/xrpc/com.atproto.repo.getRecord?${params}`)
    if (!resp.ok) return null
    const data = await resp.json()
    return data.value as LivestreamRecord
  } catch {
    return null
  }
}

function getLivestreamThumbUrl(creatorDid: string, thumbCid: string, pdsHost: string): string {
  return `${pdsHost}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(creatorDid)}&cid=${encodeURIComponent(thumbCid)}`
}

async function enrichVideo(v: VideoRecord): Promise<Talk> {
  const rkey = extractRkey(v.uri)
  const creatorHandle = await resolveHandle(v.creator)

  let speaker = ""
  let handles: string[] = []
  let thumbUrl: string | null = null
  let postUri: string | null = null

  if (v.livestream?.uri) {
    const ls = await fetchLivestreamRecord(v.livestream.uri)
    if (ls) {
      const parsed = parseSpeaker(ls.title)
      speaker = parsed.speaker
      handles = parsed.handles
      postUri = ls.post?.uri || null

      if (ls.thumb?.ref?.$link) {
        const creatorDid = extractDid(v.livestream.uri)
        const pds = await resolvePds(creatorDid)
        if (pds) thumbUrl = getLivestreamThumbUrl(creatorDid, ls.thumb.ref.$link, pds)
      }
    }
  }

  return {
    rkey,
    uri: v.uri,
    title: v.title,
    duration: v.duration,
    createdAt: v.createdAt,
    creator: v.creator,
    creatorHandle,
    speaker,
    handles,
    thumbUrl,
    livestreamUri: v.livestream?.uri || null,
    postUri,
  }
}

async function main() {
  console.log("Building talks index...")

  console.log("1. Fetching videos from PDS...")
  const videos = await fetchAllVideos()

  console.log("2. Enriching with speaker info and thumbnails...")
  const concurrency = 5
  const talks: Talk[] = []
  for (let i = 0; i < videos.length; i += concurrency) {
    const batch = videos.slice(i, i + concurrency)
    const results = await Promise.allSettled(batch.map(enrichVideo))
    for (const r of results) {
      if (r.status === "fulfilled") talks.push(r.value)
    }
    process.stdout.write(`  ${Math.min(i + concurrency, videos.length)}/${videos.length}\r`)
  }
  console.log()

  // Sort by createdAt descending
  talks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  console.log(`3. Writing ${talks.length} talks to src/data/talks.json...`)
  const { mkdirSync, writeFileSync } = await import("fs")
  const { join } = await import("path")

  const dataDir = join(import.meta.dirname || __dirname, "..", "src", "data")
  mkdirSync(dataDir, { recursive: true })
  writeFileSync(join(dataDir, "talks.json"), JSON.stringify(talks, null, 2))

  console.log("Done!")
}

main().catch((err) => {
  console.error("Build failed:", err.message || err)
  console.log("Continuing with existing talks.json (if any)")
  // Don't exit with error — let the build proceed with stale data
})
