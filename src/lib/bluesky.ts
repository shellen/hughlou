// Proxy Bluesky API calls through our Next.js route to avoid CORS issues
const BSKY_PROXY = "/api/bsky"

// Posts to filter out — generic stream announcements that appear on every video
const FILTERED_POST_URIS = new Set([
  "at://did:plc:zjbq26wybii5ojoypkso2mso/app.bsky.feed.post/3mi4zb36tys27",
])

export interface BskyAuthor {
  did: string
  handle: string
  displayName?: string
  avatar?: string
}

export interface BskyPost {
  uri: string
  cid: string
  author: BskyAuthor
  record: {
    text: string
    createdAt: string
    reply?: {
      root: { uri: string; cid: string }
      parent: { uri: string; cid: string }
    }
    embed?: {
      $type: string
      external?: {
        uri: string
        title: string
        description: string
      }
    }
    facets?: Array<{
      index: { byteStart: number; byteEnd: number }
      features: Array<{
        $type: string
        uri?: string
        did?: string
        tag?: string
      }>
    }>
  }
  likeCount?: number
  repostCount?: number
  replyCount?: number
  indexedAt: string
}

export interface ThreadReply {
  post: BskyPost
  replies?: ThreadReply[]
}

export interface Comment {
  id: string
  author: BskyAuthor
  text: string
  createdAt: string
  likeCount: number
  replyCount: number
  postUrl: string
  isReply: boolean // true = thread reply, false = mention
}

function postToComment(post: BskyPost, isReply: boolean): Comment {
  const parts = post.uri.replace("at://", "").split("/")
  const did = parts[0]
  const rkey = parts[parts.length - 1]
  return {
    id: post.uri,
    author: post.author,
    text: post.record.text,
    createdAt: post.record.createdAt,
    likeCount: post.likeCount || 0,
    replyCount: post.replyCount || 0,
    postUrl: `https://bsky.app/profile/${did}/post/${rkey}`,
    isReply,
  }
}

// Fetch the thread for a Bluesky post and extract replies
export async function fetchThreadReplies(
  postUri: string
): Promise<Comment[]> {
  try {
    const params = new URLSearchParams({
      method: "app.bsky.feed.getPostThread",
      uri: postUri,
      depth: "6",
      parentHeight: "0",
    })
    const resp = await fetch(
      `${BSKY_PROXY}?${params}`
    )
    if (!resp.ok) return []
    const data = await resp.json()

    const comments: Comment[] = []

    function walkReplies(replies?: ThreadReply[]) {
      if (!replies) return
      for (const r of replies) {
        if (r.post) {
          comments.push(postToComment(r.post, true))
          walkReplies(r.replies)
        }
      }
    }

    walkReplies(data.thread?.replies)
    return comments
  } catch {
    return []
  }
}

// Combined: get all comments for a video (thread replies)
// Note: searchPosts requires Bluesky auth, so URL-mention search is not
// available. Comments come from direct thread replies to the stream post.
export async function fetchAllComments(
  postUri: string | null,
): Promise<Comment[]> {
  const threadReplies = postUri
    ? await fetchThreadReplies(postUri)
    : []

  // Filter out known spam
  return threadReplies
    .filter((c) => !FILTERED_POST_URIS.has(c.id))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
}
