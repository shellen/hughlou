const THUMB_PREFIX = "atmo-thumb-"
const THUMB_WIDTH = 320
const THUMB_HEIGHT = 180
const SEEK_TIME = 60 // seconds into the video

/**
 * Get a cached thumbnail data URL from localStorage
 */
export function getCachedThumb(rkey: string): string | null {
  try {
    return localStorage.getItem(`${THUMB_PREFIX}${rkey}`)
  } catch {
    return null
  }
}

/**
 * Save a thumbnail data URL to localStorage
 */
function saveThumb(rkey: string, dataUrl: string): void {
  try {
    localStorage.setItem(`${THUMB_PREFIX}${rkey}`, dataUrl)
  } catch {
    // localStorage full — evict oldest thumbnails
    evictOldThumbs()
    try {
      localStorage.setItem(`${THUMB_PREFIX}${rkey}`, dataUrl)
    } catch {
      // still full, skip
    }
  }
}

/**
 * Evict the first ~10 thumbnail entries to free space
 */
function evictOldThumbs(): void {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(THUMB_PREFIX)) keys.push(key)
  }
  // Remove first 10 (oldest by insertion order)
  keys.slice(0, 10).forEach((k) => localStorage.removeItem(k))
}

/**
 * Capture a thumbnail from an HLS video URL by seeking to SEEK_TIME.
 * Uses a hidden video + canvas. Returns a data URL on success, null on failure.
 * Works on Safari (native HLS) and other browsers (via hls.js).
 */
export async function captureThumb(
  hlsUrl: string,
  rkey: string
): Promise<string | null> {
  // Check cache first
  const cached = getCachedThumb(rkey)
  if (cached) return cached

  return new Promise((resolve) => {
    const video = document.createElement("video")
    video.muted = true
    video.playsInline = true
    video.preload = "auto"
    video.style.position = "fixed"
    video.style.top = "-9999px"
    video.style.width = "1px"
    video.style.height = "1px"
    document.body.appendChild(video)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let hlsInstance: any = null
    const timeout = setTimeout(() => cleanup(null), 15000)

    function cleanup(result: string | null) {
      clearTimeout(timeout)
      video.pause()
      video.removeAttribute("src")
      video.load()
      if (hlsInstance && typeof hlsInstance.destroy === "function") {
        hlsInstance.destroy()
      }
      document.body.removeChild(video)
      resolve(result)
    }

    function onSeeked() {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = THUMB_WIDTH
        canvas.height = THUMB_HEIGHT
        const ctx = canvas.getContext("2d")
        if (!ctx) { cleanup(null); return }

        ctx.drawImage(video, 0, 0, THUMB_WIDTH, THUMB_HEIGHT)

        // Check if the frame is actually rendered (not blank)
        const pixel = ctx.getImageData(THUMB_WIDTH / 2, THUMB_HEIGHT / 2, 1, 1).data
        if (pixel[0] === 0 && pixel[1] === 0 && pixel[2] === 0 && pixel[3] === 0) {
          cleanup(null)
          return
        }

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7)
        saveThumb(rkey, dataUrl)
        cleanup(dataUrl)
      } catch {
        // Canvas taint / security error — fall back to gradient
        cleanup(null)
      }
    }

    function seekAndCapture() {
      video.addEventListener("seeked", onSeeked, { once: true })
      video.currentTime = Math.min(SEEK_TIME, video.duration > 0 ? video.duration * 0.1 : SEEK_TIME)
    }

    // Try loading
    import("hls.js").then((HlsModule) => {
      const Hls = HlsModule.default
      if (Hls.isSupported()) {
        const hls = new Hls({
          debug: false,
          enableWorker: false,
          // Only load enough to capture a frame
          maxBufferLength: 5,
          maxMaxBufferLength: 10,
        })
        hlsInstance = hls
        hls.loadSource(hlsUrl)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, seekAndCapture)
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) cleanup(null)
        })
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS
        video.src = hlsUrl
        video.addEventListener("loadedmetadata", seekAndCapture, { once: true })
        video.addEventListener("error", () => cleanup(null), { once: true })
      } else {
        cleanup(null)
      }
    }).catch(() => cleanup(null))
  })
}

/**
 * Hook-friendly: capture thumbnails for a list of rkeys, updating a callback as each resolves.
 * Processes sequentially to avoid slamming the browser with too many hidden videos.
 * Pass an AbortSignal to cancel remaining captures when the component unmounts.
 */
export async function captureThumbsBatch(
  items: Array<{ rkey: string; hlsUrl: string }>,
  onCapture: (rkey: string, dataUrl: string) => void,
  signal?: AbortSignal
): Promise<void> {
  for (const item of items) {
    // Stop processing if cancelled (e.g. component unmounted)
    if (signal?.aborted) return

    // Skip if already cached
    const cached = getCachedThumb(item.rkey)
    if (cached) {
      onCapture(item.rkey, cached)
      continue
    }
    const result = await captureThumb(item.hlsUrl, item.rkey)
    if (signal?.aborted) return
    if (result) {
      onCapture(item.rkey, result)
    }
  }
}
