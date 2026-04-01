"use client"

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react"
import type HlsType from "hls.js"

interface VideoPlayerProps {
  hlsUrl: string
  title: string
  poster?: string | null
  thumbDataUrl?: string | null
}

type PlayerState = "idle" | "loading" | "playing" | "error" | "upstream-down"

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
  function VideoPlayer({ hlsUrl, title, poster, thumbDataUrl }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const hlsRef = useRef<HlsType | null>(null)
    const [state, setState] = useState<PlayerState>("idle")

    useImperativeHandle(ref, () => videoRef.current!, [])

    const gradientStyle = titleToGradient(title)

    useEffect(() => {
      return () => {
        if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
      }
    }, [hlsUrl])

    const handlePlay = async () => {
      const video = videoRef.current
      if (!video || !hlsUrl) return

      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }

      setState("loading")

      // Pre-flight: check if the VOD endpoint is reachable before loading HLS.
      // This gives fast feedback (~3s) instead of waiting for HLS.js internal
      // retries to exhaust (which can take 20-30s).
      try {
        const probe = await fetch(hlsUrl, { method: "HEAD", signal: AbortSignal.timeout(6000) })
        if (!probe.ok) {
          setState("upstream-down")
          return
        }
      } catch {
        setState("upstream-down")
        return
      }

      const { default: Hls } = await import("hls.js")

      if (Hls.isSupported()) {
        const hls = new Hls({
          manifestLoadingTimeOut: 8000,
          manifestLoadingMaxRetry: 1,
        })
        hlsRef.current = hls
        hls.loadSource(hlsUrl)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().then(() => setState("playing")).catch((err) => {
            if (err.name === "NotAllowedError") {
              video.muted = true
              video.play().then(() => setState("playing")).catch(() => setState("playing"))
            } else {
              setState("playing")
            }
          })
        })
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              setState("upstream-down")
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError()
            } else {
              setState("error")
            }
          }
        })
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = hlsUrl
        video.addEventListener("loadedmetadata", () => {
          video.play().then(() => setState("playing")).catch(() => setState("playing"))
        }, { once: true })
        video.addEventListener("error", () => setState("upstream-down"), { once: true })
      }
    }

    const showOverlay = state !== "playing"

    return (
      <div className="w-full aspect-video sm:rounded-lg overflow-hidden relative bg-[#111113]" role="region" aria-label={`Video player: ${title}`}>
        <video
          ref={videoRef}
          controls={state === "playing"}
          playsInline
          className={`w-full h-full ${state === "playing" ? "" : "opacity-0 pointer-events-none absolute inset-0"}`}
          aria-label={title}
        />

        {showOverlay && (
          <div className="absolute inset-0">
            {(thumbDataUrl || poster) ? (
              <img src={(thumbDataUrl || poster)!} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} aria-hidden="true" />
            ) : (
              <div className="absolute inset-0 flex items-end p-8" style={{ backgroundColor: gradientStyle.bg }}>
                <p className="text-base font-medium leading-snug line-clamp-3 opacity-40" aria-hidden="true" style={{ color: gradientStyle.accent }}>
                  {title}
                </p>
              </div>
            )}

            {state === "idle" && (
              <button
                onClick={handlePlay}
                aria-label={`Play ${title}`}
                className="absolute inset-0 w-full h-full cursor-pointer group bg-transparent border-0"
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 group-focus-visible:bg-black/20 transition-colors duration-150" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#2563eb] group-hover:bg-[#3b82f6] group-focus-visible:bg-[#3b82f6] flex items-center justify-center transition-colors duration-150 shadow-2xl">
                    <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </button>
            )}

            {state === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40" role="status" aria-label="Loading video">
                <div className="w-10 h-10 border-2 border-white/20 border-t-[#2563eb] rounded-full animate-spin" />
                <span className="sr-only">Loading video…</span>
              </div>
            )}

            {state === "upstream-down" && (
              <div className="absolute inset-0 bg-[#111113] flex flex-col items-center justify-center gap-5 px-6" role="alert">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-[#94949e] text-sm font-medium">Stream.place is experiencing issues</p>
                  <p className="text-[#62626a] text-xs mt-1.5 leading-relaxed">The VOD service is temporarily unavailable.<br />This usually resolves on its own.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); setState("idle") }}
                    className="px-5 py-2 text-xs font-medium bg-[#1c1c1f] hover:bg-[#2a2a2e] text-white rounded-lg transition-colors duration-150"
                  >
                    Retry
                  </button>
                  <a
                    href="https://stream.place"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2 text-xs font-medium text-[#62626a] hover:text-white transition-colors duration-150"
                  >
                    Check status
                  </a>
                </div>
              </div>
            )}

            {state === "error" && (
              <div className="absolute inset-0 bg-[#111113] flex flex-col items-center justify-center gap-4 px-6" role="alert">
                <p className="text-[#94949e] text-sm font-medium">This VOD isn&apos;t available yet</p>
                <p className="text-[#62626a] text-xs">Still processing — check back soon</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setState("idle") }}
                  className="mt-1 px-5 py-2 text-xs font-medium bg-[#1c1c1f] hover:bg-[#2a2a2e] text-white rounded-lg transition-colors duration-150"
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
