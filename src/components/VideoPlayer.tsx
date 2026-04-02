"use client"

import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from "react"
import { createPlayer, Poster } from "@videojs/react"
import { videoFeatures, Video, VideoSkin } from "@videojs/react/video"
import "@videojs/react/video/skin.css"
import { titleToGradient } from "@/lib/gradients"
import QualitySelector, { type QualityLevel } from "./QualitySelector"

const QUALITY_STORAGE_KEY = "hughlou-quality-pref"

const Player = createPlayer({ features: videoFeatures })

interface VideoPlayerProps {
  hlsUrl: string
  title: string
  poster?: string | null
  thumbDataUrl?: string | null
}

type PlayerState = "idle" | "loading" | "playing" | "error" | "upstream-down"

/** Read persisted quality preference: -1 = auto, or a target height (e.g. 720). */
function loadQualityPref(): number {
  try {
    const v = localStorage.getItem(QUALITY_STORAGE_KEY)
    return v != null ? Number(v) : -1
  } catch {
    return -1
  }
}

function saveQualityPref(height: number) {
  try {
    localStorage.setItem(QUALITY_STORAGE_KEY, String(height))
  } catch { /* ignore */ }
}

/**
 * Inner component rendered inside Player.Provider so it can use Player.usePlayer() / useMedia().
 */
function VideoPlayerInner({
  hlsUrl,
  title,
  poster,
  thumbDataUrl,
  videoRef,
}: VideoPlayerProps & { videoRef: React.RefObject<HTMLVideoElement | null> }) {
  const [state, setState] = useState<PlayerState>("idle")
  const hlsRef = useRef<import("hls.js").default | null>(null)
  const internalVideoRef = useRef<HTMLVideoElement | null>(null)

  // Quality state
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([])
  const [currentQualityLevel, setCurrentQualityLevel] = useState<number>(-1) // -1 = auto

  const gradientStyle = titleToGradient(title)

  // Cleanup hls.js on unmount or URL change
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      setQualityLevels([])
      setCurrentQualityLevel(-1)
    }
  }, [hlsUrl])

  // Sync the internal video ref to the forwarded ref
  const setVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      internalVideoRef.current = el
      ;(videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el
    },
    [videoRef]
  )

  /** Apply the stored quality preference (or auto) to the hls.js instance. */
  const applyQualityPref = useCallback((hls: import("hls.js").default) => {
    const pref = loadQualityPref()
    if (pref === -1) {
      hls.currentLevel = -1 // auto
      setCurrentQualityLevel(-1)
      return
    }
    // Find level whose height matches the stored preference
    const match = hls.levels.findIndex((l) => l.height === pref)
    if (match !== -1) {
      hls.currentLevel = match
      setCurrentQualityLevel(match)
    } else {
      hls.currentLevel = -1
      setCurrentQualityLevel(-1)
    }
  }, [])

  const handleSelectQuality = useCallback((levelIndex: number) => {
    const hls = hlsRef.current
    if (!hls) return

    if (levelIndex === -1) {
      hls.currentLevel = -1
      setCurrentQualityLevel(-1)
      saveQualityPref(-1)
    } else {
      hls.currentLevel = levelIndex
      setCurrentQualityLevel(levelIndex)
      const level = hls.levels[levelIndex]
      if (level) saveQualityPref(level.height)
    }
  }, [])

  const handlePlay = useCallback(async () => {
    if (!hlsUrl) return

    // Destroy previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    setState("loading")
    setQualityLevels([])
    setCurrentQualityLevel(-1)

    // Probe upstream availability
    try {
      const probe = await fetch(hlsUrl, { method: "HEAD", signal: AbortSignal.timeout(6000) })
      if (!probe.ok) { setState("upstream-down"); return }
    } catch {
      setState("upstream-down"); return
    }

    const video = internalVideoRef.current
    if (!video) { setState("error"); return }

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
        // Populate available quality levels
        const levels: QualityLevel[] = hls.levels.map((l, i) => ({
          index: i,
          height: l.height,
          bitrate: l.bitrate,
        }))
        setQualityLevels(levels)

        // Apply saved preference
        applyQualityPref(hls)

        video.play().then(() => setState("playing")).catch((err) => {
          if (err.name === "NotAllowedError") {
            video.muted = true
            video.play().then(() => setState("playing")).catch(() => setState("playing"))
          } else {
            setState("playing")
          }
        })
      })

      hls.on(Hls.Events.LEVEL_SWITCHED, () => {
        // When auto-switching, keep UI in sync
        if (hls.autoLevelEnabled) {
          setCurrentQualityLevel(-1)
        }
      })

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) setState("upstream-down")
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError()
          else setState("error")
        }
      })
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS — no quality control available
      video.src = hlsUrl
      video.addEventListener("loadedmetadata", () => {
        video.play().then(() => setState("playing")).catch(() => setState("playing"))
      }, { once: true })
      video.addEventListener("error", () => setState("upstream-down"), { once: true })
    }
  }, [hlsUrl, applyQualityPref])

  const showOverlay = state !== "playing"
  const showQuality = state === "playing" && qualityLevels.length > 1

  return (
    <div
      className="w-full aspect-video sm:rounded-md overflow-hidden relative bg-slate-950"
      role="region"
      aria-label={`Video player: ${title}`}
      tabIndex={-1}
    >
      {/* Video.js player — hidden until playing */}
      <div className={`w-full h-full ${state === "playing" ? "" : "opacity-0 pointer-events-none absolute inset-0"}`}>
        <VideoSkin>
          {(thumbDataUrl || poster) && (
            <Poster src={(thumbDataUrl || poster)!} alt={title} />
          )}
          <Video
            ref={setVideoRef}
            playsInline
            aria-label={title}
          />
        </VideoSkin>
      </div>

      {/* Quality selector — overlaid on the player, above the control bar */}
      {showQuality && (
        <QualitySelector
          levels={qualityLevels}
          currentLevel={currentQualityLevel}
          onSelect={handleSelectQuality}
        />
      )}

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
                <div className="w-14 h-14 rounded-md bg-blue-600 group-hover:bg-blue-500 group-focus-visible:bg-blue-500 flex items-center justify-center transition-colors duration-150 shadow-lg">
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

const VideoPlayer = forwardRef<HTMLVideoElement | null, VideoPlayerProps>(
  function VideoPlayer(props, ref) {
    const videoRef = useRef<HTMLVideoElement | null>(null)
    useImperativeHandle(ref, () => videoRef.current!, [])

    return (
      <Player.Provider>
        <VideoPlayerInner {...props} videoRef={videoRef} />
      </Player.Provider>
    )
  }
)

export default VideoPlayer
