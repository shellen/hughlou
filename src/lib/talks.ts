import Fuse from "fuse.js"
import type { IFuseOptions } from "fuse.js"
import staticTalks from "@/data/talks.json"

export interface Talk {
  rkey: string
  uri: string
  title: string
  duration: number
  createdAt: string
  creator: string
  creatorHandle: string
  speaker: string
  handles: string[]
  thumbUrl: string | null
  livestreamUri: string | null
  postUri: string | null
}

export const talks: Talk[] = staticTalks as Talk[]

const fuseOptions: IFuseOptions<Talk> = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "speaker", weight: 0.3 },
    { name: "handles", weight: 0.2 },
    { name: "creatorHandle", weight: 0.1 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  includeScore: true,
}

let fuseInstance: Fuse<Talk> | null = null

export function getTalksFuse(): Fuse<Talk> {
  if (!fuseInstance) {
    fuseInstance = new Fuse(talks, fuseOptions)
  }
  return fuseInstance
}

export function searchTalks(query: string): Talk[] {
  if (!query.trim()) return talks
  const fuse = getTalksFuse()
  return fuse.search(query).map((r) => r.item)
}
