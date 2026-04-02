"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { searchTalks, talks as staticTalks } from "@/lib/talks"
import { formatDuration } from "@/lib/api"

interface HeaderSearchProps {
  /** Controlled value for real-time filtering (event page). Omit for typeahead mode (watch page). */
  value?: string
  onChange?: (value: string) => void
}

export default function HeaderSearch({ value, onChange }: HeaderSearchProps) {
  const [mounted, setMounted] = useState(false)
  const [localQuery, setLocalQuery] = useState("")
  const [focused, setFocused] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const router = useRouter()
  const wrapperRef = useRef<HTMLFormElement>(null)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  const el = document.getElementById("header-search")
  if (!el) return null

  const isControlled = onChange !== undefined
  const query = isControlled ? (value ?? "") : localQuery
  const showTypeahead = !isControlled && focused && localQuery.trim().length > 0 && staticTalks.length > 0

  const handleChange = (val: string) => {
    if (isControlled) {
      onChange(val)
    } else {
      setLocalQuery(val)
      setSelectedIdx(-1)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isControlled && query.trim()) {
      router.push(`/events/atmosphereconf2026?q=${encodeURIComponent(query.trim())}`)
      setLocalQuery("")
      setFocused(false)
    }
  }

  const navigateToTalk = (rkey: string) => {
    router.push(`/watch/${rkey}`)
    setLocalQuery("")
    setFocused(false)
  }

  return createPortal(
    <form
      ref={wrapperRef}
      onSubmit={handleSubmit}
      className="relative w-full"
      role="search"
      aria-label="Search talks"
      onBlur={(e) => {
        if (!wrapperRef.current?.contains(e.relatedTarget as Node)) setFocused(false)
      }}
    >
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="search"
        placeholder="Search talks, speakers, handles..."
        aria-label="Search talks, speakers, and handles"
        aria-expanded={showTypeahead}
        aria-autocomplete={isControlled ? undefined : "list"}
        aria-controls={showTypeahead ? "search-results" : undefined}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={(e) => {
          if (!showTypeahead) return
          const results = searchTalks(localQuery).slice(0, 6)
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1))
          } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setSelectedIdx((prev) => Math.max(prev - 1, -1))
          } else if (e.key === "Enter" && selectedIdx >= 0 && selectedIdx < results.length) {
            e.preventDefault()
            navigateToTalk(results[selectedIdx].rkey)
          } else if (e.key === "Escape") {
            setFocused(false)
          }
        }}
        className="w-full pl-10 pr-10 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700 transition-all"
      />
      {query && (
        <button
          type="button"
          onClick={() => handleChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      {showTypeahead && <TypeaheadResults query={localQuery} selectedIdx={selectedIdx} onSelect={navigateToTalk} />}
    </form>,
    el
  )
}

function TypeaheadResults({ query, selectedIdx, onSelect }: { query: string; selectedIdx: number; onSelect: (rkey: string) => void }) {
  const results = useMemo(() => searchTalks(query).slice(0, 6), [query])

  if (results.length === 0) return null

  return (
    <ul
      id="search-results"
      role="listbox"
      className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50"
    >
      {results.map((talk, i) => (
        <li
          key={talk.rkey}
          role="option"
          aria-selected={i === selectedIdx}
          onMouseDown={(e) => { e.preventDefault(); onSelect(talk.rkey) }}
          className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${i === selectedIdx ? "bg-slate-800" : "hover:bg-slate-800/50"}`}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white truncate">{talk.title}</p>
            {talk.speaker && (
              <p className="text-xs text-slate-400 truncate">{talk.speaker}{talk.handles[0] ? ` · @${talk.handles[0]}` : ""}</p>
            )}
          </div>
          <span className="text-xs text-slate-500 font-mono shrink-0">{formatDuration(talk.duration)}</span>
        </li>
      ))}
      <li
        onMouseDown={(e) => { e.preventDefault() }}
        className="border-t border-slate-800 px-3 py-2 text-xs text-slate-500"
      >
        <kbd className="text-slate-400">Enter</kbd> to see all results
      </li>
    </ul>
  )
}
