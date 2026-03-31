// Web Speech API transcription service with localStorage caching
// Listens to a video element's audio and produces timestamped transcript segments

export interface TranscriptSegment {
  start: number // seconds
  end: number // seconds
  text: string
}

export interface TranscriptData {
  rkey: string
  segments: TranscriptSegment[]
  complete: boolean
  generatedAt: string
}

const CACHE_PREFIX = "atmo-transcript-"

// --- localStorage cache ---

export function getCachedTranscript(rkey: string): TranscriptData | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + rkey)
    if (!raw) return null
    const data = JSON.parse(raw) as TranscriptData
    // Only return if complete or has segments
    if (data.segments && data.segments.length > 0) return data
    return null
  } catch {
    return null
  }
}

function saveTranscript(data: TranscriptData) {
  try {
    localStorage.setItem(CACHE_PREFIX + data.rkey, JSON.stringify(data))
  } catch {
    // localStorage full — evict oldest transcripts
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(CACHE_PREFIX)) keys.push(k)
    }
    if (keys.length > 0) {
      // Remove first 3 oldest entries
      keys.slice(0, 3).forEach((k) => localStorage.removeItem(k))
      try {
        localStorage.setItem(CACHE_PREFIX + data.rkey, JSON.stringify(data))
      } catch {
        // give up
      }
    }
  }
}

// --- Web Speech API transcription ---

type OnSegment = (segment: TranscriptSegment) => void
type OnStatusChange = (status: TranscriptionStatus) => void

export type TranscriptionStatus =
  | "idle"
  | "listening"
  | "paused"
  | "complete"
  | "error"
  | "unsupported"

interface TranscriptionSession {
  stop: () => void
  status: TranscriptionStatus
}

export function isWebSpeechSupported(): boolean {
  return !!(
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  )
}

export function startTranscription(
  videoElement: HTMLVideoElement,
  rkey: string,
  onSegment: OnSegment,
  onStatusChange: OnStatusChange
): TranscriptionSession {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition

  if (!SpeechRecognition) {
    onStatusChange("unsupported")
    return { stop: () => {}, status: "unsupported" }
  }

  const segments: TranscriptSegment[] = []
  let status: TranscriptionStatus = "idle"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recognition: any = null
  let stopped = false
  let segmentStart = 0

  function setStatus(s: TranscriptionStatus) {
    status = s
    onStatusChange(s)
  }

  function createRecognition() {
    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = "en-US"
    rec.maxAlternatives = 1

    rec.onstart = () => {
      setStatus("listening")
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal && result[0].transcript.trim()) {
          const now = videoElement.currentTime
          const segment: TranscriptSegment = {
            start: segmentStart,
            end: now,
            text: result[0].transcript.trim(),
          }
          segments.push(segment)
          onSegment(segment)
          segmentStart = now

          // Periodically save to cache
          if (segments.length % 5 === 0) {
            saveTranscript({
              rkey,
              segments: [...segments],
              complete: false,
              generatedAt: new Date().toISOString(),
            })
          }
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (event: any) => {
      if (stopped) return
      if (event.error === "no-speech") {
        // This is normal — just restart
        segmentStart = videoElement.currentTime
        try { rec.stop() } catch { /* ignore */ }
        return
      }
      if (event.error === "aborted") return
      console.warn("Speech recognition error:", event.error)
      setStatus("error")
    }

    rec.onend = () => {
      if (stopped) {
        // Final save
        saveTranscript({
          rkey,
          segments: [...segments],
          complete: true,
          generatedAt: new Date().toISOString(),
        })
        setStatus("complete")
        return
      }
      // Auto-restart if video is still playing
      if (!videoElement.paused && !videoElement.ended) {
        segmentStart = videoElement.currentTime
        setTimeout(() => {
          if (!stopped) {
            try {
              rec.start()
            } catch {
              // Might fail if already started
            }
          }
        }, 100)
      } else {
        setStatus("paused")
      }
    }

    return rec
  }

  recognition = createRecognition()

  // Start when video plays
  function onPlay() {
    if (stopped || !recognition) return
    segmentStart = videoElement.currentTime
    try {
      recognition.start()
    } catch {
      // Already started
    }
  }

  function onPause() {
    if (stopped || !recognition) return
    try {
      recognition.stop()
    } catch {
      // Already stopped
    }
    setStatus("paused")
  }

  function onEnded() {
    stop()
  }

  videoElement.addEventListener("play", onPlay)
  videoElement.addEventListener("pause", onPause)
  videoElement.addEventListener("ended", onEnded)

  // If video is already playing, start immediately
  if (!videoElement.paused) {
    segmentStart = videoElement.currentTime
    try {
      recognition.start()
    } catch {
      // ignore
    }
  }

  function stop() {
    stopped = true
    videoElement.removeEventListener("play", onPlay)
    videoElement.removeEventListener("pause", onPause)
    videoElement.removeEventListener("ended", onEnded)
    if (recognition) {
      try {
        recognition.stop()
      } catch {
        // ignore
      }
    }
    // Save final transcript
    if (segments.length > 0) {
      saveTranscript({
        rkey,
        segments: [...segments],
        complete: true,
        generatedAt: new Date().toISOString(),
      })
    }
    setStatus("complete")
  }

  return { stop, get status() { return status } }
}

// --- Declare Web Speech API types for TypeScript ---

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}
