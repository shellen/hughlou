"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"

interface HeaderSearchProps {
  /** Controlled value for real-time filtering (event page). Omit for redirect mode (watch page). */
  value?: string
  onChange?: (value: string) => void
}

export default function HeaderSearch({ value, onChange }: HeaderSearchProps) {
  const [mounted, setMounted] = useState(false)
  const [localQuery, setLocalQuery] = useState("")
  const router = useRouter()

  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  const el = document.getElementById("header-search")
  if (!el) return null

  // Controlled mode (event page): filter in place
  // Uncontrolled mode (watch page): redirect on submit
  const isControlled = onChange !== undefined
  const query = isControlled ? (value ?? "") : localQuery

  const handleChange = (val: string) => {
    if (isControlled) {
      onChange(val)
    } else {
      setLocalQuery(val)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isControlled && query.trim()) {
      router.push(`/events/atmosphereconf2026?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return createPortal(
    <form onSubmit={handleSubmit} className="relative w-full" role="search" aria-label="Search talks">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="search"
        placeholder="Search talks, speakers, handles..."
        aria-label="Search talks, speakers, and handles"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700 transition-all"
      />
      {query && (
        <button
          type="button"
          onClick={() => handleChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </form>,
    el
  )
}
