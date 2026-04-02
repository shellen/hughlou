"use client"

import { Popover } from "@videojs/react"

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

function GearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function QualitySelector({ levels, currentLevel, onSelect }: QualitySelectorProps) {
  if (levels.length <= 1) return null

  const sortedLevels = [...levels].sort((a, b) => b.height - a.height)
  const isAuto = currentLevel === -1
  const activeLevel = isAuto ? null : levels.find((l) => l.index === currentLevel)
  const label = isAuto ? "Auto" : activeLevel ? `${activeLevel.height}p` : "Auto"

  return (
    <Popover.Root side="top">
      <Popover.Trigger
        render={(props) => (
          <button
            {...props}
            type="button"
            className="media-button media-button--icon media-button--quality"
            aria-label={`Quality: ${label}`}
          >
            <GearIcon className="media-icon" />
          </button>
        )}
      />
      <Popover.Popup className="media-surface media-popover media-popover--quality">
        <div className="quality-menu" role="menu" aria-label="Video quality">
          <div className="quality-menu__header">Quality</div>
          <button
            role="menuitemradio"
            aria-checked={isAuto}
            className={`quality-menu__item ${isAuto ? "quality-menu__item--active" : ""}`}
            onClick={() => onSelect(-1)}
          >
            <span className="quality-menu__check">
              {isAuto && <CheckIcon className="quality-menu__check-icon" />}
            </span>
            <span className="quality-menu__label">Auto</span>
          </button>
          {sortedLevels.map((level) => {
            const active = currentLevel === level.index
            return (
              <button
                key={level.index}
                role="menuitemradio"
                aria-checked={active}
                className={`quality-menu__item ${active ? "quality-menu__item--active" : ""}`}
                onClick={() => onSelect(level.index)}
              >
                <span className="quality-menu__check">
                  {active && <CheckIcon className="quality-menu__check-icon" />}
                </span>
                <span className="quality-menu__label">{level.height}p</span>
                <span className="quality-menu__bitrate">{formatBitrate(level.bitrate)}</span>
              </button>
            )
          })}
        </div>
      </Popover.Popup>
    </Popover.Root>
  )
}
