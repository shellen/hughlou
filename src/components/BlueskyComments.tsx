"use client"

import { useEffect, useState } from "react"
import { fetchAllComments, Comment } from "@/lib/bluesky"

interface BlueskyCommentsProps {
  postUri: string | null
  shareUrl: string
}

function timeAgo(isoDate: string): string {
  const now = Date.now()
  const then = new Date(isoDate).getTime()
  const diffS = Math.floor((now - then) / 1000)
  if (diffS < 60) return "just now"
  const diffM = Math.floor(diffS / 60)
  if (diffM < 60) return `${diffM}m`
  const diffH = Math.floor(diffM / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d`
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function CommentCard({ comment }: { comment: Comment }) {
  return (
    <article className="flex gap-3 py-4">
      <a
        href={`https://bsky.app/profile/${comment.author.handle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0"
        aria-label={`View ${comment.author.displayName || comment.author.handle} on Bluesky`}
      >
        {comment.author.avatar ? (
          <img
            src={comment.author.avatar}
            alt=""
            width={36}
            height={36}
            className="w-9 h-9 rounded-full bg-slate-800"
            loading="lazy"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center">
            <span className="text-xs text-slate-400 font-medium">
              {(comment.author.displayName || comment.author.handle).charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </a>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <a
            href={`https://bsky.app/profile/${comment.author.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-semibold text-white hover:text-indigo-300 transition-colors truncate max-w-[200px]"
          >
            {comment.author.displayName || comment.author.handle}
          </a>
          <a
            href={`https://bsky.app/profile/${comment.author.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-500 hover:text-indigo-300 transition-colors truncate max-w-[160px]"
          >
            @{comment.author.handle}
          </a>
          <span className="text-[11px] text-slate-600">·</span>
          <a
            href={comment.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors"
          >
            {timeAgo(comment.createdAt)}
          </a>
        </div>

        <p className="text-[13px] text-slate-300 leading-relaxed mt-1 whitespace-pre-wrap break-words">
          {comment.text}
        </p>

        <div className="flex items-center gap-4 mt-2">
          {comment.likeCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-slate-600">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {comment.likeCount}
            </span>
          )}
          {comment.replyCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-slate-600">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
              </svg>
              {comment.replyCount}
            </span>
          )}
          <a
            href={comment.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-600 hover:text-indigo-300 transition-colors ml-auto"
            aria-label="View on Bluesky"
          >
            View on Bluesky
          </a>
        </div>
      </div>
    </article>
  )
}

export default function BlueskyComments({
  postUri,
  shareUrl,
}: BlueskyCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setComments([])

    fetchAllComments(postUri).then((results) => {
      if (!cancelled) {
        setComments(results)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [postUri])

  const visibleComments = showAll ? comments : comments.slice(0, 5)
  const hasMore = comments.length > 5

  return (
    <section className="mt-8 pt-6 border-t border-slate-800" aria-label="Discussion">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-300" viewBox="0 0 600 530" fill="currentColor" aria-hidden="true">
            <path d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z" />
          </svg>
          Discussion
          {!loading && comments.length > 0 && (
            <span className="text-[11px] font-normal text-slate-500 ml-1">
              {comments.length} comment{comments.length !== 1 ? "s" : ""}
            </span>
          )}
        </h2>
      </div>

      {loading ? (
        <div className="py-8 flex items-center gap-3" role="status">
          <div className="w-5 h-5 border-2 border-slate-700 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-[13px] text-slate-500">Loading discussion…</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-[13px] text-slate-500 mb-3">
            No comments yet. Start the conversation on Bluesky.
          </p>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md text-indigo-300 bg-indigo-300/8 hover:bg-indigo-300/15 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 600 530" fill="currentColor" aria-hidden="true">
              <path d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z" />
            </svg>
            Comment on Bluesky
          </a>
        </div>
      ) : (
        <>
          <div className="space-y-0">
            {visibleComments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} />
            ))}
          </div>

          {hasMore && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-3 text-[13px] text-slate-500 hover:text-white font-medium transition-colors"
            >
              Show {comments.length - 5} more comment{comments.length - 5 !== 1 ? "s" : ""}
            </button>
          )}

          <div className="pt-4 flex items-center justify-between">
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[12px] text-indigo-300 hover:text-white transition-colors font-medium"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 600 530" fill="currentColor" aria-hidden="true">
                <path d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z" />
              </svg>
              Join the conversation
            </a>
            <span className="text-[11px] text-slate-600">
              Powered by Bluesky
            </span>
          </div>
        </>
      )}
    </section>
  )
}
