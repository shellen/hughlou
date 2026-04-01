"use client"

import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from "react"
import Artplayer from "artplayer"
import { titleToGradient } from "@/lib/gradients"

interface VideoPlayerProps {
  hlsUrl: string
  title: string
  poster?: string | null
  thumbDataUrl?: string | null
}

type PlayerState = "idle" | "loading" | "playing" | "error" | "upstream-down"

const VideoPlayer = forwardRef<HTMLVideoElement | null, VideoPlayerProps>(
  function VideoPlayer({ hlsUrl, title, poster, thumbDataUrl }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const artRef = useRef<Artplayer | null>(null)
    const videoElRef = useRef<HTMLVideoElement | null>(null)
    const [state, setState] = useState<PlayerState>("idle")

    useImperativeHandle(ref, () => videoElRef.current!, [])

    const gradientStyle = titleToGradient(title)

    // Cleanup ArtPlayer on unmount or URL change
    useEffect(() => {
      return () => {
        if (artRef.current) {
          artRef.current.destroy(false)
          artRef.current = null
        }
      }
    }, [hlsUrl])

    const handlePlay = useCallback(async () => {
      if (!containerRef.current || !hlsUrl) return

      // Destroy previous instance
      if (artRef.current) {
        artRef.current.destroy(false)
        artRef.current = null
      }

      setState("loading")

      // Probe upstream availability
      try {
        const probe = await fetch(hlsUrl, { method: "HEAD", signal: AbortSignal.timeout(6000) })
        if (!probe.ok) { setState("upstream-down"); return }
      } catch {
        setState("upstream-down"); return
      }

      // Dynamically import hls.js for tree-shaking
      const { default: Hls } = await import("hls.js")

      const art = new Artplayer({
        container: containerRef.current,
        url: hlsUrl,
        type: "m3u8",
        customType: {
          m3u8: function (video: HTMLVideoElement, url: string, art: Artplayer) {
            if (Hls.isSupported()) {
              const hls = new Hls({
                manifestLoadingTimeOut: 8000,
                manifestLoadingMaxRetry: 1,
              })
              hls.loadSource(url)
              hls.attachMedia(video)
              hls.on(Hls.Events.ERROR, (_event: string, data: { fatal: boolean; type: string }) => {
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
              art.on("destroy", () => hls.destroy())
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
              video.src = url
              video.addEventListener("error", () => setState("upstream-down"), { once: true })
            }
          },
        },
        poster: thumbDataUrl || poster || "",
        volume: 0.8,
        muted: false,
        autoplay: true,
        autoMini: false,
        autoSize: false,
        autoOrientation: true,
        playbackRate: true,
        aspectRatio: false,
        fullscreen: true,
        fullscreenWeb: true,
        pip: true,
        setting: true,
        flip: false,
        lock: true,
        fastForward: true,
        theme: "#3b82f6",
        lang: "en",
      })

      artRef.current = art
      videoElRef.current = art.video

      art.on("ready", () => {
        videoElRef.current = art.video
        art.play().then(() => {
          setState("playing")
        }).catch((err: Error) => {
          if (err.name === "NotAllowedError") {
            art.muted = true
            art.play().then(() => setState("playing")).catch(() => setState("playing"))
          } else {
            setState("playing")
          }
        })
      })

      art.on("error", () => {
        setState("error")
      })
    }, [hlsUrl, poster, thumbDataUrl])

    const showOverlay = state !== "playing"

    return (
      <div
        className="w-full aspect-video sm:rounded-lg overflow-hidden relative bg-slate-950"
        role="region"
        aria-label={`Video player: ${title}`}
        tabIndex={-1}
      >
        {/* ArtPlayer container — hidden until playing */}
        <div
          ref={containerRef}
          className={`w-full h-full ${state === "playing" ? "" : "opacity-0 pointer-events-none absolute inset-0"}`}
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
                  <div className="w-14 h-14 rounded-xl bg-blue-600 group-hover:bg-blue-500 group-focus-visible:bg-blue-500 flex items-center justify-center transition-colors duration-150 shadow-lg">
                    <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </button>
            )}

            {state === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40" role="status" aria-label="Loading video">
                <div className="w-10 h-10 border-2 border-white/20 border-t-blue-600 rounded-full animate-spin" />
                <span className="sr-only">Loading video…</span>
              </div>
            )}

            {state === "upstream-down" && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4 px-6" role="alert">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-sm font-medium">Stream.place is experiencing issues</p>
                  <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">The VOD service is temporarily unavailable.<br />This usually resolves on its own.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); setState("idle") }}
                    className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors duration-150"
                  >
                    Retry
                  </button>
                  <a
                    href="https://stream.place"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-white transition-colors duration-150"
                  >
                    Check status
                  </a>
                </div>
              </div>
            )}

            {state === "error" && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4 px-6" role="alert">
                <p className="text-slate-400 text-sm font-medium">This VOD isn&apos;t available yet</p>
                <p className="text-slate-500 text-xs">Still processing — check back soon</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setState("idle") }}
                  className="mt-1 px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors duration-150"
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
