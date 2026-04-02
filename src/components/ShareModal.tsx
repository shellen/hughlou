"use client"

import { useEffect, useRef, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBluesky, faThreads, faMastodon, faRedditAlien } from "@fortawesome/free-brands-svg-icons"
import { formatDuration } from "@/lib/api"

interface ShareModalProps {
  open: boolean
  onClose: () => void
  videoTitle: string
  videoRef: React.RefObject<HTMLVideoElement | null>
  blueskyShareUrl: string
}

export default function ShareModal({ open, onClose, videoTitle, videoRef, blueskyShareUrl }: ShareModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [copied, setCopied] = useState(false)
  const [useTimestamp, setUseTimestamp] = useState(false)

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* fallback */ }
  }

  const shareUrl = getShareUrl()
  const shareText = getShareText()
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedText = encodeURIComponent(shareText)

  const socials = [
    {
      name: "Bluesky",
      icon: faBluesky,
      color: "text-sky-400",
      href: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`,
    },
    {
      name: "Threads",
      icon: faThreads,
      color: "text-white",
      href: `https://www.threads.net/intent/post?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
    },
    {
      name: "Mastodon",
      icon: faMastodon,
      color: "text-purple-400",
      href: `https://mastodonshare.com/?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      name: "Reddit",
      icon: faRedditAlien,
      color: "text-orange-400",
      href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`,
    },
  ]

  if (!open) return <dialog ref={dialogRef} />

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/60 bg-transparent p-0 m-auto max-w-md w-full outline-none"
      onClick={(e) => { if (e.target === dialogRef.current) onClose() }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Share</h2>
          <button
            onClick={onClose}
            aria-label="Close share dialog"
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Social icons row */}
        <div className="flex items-center justify-center gap-5 mb-6">
          {socials.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Share on ${s.name}`}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center transition-colors">
                <FontAwesomeIcon icon={s.icon} className={`w-5 h-5 ${s.color}`} />
              </div>
              <span className="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors">{s.name}</span>
            </a>
          ))}
        </div>

        {/* Timestamp toggle */}
        {currentSeconds > 0 && (
          <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
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

        {/* Copy link bar */}
        <div className="flex items-stretch gap-0 rounded-lg border border-slate-700 overflow-hidden">
          <input
            type="text"
            readOnly
            value={getShareUrl()}
            aria-label="Share URL"
            className="flex-1 px-3 py-2.5 text-xs text-slate-300 bg-slate-800 border-0 outline-none font-mono truncate"
            onFocus={(e) => e.target.select()}
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors shrink-0"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </dialog>
  )
}
