import { NextRequest, NextResponse } from "next/server"

const BSKY_PUBLIC_API = "https://public.api.bsky.app/xrpc"

const ALLOWED_METHODS = new Set([
  "app.bsky.feed.getPostThread",
])

export async function GET(request: NextRequest) {
  const method = request.nextUrl.searchParams.get("method")
  if (!method || !ALLOWED_METHODS.has(method)) {
    return NextResponse.json({ error: "Invalid method" }, { status: 400 })
  }

  // Forward all params except "method"
  const params = new URLSearchParams()
  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    if (key !== "method") params.set(key, value)
  }

  const upstream = `${BSKY_PUBLIC_API}/${method}?${params.toString()}`

  try {
    const resp = await fetch(upstream)
    if (!resp.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${resp.status}` },
        { status: resp.status }
      )
    }
    const data = await resp.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 })
  }
}
