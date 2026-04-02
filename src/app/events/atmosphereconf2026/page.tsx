"use client"

import { Suspense, useEffect, useState, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { createPortal } from "react-dom"
import Link from "next/link"
import VideoCard from "@/components/VideoCard"
import { listVideos, getVideoHlsUrl, extractRkey, extractDid, fetchLivestreamRecord, parseSpeaker, resolveHandle, resolvePds, getLivestreamThumbUrl, VideoRecord } from "@/lib/api"
import { getCachedThumb, captureThumbsBatch } from "@/lib/thumbnails"

const DAY_LABELS: Record<string, { label: string; sub: string }> = {
  "2026-03-28": { label: "Pre-Conference Workshops", sub: "Saturday, March 28" },
  "2026-03-29": { label: "Main Conference — Day 1", sub: "Sunday, March 29" },
  "2026-03-30": { label: "Main Conference — Day 2", sub: "Monday, March 30" },
}

function getDayKey(isoDate: string): string {
  return isoDate.split("T")[0]
}

function getDayLabel(dateKey: string) {
  return DAY_LABELS[dateKey] || { label: dateKey, sub: "" }
}

function HeaderSearch({ search, setSearch }: { search: string; setSearch: (s: string) => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  const el = document.getElementById("header-search")
  if (!el) return null

  return createPortal(
    <div className="relative w-full" role="search" aria-label="Search talks">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="search"
        placeholder="Search talks, speakers, handles..."
        aria-label="Search talks, speakers, and handles"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-10 pr-10 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700 transition-all"
      />
      {search && (
        <button
          onClick={() => setSearch("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>,
    el
  )
}

export default function EventPage() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  )
}

function Home() {
  const [videos, setVideos] = useState<VideoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState<string | undefined>()
  const [hasMore, setHasMore] = useState(false)
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("q") || "")
  const [newestFirst, setNewestFirst] = useState(true)
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  const [speakerInfo, setSpeakerInfo] = useState<Record<string, { speaker: string; handles: string[]; creatorHandle: string; thumbUrl?: string }>>({})

  const onThumbCapture = useCallback((rkey: string, dataUrl: string) => {
    setThumbs((prev) => ({ ...prev, [rkey]: dataUrl }))
  }, [])

  useEffect(() => {
    if (videos.length === 0) return
    const abortController = new AbortController()

    const cached: Record<string, string> = {}
    for (const v of videos) {
      const rkey = extractRkey(v.uri)
      const c = getCachedThumb(rkey)
      if (c) cached[rkey] = c
    }
    if (Object.keys(cached).length > 0) setThumbs((prev) => ({ ...prev, ...cached }))
    const missing = videos
      .map((v) => ({ rkey: extractRkey(v.uri), hlsUrl: getVideoHlsUrl(extractRkey(v.uri)) }))
      .filter((item) => !cached[item.rkey])
    if (missing.length > 0) captureThumbsBatch(missing, onThumbCapture, abortController.signal)

    return () => { abortController.abort() }
  }, [videos, onThumbCapture])

  useEffect(() => {
    if (videos.length === 0) return
    let cancelled = false
    async function enrichSpeakers() {
      const infos: Record<string, { speaker: string; handles: string[]; creatorHandle: string; thumbUrl?: string }> = {}
      await Promise.allSettled(
        videos.map(async (v) => {
          const rk = extractRkey(v.uri)
          try {
            const creatorHandle = await resolveHandle(v.creator)
            let speaker = ""
            let handles: string[] = []
            let thumbUrl: string | undefined
            if (v.livestream?.uri) {
              const ls = await fetchLivestreamRecord(v.livestream.uri)
              if (ls) {
                const parsed = parseSpeaker(ls.title)
                speaker = parsed.speaker
                handles = parsed.handles
                if (ls.thumb?.ref?.$link) {
                  const creatorDid = extractDid(v.livestream.uri)
                  const pds = await resolvePds(creatorDid)
                  if (pds) thumbUrl = getLivestreamThumbUrl(creatorDid, ls.thumb.ref.$link, pds)
                }
              }
            }
            infos[rk] = { speaker, handles, creatorHandle, thumbUrl }
          } catch { /* skip */ }
        })
      )
      if (!cancelled) setSpeakerInfo(infos)
    }
    enrichSpeakers()
    return () => { cancelled = true }
  }, [videos])

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true)
        const response = await listVideos()
        const vids = response.records.map((r) => ({ ...r.value, uri: r.uri }))
        setVideos(vids)
        setHasMore(!!response.cursor)
        setCursor(response.cursor)
      } catch (error) {
        console.error("Failed to fetch videos:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchVideos()
  }, [])

  const loadMore = async () => {
    if (!cursor) return
    try {
      setLoading(true)
      const response = await listVideos(cursor)
      const newVids = response.records.map((r) => ({ ...r.value, uri: r.uri }))
      setVideos((prev) => [...prev, ...newVids])
      setHasMore(!!response.cursor)
      setCursor(response.cursor)
    } catch (error) {
      console.error("Failed to load more videos:", error)
    } finally {
      setLoading(false)
    }
  }

  const { filteredVideos, groupedByDay } = useMemo(() => {
    const sorted = [...videos].sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return newestFirst ? diff : -diff
    })
    const q = search.trim().toLowerCase()
    const filtered = q
      ? sorted.filter((v) => {
          if (v.title.toLowerCase().includes(q)) return true
          const info = speakerInfo[extractRkey(v.uri)]
          if (!info) return false
          return info.speaker.toLowerCase().includes(q) || info.handles.some((h) => h.toLowerCase().includes(q)) || info.creatorHandle.toLowerCase().includes(q)
        })
      : sorted
    const groups = new Map<string, VideoRecord[]>()
    for (const v of filtered) {
      const key = getDayKey(v.createdAt)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(v)
    }
    const sortedGroups = new Map([...groups.entries()].sort(([a], [b]) => newestFirst ? b.localeCompare(a) : a.localeCompare(b)))
    return { filteredVideos: filtered, groupedByDay: sortedGroups }
  }, [videos, search, speakerInfo, newestFirst])

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10">
      <HeaderSearch search={search} setSearch={setSearch} />

      {/* Hero — ATmosphere Conf style */}
      <div className="mb-14">
        <Link href="/events/atmosphereconf2026" className="block rounded-2xl overflow-hidden mb-8">
          {/* Conference banner */}
          <div className="bg-slate-900 px-6 sm:px-10 pt-8 pb-4">
            <p
              className="font-display text-[clamp(2.5rem,8vw,5.5rem)] font-black text-white uppercase leading-[0.9] tracking-tight"
              aria-hidden="true"
            >
              ATMOSPHERE
            </p>
          </div>
          <div className="flex items-stretch">
            <div className="bg-slate-900 pl-6 sm:pl-10 pr-2 sm:pr-3 flex items-center pb-6 pt-0">
              <p
                className="font-display text-[clamp(1.75rem,5.5vw,3.5rem)] font-black text-white uppercase leading-none tracking-tight"
                  aria-hidden="true"
              >
                CONF
              </p>
            </div>
            <div className="bg-blue-600 pl-3 sm:pl-4 pr-4 sm:pr-6 flex items-center flex-1 rounded-tl-2xl pb-6 pt-0">
              <p
                className="font-display text-[clamp(1.75rem,5.5vw,3.5rem)] font-black text-white uppercase leading-none tracking-tight"
                >
                VANCOUVER &middot; 2026
              </p>
            </div>
          </div>
        </Link>

        <h1 className="sr-only">HUGHLOU — ATmosphereConf 2026 Replay</h1>
        <p className="text-base text-slate-400 leading-relaxed max-w-2xl mb-1">
          Every talk from ATmosphereConf 2026, on demand.
        </p>
        <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
          Three days of workshops, demos, and deep dives — from Vancouver, BC. March 28–30, 2026.
        </p>
        {videos.length > 0 && (
          <p className="text-sm text-slate-600 mt-3 font-mono">
            {videos.length}&nbsp;talks &middot; 3 days
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        {search ? (
          <p className="text-xs text-slate-400 font-mono" role="status" aria-live="polite" aria-atomic="true">
            {filteredVideos.length} result{filteredVideos.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
          </p>
        ) : (
          <div />
        )}
        <button
          onClick={() => setNewestFirst((prev) => !prev)}
          aria-label={newestFirst ? "Show oldest first" : "Show newest first"}
          className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <svg className={`w-3.5 h-3.5 transition-transform ${newestFirst ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {newestFirst ? "Latest first" : "Earliest first"}
        </button>
      </div>

      {loading && videos.length === 0 ? (
        <div className="space-y-16" role="status" aria-label="Loading talks">
          <span className="sr-only">Loading talks…</span>
          <div>
            <div className="h-6 w-64 skeleton rounded mb-8" aria-hidden="true" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8" aria-hidden="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-video rounded-lg skeleton" />
                  <div className="h-4 w-3/4 skeleton rounded" />
                  <div className="h-3 w-1/3 skeleton rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 text-base">{search ? "No talks match your search." : "No videos found."}</p>
        </div>
      ) : (
        <div className="space-y-16">
          {[...groupedByDay.entries()].map(([dateKey, dayVideos]) => {
            const { label, sub } = getDayLabel(dateKey)
            return (
              <section key={dateKey}>
                <div className="flex items-baseline gap-4 mb-8">
                  <h2 className="text-lg font-bold text-white tracking-tight">{label}</h2>
                  {sub && (
                    <span className="text-xs text-slate-500 font-mono">
                      {sub} &middot; {dayVideos.length} talk{dayVideos.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
                  {dayVideos.map((video) => {
                    const rkey = extractRkey(video.uri)
                    return (
                      <VideoCard
                        key={video.uri}
                        title={video.title}
                        duration={video.duration}
                        createdAt={video.createdAt}
                        uri={video.uri}
                        thumbDataUrl={thumbs[rkey] || speakerInfo[rkey]?.thumbUrl}
                      />
                    )
                  })}
                </div>
              </section>
            )
          })}

          {hasMore && !search && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-8 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all"
              >
                {loading ? "Loading..." : "Load More Talks"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
