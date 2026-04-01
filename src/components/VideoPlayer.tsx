"use client"

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react"
import Hls from "hls.js"

interface VideoPlayerProps {
  hlsUrl: string
  title: string
  poster?: string | null
  thumbDataUrl?: string | null
}

type PlayerState = "idle" | "loading" | "playing" | "error"

function titleToGradient(title: string) {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash
  }
  const palettes = [
    { bg: "#14141f", accent: "#3b5998" },
    { bg: "#141420", accent: "#4a6fa5" },
    { bg: "#0f1117", accent: "#6b7280" },
    { bg: "#170d26", accent: "#7c5cbf" },
    { bg: "#0d1520", accent: "#4a80b5" },
    { bg: "#111927", accent: "#5a8ec0" },
    { bg: "#1a1425", accent: "#8b6aad" },
    { bg: "#0e1a1f", accent: "#4a9aa8" },
    { bg: "#131320", accent: "#7068a8" },
    { bg: "#101825", accent: "#5580ad" },
    { bg: "#1a150d", accent: "#a88b4a" },
    { bg: "#0c1315", accent: "#4a9aa0" },
    { bg: "#1a0d0d", accent: "#a06060" },
    { bg: "#0d1a0d", accent: "#60a060" },
    { bg: "#1a1a0d", accent: "#a0a060" },
    { bg: "#1a0d1a", accent: "#a060a0" },
  ]
  return palettes[Math.abs(hash) % palettes.length]
}

const VideoPlayer = forwardRef<HTMLVideoElement | null, VideoPlayerProps>(
  function VideoPlayer({ hlsUrl, title, poster: _poster, thumbDataUrl }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const hlsRef = useRef<Hls | null>(null)
    const [state, setState] = useState<PlayerState>("idle")

    useImperativeHandle(ref, () => videoRef.current!, [])

    const gradientStyle = titleToGradient(title)

    useEffect(() => {
      return () => {
        if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
        const video = videoRef.current
        if (video) {
          const cleanup = (video as unknown as Record<string, unknown>).__safariCleanup as (() => void) | undefined
          if (cleanup) { cleanup(); delete (video as unknown as Record<string, unknown>).__safariCleanup }
          video.pause()
          video.removeAttribute("src")
          video.load()
        }
      }
    }, [hlsUrl])

    const handlePlay = () => {
      const video = videoRef.current
      if (!video || !hlsUrl) return

      // Destroy any existing HLS instance before creating a new one
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }

      setState("loading")

      if (Hls.isSupported()) {
        const hls = new Hls({
          debug: false,
          enableWorker: true,
          maxBufferLength: 30,        // only buffer 30s ahead
          maxMaxBufferLength: 60,     // hard cap at 60s
          maxBufferSize: 30 * 1000 * 1000, // 30 MB max buffer
          backBufferLength: 15,       // evict played segments after 15s
        })
        hlsRef.current = hls
        hls.loadSource(hlsUrl)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().then(() => setState("playing")).catch(() => setState("playing"))
        })
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad()
            else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError()
            else setState("error")
          }
        })
        let hasSegments = false
        hls.on(Hls.Events.FRAG_LOADED, () => { hasSegments = true })
        setTimeout(() => { if (!hasSegments) setState((cur) => cur === "loading" ? "error" : cur) }, 12000)
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = hlsUrl
        const onMeta = () => {
          video.play().then(() => setState("playing")).catch(() => setState("playing"))
        }
        const onErr = () => setState("error")
        video.addEventListener("loadedmetadata", onMeta, { once: true })
        video.addEventListener("error", onErr, { once: true })
        // Store refs for cleanup
        ;(video as unknown as Record<string, unknown>).__safariCleanup = () => {
          video.removeEventListener("loadedmetadata", onMeta)
          video.removeEventListener("error", onErr)
        }
      }
    }

    const showOverlay = state !== "playing"

    return (
      <div className="w-full aspect-video rounded-lg overflow-hidden relative bg-slate-900" role="region" aria-label={`Video player: ${title}`}>
        <video
          ref={videoRef}
          controls={state === "playing"}
          className={`w-full h-full ${state === "playing" ? "" : "opacity-0 pointer-events-none absolute inset-0"}`}
          aria-label={title}
          playsInline
        />

        {showOverlay && (
          <div className="absolute inset-0">
            {/* Background */}
            {thumbDataUrl ? (
              <img src={thumbDataUrl} alt={`Thumbnail for ${title}`} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
            ) : (
              <div className="absolute inset-0 flex items-end p-8" style={{ backgroundColor: gradientStyle.bg }}>
                <p className="text-base font-medium leading-snug line-clamp-3 opacity-40" aria-hidden="true" style={{ color: gradientStyle.accent }}>
                  {title}
                </p>
              </div>
            )}

            {/* Idle: play button */}
            {state === "idle" && (
              <button
                onClick={handlePlay}
                aria-label={`Play ${title}`}
                className="absolute inset-0 w-full h-full cursor-pointer group bg-transparent border-0"
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 group-focus-visible:bg-black/20 transition-all duration-200" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 group-hover:bg-blue-500 group-focus-visible:bg-blue-500 flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-focus-visible:scale-105 shadow-2xl">
                    <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </button>
            )}

            {/* Loading: spinner */}
            {state === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40" role="status" aria-label="Loading video">
                <div className="w-10 h-10 border-2 border-white/20 border-t-blue-600 rounded-full animate-spin" />
                <span className="sr-only">Loading video…</span>
              </div>
            )}

            {/* Error */}
            {state === "error" && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-4" role="alert">
                <p className="text-slate-400 text-sm font-medium">This VOD isn&apos;t available yet</p>
                <p className="text-slate-500 text-xs">Still processing — check back soon</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setState("idle") }}
                  className="mt-1 px-5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)

export default VideoPlayer
