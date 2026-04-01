"use client"

import { useWatchLaterStatus } from "@/hooks/useWatchLater"

interface WatchLaterButtonProps {
  rkey: string
  title: string
  duration: number
  compact?: boolean
}

export default function WatchLaterButton({
  rkey,
  title,
  duration,
  compact = false,
}: WatchLaterButtonProps) {
  const { saved, toggle } = useWatchLaterStatus(rkey)

  return (
    <button
      onClick={() => toggle(title, duration)}
      aria-label={saved ? "Remove from Watch Later" : "Watch Later"}
      className={`
        inline-flex items-center gap-1.5 transition-all duration-150
        ${
          saved
            ? "text-sky-400 hover:text-sky-300"
            : "text-slate-400 hover:text-slate-200"
        }
        ${compact ? "text-[11px] px-2 py-1" : "text-xs px-3 py-1.5"}
        rounded-md
        ${
          saved
            ? "bg-sky-400/10 hover:bg-sky-400/15"
            : "bg-slate-700/40 hover:bg-slate-600/50"
        }
      `}
    >
      {/* Clock icon */}
      <svg
        className={compact ? "w-3 h-3" : "w-3.5 h-3.5"}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {saved ? (
          // Check-clock icon when saved
          <>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          </>
        ) : (
          // Clock icon when not saved
          <>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          </>
        )}
      </svg>
      {!compact && (saved ? "Saved" : "Watch Later")}
    </button>
  )
}
