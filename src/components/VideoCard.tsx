"use client"

import Link from "next/link"
import { formatDuration, formatRelativeTime, extractRkey } from "@/lib/api"
import { titleToGradient } from "@/lib/gradients"

export interface VideoCardProps {
  title: string
  duration: number
  createdAt: string
  uri: string
  compact?: boolean
  thumbDataUrl?: string | null
  speaker?: string | null
  speakerHandles?: string[]
}

function Thumbnail({ title, thumbDataUrl }: { title: string; thumbDataUrl?: string | null }) {
  if (thumbDataUrl) {
    return (
      <img
        src={thumbDataUrl}
        alt=""
        role="presentation"
        width={320}
        height={180}
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    )
  }

  const style = titleToGradient(title)
  return (
    <div className="w-full h-full flex items-end p-4" style={{ backgroundColor: style.bg }}>
      <p className="text-[11px] font-medium leading-tight line-clamp-2 opacity-60" aria-hidden="true" style={{ color: style.accent }}>
        {title}
      </p>
    </div>
  )
}

export default function VideoCard({
  title,
  duration,
  createdAt,
  uri,
  compact = false,
  thumbDataUrl,
  speaker,
  speakerHandles,
}: VideoCardProps) {
  const rkey = extractRkey(uri)

  if (compact) {
    return (
      <Link href={`/watch/${rkey}`} aria-label={`Watch: ${title} (${formatDuration(duration)})`} className="block py-2">
        <div className="group flex gap-3">
          <div className="relative w-44 shrink-0 aspect-video rounded-md overflow-hidden bg-slate-900">
            <Thumbnail title={title} thumbDataUrl={thumbDataUrl} />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" aria-hidden="true" />
            <span className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-white tabular-nums" aria-hidden="true">
              {formatDuration(duration)}
            </span>
          </div>
          <div className="min-w-0 py-0.5 flex flex-col justify-center">
            <h3 className="text-[13px] font-medium text-slate-200 group-hover:text-white transition-colors line-clamp-2 leading-snug">
              {title}
            </h3>
            {(speaker || (speakerHandles && speakerHandles.length > 0)) && (
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                {speaker}
                {speakerHandles && speakerHandles.length > 0 && (
                  <span className="text-slate-400">
                    {speaker ? " · " : ""}
                    {speakerHandles.map((h) => `@${h}`).join(", ")}
                  </span>
                )}
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              {formatRelativeTime(createdAt)}
            </p>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/watch/${rkey}`} aria-label={`Watch: ${title} (${formatDuration(duration)})`}>
      <div className="group">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 mb-3">
          <Thumbnail title={title} thumbDataUrl={thumbDataUrl} />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" aria-hidden="true" />
          <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[11px] font-mono font-medium text-white tabular-nums" aria-hidden="true">
            {formatDuration(duration)}
          </span>
        </div>
        <h3 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors line-clamp-2 leading-snug">
          {title}
        </h3>
        <p className="text-[11px] text-slate-400 mt-1.5 font-mono">{formatRelativeTime(createdAt)}</p>
      </div>
    </Link>
  )
}
