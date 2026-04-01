"use client"

import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from "react"
import type HlsType from "hls.js"
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
    const videoRef = useRef<HTMLVideoElement>(null)
    const hlsRef = useRef<HlsType | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [state, setState] = useState<PlayerState>("idle")

    useImperativeHandle(ref, () => videoRef.current!, [])

    const gradientStyle = titleToGradient(title)

    useEffect(() => {
      return () => {
        if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
      }
    }, [hlsUrl])

    const handlePlay = useCallback(async () => {
      const video = videoRef.current
      if (!video || !hlsUrl) return

      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }

      setState("loading")

      try {
        const probe = await fetch(hlsUrl, { method: "HEAD", signal: AbortSignal.timeout(6000) })
        if (!probe.ok) { setState("upstream-down"); return }
      } catch {
        setState("upstream-down"); return
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
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) setState("upstream-down")
            else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError()
            else setState("error")
          }
        })
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = hlsUrl
        video.addEventListener("loadedmetadata", () => {
          video.play().then(() => setState("playing")).catch(() => setState("playing"))
        }, { once: true })
        video.addEventListener("error", () => setState("upstream-down"), { once: true })
      }
    }, [hlsUrl])

    // YouTube-style keyboard controls
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Don't capture when user is typing in an input/textarea
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

        const video = videoRef.current

        switch (e.key) {
          case " ":
          case "k":
            e.preventDefault()
            if (state === "idle") {
              handlePlay()
            } else if (state === "playing" && video) {
              if (video.paused) video.play()
              else video.pause()
            }
            break
          case "j":
            if (state === "playing" && video) {
              e.preventDefault()
              video.currentTime = Math.max(0, video.currentTime - 10)
            }
            break
          case "l":
            if (state === "playing" && video) {
              e.preventDefault()
              video.currentTime = Math.min(video.duration, video.currentTime + 10)
            }
            break
          case "ArrowLeft":
            if (state === "playing" && video) {
              e.preventDefault()
              video.currentTime = Math.max(0, video.currentTime - 5)
            }
            break
          case "ArrowRight":
            if (state === "playing" && video) {
              e.preventDefault()
              video.currentTime = Math.min(video.duration, video.currentTime + 5)
            }
            break
          case "ArrowUp":
            if (state === "playing" && video) {
              e.preventDefault()
              video.volume = Math.min(1, video.volume + 0.1)
            }
            break
          case "ArrowDown":
            if (state === "playing" && video) {
              e.preventDefault()
              video.volume = Math.max(0, video.volume - 0.1)
            }
            break
          case "m":
            if (state === "playing" && video) {
              e.preventDefault()
              video.muted = !video.muted
            }
            break
          case "f":
            if (state === "playing" && video) {
              e.preventDefault()
              if (document.fullscreenElement) document.exitFullscreen()
              else video.requestFullscreen?.()
            }
            break
        }
      }

      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }, [state, handlePlay])

    const showOverlay = state !== "playing"

    return (
      <div
        ref={containerRef}
        className="w-full aspect-video sm:rounded-lg overflow-hidden relative bg-slate-950"
        role="region"
        aria-label={`Video player: ${title}`}
        tabIndex={-1}
      >
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
