"use client"

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import Link from "next/link"
import VideoPlayer from "@/components/VideoPlayer"
import VideoCard from "@/components/VideoCard"
import TranscriptPanel from "@/components/TranscriptPanel"
import BlueskyComments from "@/components/BlueskyComments"
import {
  listVideos,
  getVideoHlsUrl,
  fetchLivestreamRecord,
  getLivestreamThumbUrl,
  parseSpeaker,
  bskyPostUrl,
  bskyShareUrl,
  resolvePds,
  resolveHandle,
  extractRkey,
  formatDuration,
  formatDate,
  formatFileSize,
  extractDid,
  VideoRecord,
  LivestreamRecord,
} from "@/lib/api"
import { getCachedThumb, captureThumbsBatch } from "@/lib/thumbnails"

function WatchSearch() {
  const [mounted, setMounted] = useState(false)
  const [query, setQuery] = useState("")
  const router = useRouter()

  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  const el = document.getElementById("header-search")
  if (!el) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) router.push(`/?q=${encodeURIComponent(query.trim())}`)
  }

  return createPortal(
    <form onSubmit={handleSubmit} className="relative w-full" role="search" aria-label="Search talks">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b8b96]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="search"
        placeholder="Search talks..."
        aria-label="Search all talks"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-10 pr-4 py-2 bg-[#111113] border border-[#1c1c1f] rounded-lg text-sm text-white placeholder-[#71717a] focus:outline-none focus:border-[#333] focus:ring-1 focus:ring-[#333] transition-all"
      />
    </form>,
    el
  )
}

function ActionBar({
  shareUrl,
  postUrl,
  streamplaceUrl,
  atRecordUrl,
  videoTitle,
}: {
  shareUrl: string
  postUrl: string | null
  streamplaceUrl: string | null
  atRecordUrl: string
  videoTitle: string
}) {
  const [copied, setCopied] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  // Close overflow menu on outside click
  useEffect(() => {
    if (!moreOpen) return
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleEsc)
    }
  }, [moreOpen])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* fallback */ }
  }

  const messagesUrl = `sms:&body=${encodeURIComponent(`${videoTitle} — ${typeof window !== "undefined" ? window.location.href : ""}`)}`

  return (
    <div className="mt-5 pt-5 border-t border-[#1c1c1f] flex flex-wrap items-center gap-2" role="group" aria-label="Talk actions">
      {/* Share on Bluesky */}
      <a
        href={shareUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Bluesky (opens in new tab)"
        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md text-[#a0a0ff] bg-[#a0a0ff]/8 hover:bg-[#a0a0ff]/15 transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 600 530" fill="currentColor" aria-hidden="true">
          <path d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z" />
        </svg>
        Share
      </a>

      {/* Copy Link */}
      <button
        onClick={handleCopy}
        aria-label={copied ? "Link copied" : "Copy link to clipboard"}
        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md text-[#8b8b96] bg-[#8b8b96]/8 hover:bg-[#8b8b96]/15 transition-colors"
      >
        {copied ? (
          <svg className="w-3.5 h-3.5 text-[#60d080]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )}
        {copied ? "Copied!" : "Copy Link"}
      </button>

      {/* Messages */}
      <a
        href={messagesUrl}
        aria-label="Share via Messages"
        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md text-[#8b8b96] bg-[#8b8b96]/8 hover:bg-[#8b8b96]/15 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Messages
      </a>

      {/* Streamplace (if available) */}
      {streamplaceUrl && (
        <a
          href={streamplaceUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View on Streamplace (opens in new tab)"
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md text-[#60d080] bg-[#60d080]/8 hover:bg-[#60d080]/15 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Streamplace
        </a>
      )}

      {/* More (...) overflow menu */}
      <div className="relative" ref={moreRef}>
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          aria-label="More actions"
          aria-expanded={moreOpen}
          aria-haspopup="menu"
          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[#8b8b96] bg-[#8b8b96]/8 hover:bg-[#8b8b96]/15 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
        {moreOpen && (
          <div
            role="menu"
            className="absolute left-0 bottom-full mb-2 w-52 bg-[#18181b] border border-[#2a2a2e] rounded-lg shadow-xl py-1 z-50"
          >
            {postUrl && (
              <a
                href={postUrl}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                className="flex items-center gap-3 px-4 py-2.5 text-xs text-[#a1a1aa] hover:text-white hover:bg-[#222225] transition-colors"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 600 530" fill="currentColor" aria-hidden="true">
                  <path d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z" />
                </svg>
                Bluesky Post
              </a>
            )}
            <a
              href={atRecordUrl}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              className="flex items-center gap-3 px-4 py-2.5 text-xs text-[#a1a1aa] hover:text-white hover:bg-[#222225] transition-colors"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
              AT Protocol Record
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

interface PageProps {
  params: Promise<{ rkey: string }>
}

export default function WatchPage({ params: paramsPromise }: PageProps) {
  const { rkey } = React.use(paramsPromise) as { rkey: string }
  const videoElRef = useRef<HTMLVideoElement | null>(null)
  const [video, setVideo] = useState<VideoRecord | null>(null)
  const [hlsUrl, setHlsUrl] = useState("")
  const [allVideos, setAllVideos] = useState<VideoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [livestream, setLivestream] = useState<LivestreamRecord | null>(null)
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const [speaker, setSpeaker] = useState("")
  const [speakerHandles, setSpeakerHandles] = useState<string[]>([])
  const [creatorHandle, setCreatorHandle] = useState("")
  const [thumbs, setThumbs] = useState<Record<string, string>>({})

  const onThumbCapture = useCallback((rk: string, dataUrl: string) => {
    setThumbs((prev) => ({ ...prev, [rk]: dataUrl }))
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        setLivestream(null)
        setThumbUrl(null)
        setSpeaker("")
        setSpeakerHandles([])
        setCreatorHandle("")

        const response = await listVideos()
        const videos = response.records.map((r) => ({ ...r.value, uri: r.uri }))
        setAllVideos(videos)

        const currentVideo = videos.find((v) => v.uri.endsWith(`/${rkey}`))
        if (!currentVideo) { setError("Video not found"); return }

        setVideo(currentVideo)
        setHlsUrl(getVideoHlsUrl(rkey))
        resolveHandle(currentVideo.creator).then(setCreatorHandle)

        if (currentVideo.livestream?.uri) {
          const ls = await fetchLivestreamRecord(currentVideo.livestream.uri)
          if (ls) {
            setLivestream(ls)
            const parsed = parseSpeaker(ls.title)
            setSpeaker(parsed.speaker)
            setSpeakerHandles(parsed.handles)
            if (ls.thumb?.ref?.$link) {
              const creatorDid = extractDid(currentVideo.livestream.uri)
              const pds = await resolvePds(creatorDid)
              if (pds) setThumbUrl(getLivestreamThumbUrl(creatorDid, ls.thumb.ref.$link, pds))
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch video:", err)
        setError("Failed to load video")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [rkey])

  useEffect(() => {
    if (allVideos.length === 0) return
    const cached: Record<string, string> = {}
    for (const v of allVideos) {
      const rk = extractRkey(v.uri)
      const c = getCachedThumb(rk)
      if (c) cached[rk] = c
    }
    if (Object.keys(cached).length > 0) setThumbs((prev) => ({ ...prev, ...cached }))
    const missing = allVideos
      .filter((v) => v.uri !== video?.uri)
      .map((v) => ({ rkey: extractRkey(v.uri), hlsUrl: getVideoHlsUrl(extractRkey(v.uri)) }))
      .filter((item) => !cached[item.rkey])
    if (missing.length > 0) captureThumbsBatch(missing, onThumbCapture)
  }, [allVideos, video, onThumbCapture])

  const { prevVideo, nextVideo } = useMemo(() => {
    if (!video || allVideos.length === 0) return { prevVideo: null, nextVideo: null }
    const sorted = [...allVideos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const currentIdx = sorted.findIndex((v) => v.uri === video.uri)
    if (currentIdx === -1) return { prevVideo: null, nextVideo: null }
    return {
      prevVideo: currentIdx > 0 ? sorted[currentIdx - 1] : null,
      nextVideo: currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null,
    }
  }, [video, allVideos])

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <div>
            <div className="aspect-video bg-[#111113] rounded-lg skeleton" />
            <div className="mt-6 space-y-3">
              <div className="h-7 w-3/4 skeleton rounded" />
              <div className="h-4 w-1/3 skeleton rounded" />
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-44 shrink-0 aspect-video rounded-md skeleton" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-full skeleton rounded" />
                  <div className="h-3 w-2/3 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="text-center py-20">
          <p className="text-[#8b8b96] text-base mb-6">{error || "Video not found"}</p>
          <Link href="/" className="inline-block px-6 py-2.5 bg-[#111113] border border-[#1c1c1f] hover:border-[#333] text-white text-sm font-medium rounded-lg transition-all">
            Back to All Talks
          </Link>
        </div>
      </div>
    )
  }

  const otherVideos = allVideos
    .filter((v) => v.uri !== video.uri)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12)

  const postUrl = livestream?.post?.uri ? bskyPostUrl(livestream.post.uri) : null
  const streamplaceUrl = livestream?.url || null
  const shareUrl = bskyShareUrl(video.title, typeof window !== "undefined" ? window.location.href : "")
  const profileUrl = creatorHandle && !creatorHandle.startsWith("did:") ? `https://bsky.app/profile/${creatorHandle}` : null

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <WatchSearch />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-10">
        {/* Main content */}
        <div className="min-w-0">
          <VideoPlayer ref={videoElRef} hlsUrl={hlsUrl} title={video.title} poster={thumbUrl} thumbDataUrl={thumbs[rkey]} />

          {/* Prev / Next */}
          <nav aria-label="Talk navigation" className="mt-4 flex items-center justify-between">
            {prevVideo ? (
              <Link href={`/watch/${extractRkey(prevVideo.uri)}`} aria-label={`Previous talk: ${prevVideo.title}`} className="group flex items-center gap-2 text-xs text-[#8b8b96] hover:text-white transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline max-w-[180px] truncate">{prevVideo.title}</span>
                <span className="sm:hidden">Prev</span>
              </Link>
            ) : <div />}
            {nextVideo ? (
              <Link href={`/watch/${extractRkey(nextVideo.uri)}`} aria-label={`Next talk: ${nextVideo.title}`} className="group flex items-center gap-2 text-xs text-[#8b8b96] hover:text-white transition-colors text-right">
                <span className="hidden sm:inline max-w-[180px] truncate">{nextVideo.title}</span>
                <span className="sm:hidden">Next</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : <div />}
          </nav>

          {/* Title + speaker */}
          <div className="mt-6">
            <h1 className="text-2xl font-bold text-white tracking-tight leading-snug">
              {video.title}
            </h1>
            {(speaker || speakerHandles.length > 0) && (
              <p className="text-[#a0a0a8] text-sm mt-2">
                {speaker}
                {speakerHandles.length > 0 && (
                  <>
                    {speaker && " · "}
                    {speakerHandles.map((h, i) => (
                      <span key={h}>
                        {i > 0 && " · "}
                        <a href={`https://bsky.app/profile/${h}`} target="_blank" rel="noopener noreferrer" className="text-[#a0a0ff] hover:text-white transition-colors">
                          @{h}
                        </a>
                      </span>
                    ))}
                  </>
                )}
              </p>
            )}
          </div>

          {/* Metadata */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8b8b96] font-mono">
            <span>{formatDate(video.createdAt)}</span>
            <span className="text-[#2a2a2e]">/</span>
            <span>{formatDuration(video.duration)}</span>
            <span className="text-[#2a2a2e]">/</span>
            <span>{formatFileSize(video.source.size)}</span>
            {creatorHandle && (
              <>
                <span className="text-[#2a2a2e]">/</span>
                {profileUrl ? (
                  <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="text-[#a0a0ff] hover:text-white transition-colors">
                    @{creatorHandle}
                  </a>
                ) : (
                  <span>{creatorHandle.slice(0, 20)}...</span>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <ActionBar
            shareUrl={shareUrl}
            postUrl={postUrl}
            streamplaceUrl={streamplaceUrl}
            atRecordUrl={`https://pds.ls/${video.uri}`}
            videoTitle={video.title}
          />

          {/* Transcript */}
          <TranscriptPanel rkey={rkey} videoRef={videoElRef} />

          {/* Bluesky Comments */}
          <BlueskyComments
            postUri={livestream?.post?.uri || null}
            videoPageUrl={`https://hughlou.com/watch/${rkey}`}
            shareUrl={shareUrl}
            streamplaceUrl={streamplaceUrl}
          />
        </div>

        {/* Sidebar */}
        <aside aria-label="More talks" className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto scrollbar-hide">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-semibold text-[#8b8b96] uppercase tracking-widest">
              More Talks
            </h2>
            <Link href="/" className="text-xs text-[#a0a0ff] hover:text-white transition-colors font-medium">
              All Talks &rarr;
            </Link>
          </div>
          <div className="space-y-1">
            {otherVideos.length === 0 ? (
              <p className="text-[#8b8b96] text-sm">No other videos available</p>
            ) : (
              otherVideos.map((v) => {
                const rk = extractRkey(v.uri)
                return (
                  <VideoCard
                    key={v.uri}
                    title={v.title}
                    duration={v.duration}
                    createdAt={v.createdAt}
                    uri={v.uri}
                    compact
                    thumbDataUrl={thumbs[rk]}
                  />
                )
              })
            )}
          </div>
          {otherVideos.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[#1c1c1f]">
              <Link href="/" className="block text-center text-xs text-[#8b8b96] hover:text-white transition-colors font-medium py-2">
                View all {allVideos.length} talks
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
