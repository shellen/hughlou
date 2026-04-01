"use client"

import Link from "next/link"
import { useWatchLaterList } from "@/hooks/useWatchLater"
import { formatDuration } from "@/lib/api"

interface WatchLaterQueueProps {
  currentRkey?: string
}

export default function WatchLaterQueue({ currentRkey }: WatchLaterQueueProps) {
  const { items, remove } = useWatchLaterList()

  // Filter out the currently playing video
  const queue = currentRkey
    ? items.filter((item) => item.rkey !== currentRkey)
    : items

  if (queue.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          </svg>
          Watch Later
          <span className="text-slate-500 font-normal">({queue.length})</span>
        </h3>
      </div>

      <div className="space-y-1">
        {queue.map((item) => (
          <div key={item.rkey} className="group relative">
            <Link
              href={`/watch/${item.rkey}`}
              className="block py-2.5 px-3 rounded-lg bg-slate-800/30 hover:bg-slate-700/40 border border-slate-700/30 hover:border-slate-600/40 transition-all duration-150"
            >
              <p className="text-[13px] text-slate-200 font-medium leading-snug line-clamp-2 pr-6">
                {item.title}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                {formatDuration(item.duration)}
              </p>
            </Link>
            <button
              onClick={() => remove(item.rkey)}
              aria-label={`Remove "${item.title}" from Watch Later`}
              className="absolute top-2.5 right-2 p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-700/60 opacity-0 group-hover:opacity-100 transition-all duration-150"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
