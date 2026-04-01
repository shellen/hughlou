"use client"

const STORAGE_KEY = "hughlou-watch-later"

export interface WatchLaterItem {
  rkey: string
  title: string
  duration: number // nanoseconds
  addedAt: number  // timestamp ms
}

function getItems(): WatchLaterItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveItems(items: WatchLaterItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // storage full — silently fail
  }
}

export function isInWatchLater(rkey: string): boolean {
  return getItems().some((item) => item.rkey === rkey)
}

export function addToWatchLater(rkey: string, title: string, duration: number): void {
  const items = getItems()
  if (items.some((item) => item.rkey === rkey)) return
  items.push({ rkey, title, duration, addedAt: Date.now() })
  saveItems(items)
  window.dispatchEvent(new CustomEvent("watchlater-changed"))
}

export function removeFromWatchLater(rkey: string): void {
  const items = getItems().filter((item) => item.rkey !== rkey)
  saveItems(items)
  window.dispatchEvent(new CustomEvent("watchlater-changed"))
}

export function toggleWatchLater(rkey: string, title: string, duration: number): boolean {
  if (isInWatchLater(rkey)) {
    removeFromWatchLater(rkey)
    return false
  } else {
    addToWatchLater(rkey, title, duration)
    return true
  }
}

export function getWatchLaterList(): WatchLaterItem[] {
  return getItems().sort((a, b) => b.addedAt - a.addedAt)
}

export function clearWatchLater(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new CustomEvent("watchlater-changed"))
  } catch {
    // ignore
  }
}
