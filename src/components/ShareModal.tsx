"use client"

import { useEffect, useRef, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCopy, faCheck, faMessage } from "@fortawesome/free-solid-svg-icons"
import { faBluesky, faThreads, faMastodon, faRedditAlien, faLinkedin, faFacebookF } from "@fortawesome/free-brands-svg-icons"
import { formatDuration } from "@/lib/api"

interface ShareModalProps {
  open: boolean
  onClose: () => void
  videoTitle: string
  videoRef: React.RefObject<HTMLVideoElement | null>
  blueskyShareUrl: string
}

export default function ShareModal({ open, onClose, videoTitle, videoRef }: ShareModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [copied, setCopied] = useState(false)
  const [useTimestamp, setUseTimestamp] = useState(false)
  const [mastodonInstance, setMastodonInstance] = useState("")
  const [showMastodonInput, setShowMastodonInput] = useState(false)

  const currentSeconds = Math.floor(videoRef.current?.currentTime || 0)
  const timestampLabel = formatDuration(currentSeconds * 1_000_000_000)

  const getShareUrl = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete("t")
    if (useTimestamp && currentSeconds > 0) {
      url.searchParams.set("t", String(currentSeconds))
    }
    return url.toString()
  }

  const getShareText = () => {
    if (useTimestamp && currentSeconds > 0) {
      return `${videoTitle} at ${timestampLabel}`
    }
    return videoTitle
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleClose = () => onClose()
    dialog.addEventListener("close", handleClose)
    return () => dialog.removeEventListener("close", handleClose)
  }, [onClose])

  // Reset mastodon input when closing
  useEffect(() => {
    if (!open) {
      setShowMastodonInput(false)
      setCopied(false)
    }
  }, [open])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* fallback */ }
  }

  const openShare = (url: string) => {
    window.open(url, "_blank", "width=600,height=600")
    onClose()
  }

  const shareText = getShareText()
  const shareUrl = getShareUrl()

  const shareToBluesky = () => {
    openShare(`https://bsky.app/intent/compose?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`)
  }

  const shareToThreads = () => {
    openShare(`https://threads.net/intent/post?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`)
  }

  const shareToMastodon = () => {
    const instance = mastodonInstance.trim() || "mastodon.social"
    openShare(`https://${instance}/share?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`)
    setShowMastodonInput(false)
  }

  const shareToReddit = () => {
    openShare(`https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`)
  }

  const shareToLinkedIn = () => {
    openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`)
  }

  const shareToFacebook = () => {
    openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)
  }

  const shareViaMessages = () => {
    window.location.href = `sms:&body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
    onClose()
  }

  const isAppleDevice = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)

  const itemClass = "w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-800 text-slate-200 transition-colors text-left"

  if (!open) return <dialog ref={dialogRef} />

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/60 bg-transparent p-0 m-auto max-w-sm w-full outline-none"
      onClick={(e) => { if (e.target === dialogRef.current) onClose() }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">Share this talk</h2>
          <button
            onClick={onClose}
            aria-label="Close share dialog"
            className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Share options list */}
        <div className="p-2">
          {/* Copy Link */}
          <button onClick={handleCopy} className={itemClass}>
            <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={`w-4 h-4 ${copied ? "text-emerald-400" : "text-slate-400"}`} />
            <span className="text-sm">{copied ? "Copied!" : "Copy link"}</span>
          </button>

          {/* Bluesky */}
          <button onClick={shareToBluesky} className={itemClass}>
            <FontAwesomeIcon icon={faBluesky} className="w-4 h-4 text-sky-400" />
            <span className="text-sm">Bluesky</span>
          </button>

          {/* Threads */}
          <button onClick={shareToThreads} className={itemClass}>
            <FontAwesomeIcon icon={faThreads} className="w-4 h-4 text-slate-300" />
            <span className="text-sm">Threads</span>
          </button>

          {/* Mastodon */}
          {!showMastodonInput ? (
            <button onClick={() => setShowMastodonInput(true)} className={itemClass}>
              <FontAwesomeIcon icon={faMastodon} className="w-4 h-4 text-purple-400" />
              <span className="text-sm">Mastodon</span>
            </button>
          ) : (
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-3 mb-2">
                <FontAwesomeIcon icon={faMastodon} className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-slate-200 font-medium">Mastodon</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mastodonInstance}
                  onChange={(e) => setMastodonInstance(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") shareToMastodon() }}
                  placeholder="mastodon.social"
                  autoFocus
                  className="flex-1 px-2.5 py-1.5 text-sm rounded-md border border-slate-700 bg-slate-800 text-slate-200 placeholder-slate-500 outline-none focus:border-slate-600"
                />
                <button
                  onClick={shareToMastodon}
                  className="px-3 py-1.5 text-sm rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  Share
                </button>
              </div>
            </div>
          )}

          {/* Reddit */}
          <button onClick={shareToReddit} className={itemClass}>
            <FontAwesomeIcon icon={faRedditAlien} className="w-4 h-4 text-orange-400" />
            <span className="text-sm">Reddit</span>
          </button>

          {/* LinkedIn */}
          <button onClick={shareToLinkedIn} className={itemClass}>
            <FontAwesomeIcon icon={faLinkedin} className="w-4 h-4 text-blue-400" />
            <span className="text-sm">LinkedIn</span>
          </button>

          {/* Facebook */}
          <button onClick={shareToFacebook} className={itemClass}>
            <FontAwesomeIcon icon={faFacebookF} className="w-4 h-4 text-blue-500" />
            <span className="text-sm">Facebook</span>
          </button>

          {/* Messages (Apple devices) */}
          {isAppleDevice && (
            <button onClick={shareViaMessages} className={itemClass}>
              <FontAwesomeIcon icon={faMessage} className="w-4 h-4 text-emerald-400" />
              <span className="text-sm">Messages</span>
            </button>
          )}
        </div>

        {/* Timestamp toggle + copy bar */}
        <div className="px-4 pb-4 pt-2 border-t border-slate-800 mt-1">
          {currentSeconds > 0 && (
            <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useTimestamp}
                onChange={(e) => setUseTimestamp(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-600 focus:ring-offset-0 focus:ring-1"
              />
              <span className="text-xs text-slate-400">
                Start at <span className="text-white font-mono">{timestampLabel}</span>
              </span>
            </label>
          )}

          <div className="flex items-stretch rounded-lg border border-slate-700 overflow-hidden">
            <input
              type="text"
              readOnly
              value={getShareUrl()}
              aria-label="Share URL"
              className="flex-1 px-3 py-2 text-xs text-slate-300 bg-slate-800 border-0 outline-none font-mono truncate"
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors shrink-0"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}
