"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  TranscriptSegment,
  TranscriptionStatus,
  getCachedTranscript,
  isWebSpeechSupported,
  startTranscription,
} from "@/lib/transcription"

interface TranscriptPanelProps {
  rkey: string
  videoRef: React.RefObject<HTMLVideoElement | null>
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function TranscriptPanel({ rkey, videoRef }: TranscriptPanelProps) {
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [status, setStatus] = useState<TranscriptionStatus>("idle")
  const [isOpen, setIsOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [hasCached, setHasCached] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sessionRef = useRef<{ stop: () => void } | null>(null)
  const supported = isWebSpeechSupported()

  useEffect(() => {
    const cached = getCachedTranscript(rkey)
    if (cached) {
      setSegments(cached.segments)
      setStatus("complete")
      setHasCached(true)
    }
  }, [rkey])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let raf: number
    function tick() {
      if (video) setCurrentTime(video.currentTime)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [videoRef])

  useEffect(() => {
    if (!isOpen || segments.length === 0) return
    const activeIdx = segments.findIndex(
      (s) => currentTime >= s.start && currentTime < s.end
    )
    if (activeIdx === -1) return
    const container = scrollRef.current
    if (!container) return
    const el = container.children[activeIdx] as HTMLElement
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [currentTime, segments, isOpen])

  const handleStart = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (sessionRef.current) {
      sessionRef.current.stop()
    }

    setSegments([])
    setStatus("idle")
    setHasCached(false)

    const session = startTranscription(
      video,
      rkey,
      (segment) => {
        setSegments((prev) => [...prev, segment])
      },
      (newStatus) => {
        setStatus(newStatus)
      }
    )

    sessionRef.current = session
    setIsOpen(true)
  }, [rkey, videoRef])

  const handleStop = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.stop()
      sessionRef.current = null
    }
  }, [])

  const seekTo = useCallback(
    (time: number) => {
      const video = videoRef.current
      if (video) {
        video.currentTime = time
      }
    },
    [videoRef]
  )

  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.stop()
      }
    }
  }, [])

  if (!supported) return null

  const isActive = status === "listening" || status === "paused"

  return (
    <div className="mt-4" role="region" aria-label="Transcript">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="transcript-content"
          className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          Transcript
          {segments.length > 0 && (
            <span className="text-slate-500">
              ({segments.length} segment{segments.length !== 1 ? "s" : ""})
            </span>
          )}
          {hasCached && (
            <span className="text-slate-500 text-[10px]">cached</span>
          )}
        </button>

        {isOpen && !isActive && (
          <button
            onClick={handleStart}
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium bg-emerald-950 hover:bg-emerald-900 text-emerald-400 rounded-full transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {segments.length > 0 ? "Re-transcribe" : "Start transcribing"}
          </button>
        )}

        {isActive && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {status === "listening" ? "Listening..." : "Paused — play video to continue"}
            </span>
            <button
              onClick={handleStop}
              className="px-2.5 py-1 text-[11px] font-medium bg-red-950 hover:bg-red-900 text-red-400 rounded-full transition-colors"
            >
              Stop
            </button>
          </div>
        )}

        {status === "error" && (
          <span className="text-[11px] text-red-400">
            Microphone access required — check browser permissions
          </span>
        )}
      </div>

      {isOpen && (
        <div
          id="transcript-content"
          ref={scrollRef}
          className="mt-3 max-h-64 overflow-y-auto scrollbar-hide bg-slate-950 rounded-lg border border-slate-800"
          tabIndex={-1}
        >
          {segments.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-slate-500">
                {isActive
                  ? "Waiting for speech... Make sure the video is playing with audio."
                  : "Press \"Start transcribing\" then play the video. The browser will listen to the audio output and generate a transcript in real time."}
              </p>
              <p className="text-[10px] text-slate-500 mt-2">
                Transcripts are cached locally so you only need to generate them once.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {segments.map((seg, i) => {
                const isActive =
                  currentTime >= seg.start && currentTime < seg.end
                return (
                  <button
                    key={i}
                    onClick={() => seekTo(seg.start)}
                    aria-label={`Jump to ${formatTimestamp(seg.start)}: ${seg.text}`}
                    aria-current={isActive ? "true" : undefined}
                    className={`w-full text-left px-4 py-2.5 flex gap-3 hover:bg-slate-900 transition-colors ${
                      isActive ? "bg-slate-800" : ""
                    }`}
                  >
                    <span className="text-[11px] font-mono text-slate-500 shrink-0 pt-0.5 w-10">
                      {formatTimestamp(seg.start)}
                    </span>
                    <span
                      className={`text-sm leading-relaxed ${
                        isActive ? "text-white" : "text-slate-400"
                      }`}
                    >
                      {seg.text}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
