"use client"

import { ReactNode } from "react"
import {
  Container,
  usePlayer,
  BufferingIndicator,
  PlayButton,
  SeekButton,
  MuteButton,
  CaptionsButton,
  PiPButton,
  FullscreenButton,
  PlaybackRateButton,
  Controls,
  Popover,
  TimeSlider,
  VolumeSlider,
  Time,
  Tooltip,
} from "@videojs/react"
import QualitySelector, { type QualityLevel } from "./QualitySelector"

const SEEK_TIME = 10

// ── Inline SVG icons ──────────────────────────────────────────────────
// These replicate the built-in Video.js 10 icon set which isn't publicly
// exported. Class names match the skin.css visibility rules.

function PlayIcon() {
  return (
    <svg className="media-icon media-icon--play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}
function PauseIcon() {
  return (
    <svg className="media-icon media-icon--pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  )
}
function RestartIcon() {
  return (
    <svg className="media-icon media-icon--restart" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
    </svg>
  )
}
function SeekIcon({ flipped }: { flipped?: boolean }) {
  return (
    <svg className={`media-icon media-icon--seek${flipped ? " media-icon--flipped" : ""}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2z" />
    </svg>
  )
}
function VolumeHighIcon() {
  return (
    <svg className="media-icon media-icon--volume-high" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.14v7.72c1.48-.73 2.5-2.25 2.5-3.86zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  )
}
function VolumeLowIcon() {
  return (
    <svg className="media-icon media-icon--volume-low" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.5 12A4.5 4.5 0 0016 8.14v7.72c1.48-.73 2.5-2.25 2.5-3.86zM5 9v6h4l5 5V4L9 9H5z" />
    </svg>
  )
}
function VolumeOffIcon() {
  return (
    <svg className="media-icon media-icon--volume-off" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.5 12A4.5 4.5 0 0014 8.14v.64l2.45 2.45c.03-.08.05-.15.05-.23zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4l-1.88 1.88L12 7.76V4z" />
    </svg>
  )
}
function CaptionsOnIcon() {
  return (
    <svg className="media-icon media-icon--captions-on" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-4a1 1 0 011-1h3a1 1 0 011 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1a1 1 0 01-1 1h-3a1 1 0 01-1-1v-4a1 1 0 011-1h3a1 1 0 011 1v1z" />
    </svg>
  )
}
function CaptionsOffIcon() {
  return (
    <svg className="media-icon media-icon--captions-off" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM5 18V6h14v12H5zm2-3a1 1 0 01-1-1v-4a1 1 0 011-1h3a1 1 0 011 1v1H9.5v-.5h-2v3h2V13H11v1a1 1 0 01-1 1H7zm7 0a1 1 0 01-1-1v-4a1 1 0 011-1h3a1 1 0 011 1v1h-1.5v-.5h-2v3h2V13H18v1a1 1 0 01-1 1h-3z" />
    </svg>
  )
}
function PipIcon() {
  return (
    <svg className="media-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z" />
    </svg>
  )
}
function FullscreenEnterIcon() {
  return (
    <svg className="media-icon media-icon--fullscreen-enter" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
  )
}
function FullscreenExitIcon() {
  return (
    <svg className="media-icon media-icon--fullscreen-exit" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
    </svg>
  )
}
function SpinnerIcon() {
  return (
    <svg className="media-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
    </svg>
  )
}

// ── Label helpers ─────────────────────────────────────────────────────

function PlayLabel() {
  const paused = usePlayer((s) => Boolean(s.paused))
  const ended = usePlayer((s) => Boolean(s.ended))
  if (ended) return <>Replay</>
  return paused ? <>Play</> : <>Pause</>
}

function CaptionsLabel() {
  return usePlayer((s) => Boolean(s.subtitlesShowing))
    ? <>Disable captions</>
    : <>Enable captions</>
}

function PiPLabel() {
  return usePlayer((s) => Boolean(s.pip))
    ? <>Exit picture-in-picture</>
    : <>Enter picture-in-picture</>
}

function FullscreenLabel() {
  return usePlayer((s) => Boolean(s.fullscreen))
    ? <>Exit fullscreen</>
    : <>Enter fullscreen</>
}

// ── Custom Skin ───────────────────────────────────────────────────────

interface VideoPlayerSkinProps {
  children?: ReactNode
  className?: string
  qualityLevels: QualityLevel[]
  currentQualityLevel: number
  onSelectQuality: (level: number) => void
}

export default function VideoPlayerSkin({
  children,
  className,
  qualityLevels,
  currentQualityLevel,
  onSelectQuality,
}: VideoPlayerSkinProps) {
  return (
    <Container className={`media-default-skin media-default-skin--video ${className || ""}`}>
      {children}

      <BufferingIndicator
        render={(props) => (
          <div {...props} className="media-buffering-indicator">
            <div className="media-surface">
              <SpinnerIcon />
            </div>
          </div>
        )}
      />

      <Controls.Root className="media-surface media-controls">
        {/* Play */}
        <Tooltip.Root side="top">
          <Tooltip.Trigger
            render={
              <PlayButton
                render={(props) => (
                  <button {...props} type="button" className="media-button media-button--icon media-button--play">
                    <RestartIcon />
                    <PlayIcon />
                    <PauseIcon />
                  </button>
                )}
              />
            }
          />
          <Tooltip.Popup className="media-surface media-tooltip">
            <PlayLabel />
          </Tooltip.Popup>
        </Tooltip.Root>

        {/* Seek backward */}
        <Tooltip.Root side="top">
          <Tooltip.Trigger
            render={
              <SeekButton
                seconds={-SEEK_TIME}
                render={(props) => (
                  <button {...props} type="button" className="media-button media-button--icon media-button--seek">
                    <span className="media-icon__container">
                      <SeekIcon flipped />
                      <span className="media-icon__label">{SEEK_TIME}</span>
                    </span>
                  </button>
                )}
              />
            }
          />
          <Tooltip.Popup className="media-surface media-tooltip">
            Seek backward {SEEK_TIME} seconds
          </Tooltip.Popup>
        </Tooltip.Root>

        {/* Seek forward */}
        <Tooltip.Root side="top">
          <Tooltip.Trigger
            render={
              <SeekButton
                seconds={SEEK_TIME}
                render={(props) => (
                  <button {...props} type="button" className="media-button media-button--icon media-button--seek">
                    <span className="media-icon__container">
                      <SeekIcon />
                      <span className="media-icon__label">{SEEK_TIME}</span>
                    </span>
                  </button>
                )}
              />
            }
          />
          <Tooltip.Popup className="media-surface media-tooltip">
            Seek forward {SEEK_TIME} seconds
          </Tooltip.Popup>
        </Tooltip.Root>

        {/* Time display + slider */}
        <Time.Group className="media-time">
          <Time.Value type="current" className="media-time__value" />
          <TimeSlider.Root className="media-slider">
            <TimeSlider.Track className="media-slider__track">
              <TimeSlider.Fill className="media-slider__fill" />
              <TimeSlider.Buffer className="media-slider__buffer" />
            </TimeSlider.Track>
            <TimeSlider.Thumb className="media-slider__thumb" />
          </TimeSlider.Root>
          <Time.Value type="duration" className="media-time__value" />
        </Time.Group>

        {/* Playback rate */}
        <Tooltip.Root side="top">
          <Tooltip.Trigger
            render={
              <PlaybackRateButton
                render={(props) => (
                  <button {...props} type="button" className="media-button media-button--icon media-button--playback-rate" />
                )}
              />
            }
          />
          <Tooltip.Popup className="media-surface media-tooltip">
            Toggle playback rate
          </Tooltip.Popup>
        </Tooltip.Root>

        {/* Quality selector */}
        <QualitySelector
          levels={qualityLevels}
          currentLevel={currentQualityLevel}
          onSelect={onSelectQuality}
        />

        {/* Volume */}
        <Popover.Root openOnHover delay={200} closeDelay={100} side="top">
          <Popover.Trigger
            render={
              <MuteButton
                render={(props) => (
                  <button {...props} type="button" className="media-button media-button--icon media-button--mute">
                    <VolumeOffIcon />
                    <VolumeLowIcon />
                    <VolumeHighIcon />
                  </button>
                )}
              />
            }
          />
          <Popover.Popup className="media-surface media-popover media-popover--volume">
            <VolumeSlider.Root className="media-slider" orientation="vertical" thumbAlignment="edge">
              <VolumeSlider.Track className="media-slider__track">
                <VolumeSlider.Fill className="media-slider__fill" />
              </VolumeSlider.Track>
              <VolumeSlider.Thumb className="media-slider__thumb media-slider__thumb--persistent" />
            </VolumeSlider.Root>
          </Popover.Popup>
        </Popover.Root>

        {/* Captions */}
        <Tooltip.Root side="top">
          <Tooltip.Trigger
            render={
              <CaptionsButton
                render={(props) => (
                  <button {...props} type="button" className="media-button media-button--icon media-button--captions">
                    <CaptionsOffIcon />
                    <CaptionsOnIcon />
                  </button>
                )}
              />
            }
          />
          <Tooltip.Popup className="media-surface media-tooltip">
            <CaptionsLabel />
          </Tooltip.Popup>
        </Tooltip.Root>

        {/* PiP */}
        <Tooltip.Root side="top">
          <Tooltip.Trigger
            render={
              <PiPButton
                render={(props) => (
                  <button {...props} type="button" className="media-button media-button--icon">
                    <PipIcon />
                  </button>
                )}
              />
            }
          />
          <Tooltip.Popup className="media-surface media-tooltip">
            <PiPLabel />
          </Tooltip.Popup>
        </Tooltip.Root>

        {/* Fullscreen */}
        <Tooltip.Root side="top">
          <Tooltip.Trigger
            render={
              <FullscreenButton
                render={(props) => (
                  <button {...props} type="button" className="media-button media-button--icon media-button--fullscreen">
                    <FullscreenEnterIcon />
                    <FullscreenExitIcon />
                  </button>
                )}
              />
            }
          />
          <Tooltip.Popup className="media-surface media-tooltip">
            <FullscreenLabel />
          </Tooltip.Popup>
        </Tooltip.Root>
      </Controls.Root>

      <div className="media-overlay" />
    </Container>
  )
}
