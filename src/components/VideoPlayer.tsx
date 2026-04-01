"use client"

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react"
import Hls from "hls.js"

interface VideoPlayerProps {
  hlsUrl: string
  title: string
  poster?: string | null
  thumbDataUrl?: string | null
}

const VideoPlayer = forwardRef<HTMLVideoElement | null, VideoPlayerProps>(
  function VideoPlayer({ hlsUrl, title, poster, thumbDataUrl }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [error, setError] = useState(false)

    useImperativeHandle(ref, () => videoRef.current!, [])

    // Load HLS eagerly on mount — matches istream (confirmed working VOD JAM app).
    // No custom play button, no programmatic play(). Native <video controls> handles everything.
    useEffect(() => {
      const video = videoRef.current
      if (!video || !hlsUrl) return

      setError(false)

      if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(hlsUrl)
        hls.attachMedia(video)
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad()
            else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError()
            else setError(true)
          }
        })
        return () => hls.destroy()
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS
        video.src = hlsUrl
        video.addEventListener("error", () => setError(true), { once: true })
        return () => {
          video.pause()
          video.removeAttribute("src")
          video.load()
        }
      }
    }, [hlsUrl])

    // Use captured thumbnail, then server thumbnail, as poster
    const posterSrc = thumbDataUrl || poster || undefined

    if (error) {
      return (
        <div className="w-full aspect-video rounded-lg overflow-hidden bg-slate-900 flex flex-col items-center justify-center gap-4" role="alert">
          <p className="text-slate-400 text-sm font-medium">This VOD isn&apos;t available yet</p>
          <p className="text-slate-500 text-xs">Still processing — check back soon</p>
          <button
            onClick={() => setError(false)}
            className="mt-1 px-5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )
    }

    return (
      <div className="w-full aspect-video rounded-lg overflow-hidden relative bg-black" role="region" aria-label={`Video player: ${title}`}>
        <video
          ref={videoRef}
          controls
          playsInline
          poster={posterSrc}
          className="w-full h-full"
          style={{ backgroundColor: "#000" }}
          aria-label={title}
        />
      </div>
    )
  }
)

export default VideoPlayer
