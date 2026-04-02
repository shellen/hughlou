"use client"

import { useState, useRef, useEffect, useCallback } from "react"

export interface QualityLevel {
  index: number
  height: number
  bitrate: number
}

interface QualitySelectorProps {
  levels: QualityLevel[]
  currentLevel: number // -1 = auto
  onSelect: (level: number) => void
}

function formatBitrate(bps: number): string {
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`
  return `${Math.round(bps / 1000)} kbps`
}

export default function QualitySelector({ levels, currentLevel, onSelect }: QualitySelectorProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("touchstart", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("touchstart", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  const handleSelect = useCallback((level: number) => {
    onSelect(level)
    setOpen(false)
  }, [onSelect])

  if (levels.length <= 1) return null

  const sortedLevels = [...levels].sort((a, b) => b.height - a.height)
  const isAuto = currentLevel === -1
  const activeLevel = isAuto ? null : levels.find((l) => l.index === currentLevel)
  const label = isAuto ? "Auto" : activeLevel ? `${activeLevel.height}p` : "Auto"

  return (
    <div ref={rootRef} className="quality-selector">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Quality: ${label}`}
        aria-expanded={open}
        aria-haspopup="menu"
        className="quality-selector__trigger"
      >
        {/* Gear icon */}
        <svg className="quality-selector__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z" />
        </svg>
      </button>

      {open && (
        <div className="quality-selector__menu" role="menu" aria-label="Video quality">
          <div className="quality-selector__header">Quality</div>
          <button
            role="menuitemradio"
            aria-checked={isAuto}
            className={`quality-selector__item ${isAuto ? "quality-selector__item--active" : ""}`}
            onClick={() => handleSelect(-1)}
          >
            <span className="quality-selector__check">
              {isAuto && (
                <svg className="quality-selector__check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className="quality-selector__label">Auto</span>
          </button>
          {sortedLevels.map((level) => {
            const active = currentLevel === level.index
            return (
              <button
                key={level.index}
                role="menuitemradio"
                aria-checked={active}
                className={`quality-selector__item ${active ? "quality-selector__item--active" : ""}`}
                onClick={() => handleSelect(level.index)}
              >
                <span className="quality-selector__check">
                  {active && (
                    <svg className="quality-selector__check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="quality-selector__label">{level.height}p</span>
                <span className="quality-selector__bitrate">{formatBitrate(level.bitrate)}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
