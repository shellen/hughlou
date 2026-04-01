"use client"

import { useState, useEffect, useCallback } from "react"
import {
  isInWatchLater,
  toggleWatchLater,
  getWatchLaterList,
  removeFromWatchLater,
  WatchLaterItem,
} from "@/lib/watchLater"

/**
 * Hook to check/toggle watch-later status for a single video.
 */
export function useWatchLaterStatus(rkey: string) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSaved(isInWatchLater(rkey))
    const handler = () => setSaved(isInWatchLater(rkey))
    window.addEventListener("watchlater-changed", handler)
    return () => window.removeEventListener("watchlater-changed", handler)
  }, [rkey])

  const toggle = useCallback(
    (title: string, duration: number) => {
      const nowSaved = toggleWatchLater(rkey, title, duration)
      setSaved(nowSaved)
    },
    [rkey]
  )

  return { saved, toggle }
}

/**
 * Hook to get the full watch-later list, auto-updates on changes.
 */
export function useWatchLaterList() {
  const [items, setItems] = useState<WatchLaterItem[]>([])

  useEffect(() => {
    setItems(getWatchLaterList())
    const handler = () => setItems(getWatchLaterList())
    window.addEventListener("watchlater-changed", handler)
    return () => window.removeEventListener("watchlater-changed", handler)
  }, [])

  const remove = useCallback((rkey: string) => {
    removeFromWatchLater(rkey)
  }, [])

  return { items, remove }
}
