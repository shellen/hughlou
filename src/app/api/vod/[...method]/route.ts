import { NextRequest } from "next/server"

const VOD_HOST = "https://vod-beta.stream.place"

const ALLOWED_METHODS = new Set([
  "place.stream.playback.getVideoPlaylist",
  "place.stream.playback.getInitSegment",
  "place.stream.playback.getVideoBlob",
])

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ method: string[] }> }
) {
  const { method } = await params
  const xrpcMethod = method.join("/")

  if (!ALLOWED_METHODS.has(xrpcMethod)) {
    return new Response("Method not allowed", { status: 400 })
  }

  // Forward all query params to upstream
  const query = request.nextUrl.searchParams.toString()
  const upstream = `${VOD_HOST}/xrpc/${xrpcMethod}${query ? `?${query}` : ""}`

  // Forward range header for video seeking
  const headers: Record<string, string> = {}
  const range = request.headers.get("range")
  if (range) headers["Range"] = range

  try {
    const resp = await fetch(upstream, { headers })

    if (!resp.ok && resp.status !== 206) {
      return new Response(`Upstream returned ${resp.status}`, {
        status: resp.status,
      })
    }

    const contentType = resp.headers.get("content-type") || ""
    const isPlaylist =
      contentType.includes("mpegurl") ||
      contentType.includes("x-mpegurl") ||
      xrpcMethod === "place.stream.playback.getVideoPlaylist"

    // For playlists, rewrite absolute VOD URLs to go through this proxy
    if (isPlaylist) {
      let body = await resp.text()
      body = body.split(`${VOD_HOST}/xrpc/`).join("/api/vod/")
      return new Response(body, {
        status: resp.status,
        headers: {
          "Content-Type":
            resp.headers.get("content-type") ||
            "application/vnd.apple.mpegurl",
          "Cache-Control": "public, max-age=5",
        },
      })
    }

    // For binary segments, stream through with proper headers
    const responseHeaders: Record<string, string> = {
      "Cache-Control": "public, max-age=31536000, immutable",
    }

    for (const key of [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
    ]) {
      const val = resp.headers.get(key)
      if (val) responseHeaders[key] = val
    }

    return new Response(resp.body, {
      status: resp.status,
      headers: responseHeaders,
    })
  } catch {
    return new Response("Upstream fetch failed", { status: 502 })
  }
}
