"use client"

import { useEffect, useRef, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCopy, faCheck, faMessage } from "@fortawesome/free-solid-svg-icons"
import { faBluesky, faThreads, faMastodon, faRedditAlien, faLinkedin, faFacebookF, faWhatsapp } from "@fortawesome/free-brands-svg-icons"
import { formatDuration } from "@/lib/api"
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"

interface ShareModalProps {
  open: boolean
  onClose: () => void
  videoTitle: string
  videoRef: React.RefObject<HTMLVideoElement | null>
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

  const shareToMastodon = () => {
    const instance = mastodonInstance.trim() || "mastodon.social"
    openShare(`https://${instance}/share?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`)
    setShowMastodonInput(false)
  }

  const isAppleDevice = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)

  const socials: { name: string; icon: IconDefinition; hoverColor: string; onClick: () => void }[] = [
    {
      name: "Bluesky",
      icon: faBluesky,
      hoverColor: "group-hover:text-sky-400",
      onClick: () => openShare(`https://bsky.app/intent/compose?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`),
    },
    {
      name: "Threads",
      icon: faThreads,
      hoverColor: "group-hover:text-white",
      onClick: () => openShare(`https://threads.net/intent/post?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`),
    },
    {
      name: "Mastodon",
      icon: faMastodon,
      hoverColor: "group-hover:text-purple-400",
      onClick: () => setShowMastodonInput(true),
    },
    {
      name: "Reddit",
      icon: faRedditAlien,
      hoverColor: "group-hover:text-orange-400",
      onClick: () => openShare(`https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`),
    },
    {
      name: "LinkedIn",
      icon: faLinkedin,
      hoverColor: "group-hover:text-blue-400",
      onClick: () => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`),
    },
    {
      name: "Facebook",
      icon: faFacebookF,
      hoverColor: "group-hover:text-blue-500",
      onClick: () => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`),
    },
    {
      name: "WhatsApp",
      icon: faWhatsapp,
      hoverColor: "group-hover:text-green-400",
      onClick: () => openShare(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`),
    },
    ...(isAppleDevice ? [{
      name: "Messages",
      icon: faMessage,
      hoverColor: "group-hover:text-emerald-400",
      onClick: () => { window.location.href = `sms:&body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`; onClose() },
    }] : []),
  ]

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

        {/* Copy link */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
          >
            <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={`w-4 h-4 ${copied ? "text-emerald-400" : "text-slate-500"}`} />
            <span className="text-sm">{copied ? "Copied!" : "Copy link"}</span>
          </button>
        </div>

        {/* Social icons grid — two rows */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-4 gap-1">
            {socials.map((s) => (
              <button
                key={s.name}
                onClick={s.onClick}
                aria-label={`Share on ${s.name}`}
                className="group flex flex-col items-center gap-1.5 py-3 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <FontAwesomeIcon icon={s.icon} className={`w-5 h-5 text-slate-500 ${s.hoverColor} transition-colors`} />
                <span className="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors">{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mastodon instance input (expands when clicked) */}
        {showMastodonInput && (
          <div className="px-4 pb-3">
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

        {/* Timestamp toggle + copy bar */}
        <div className="px-4 pb-4 pt-2 border-t border-slate-800">
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
