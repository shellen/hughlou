"use client"

import { useState } from "react"

const FAKE_VIDEOS = [
  { title: "Building Decentralized Social with AT Protocol", duration: "32:15", speaker: "Alex Rivera" },
  { title: "The Future of Identity on the Open Web", duration: "24:08", speaker: "Jordan Lee" },
  { title: "Scaling Federation: Lessons from Production", duration: "41:30", speaker: "Sam Chen" },
  { title: "End-to-End Encryption in Social Systems", duration: "28:45", speaker: "Morgan Blake" },
  { title: "Designing for Interoperability", duration: "19:52", speaker: "Casey Nguyen" },
  { title: "Real-Time Sync Across the Atmosphere", duration: "35:10", speaker: "Jamie Park" },
]

const THUMB_COLORS = ["#1e3a5f", "#2d1b4e", "#1a3d2e", "#3d1f1f", "#1f2d3d", "#2e1a3d"]

function FakeCard({ title, duration, speaker, color }: { title: string; duration: string; speaker: string; color: string }) {
  return (
    <div className="group">
      <div className="relative aspect-video rounded-lg overflow-hidden mb-3" style={{ backgroundColor: color }}>
        <div className="w-full h-full flex items-end p-4">
          <p className="text-[11px] font-medium leading-tight line-clamp-2 opacity-40 text-white">{title}</p>
        </div>
        <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[11px] font-mono font-medium text-white">
          {duration}
        </span>
      </div>
      <h3 className="text-sm font-medium text-slate-200 line-clamp-2 leading-snug">{title}</h3>
      <p className="text-[11px] text-slate-500 mt-1">{speaker}</p>
      <p className="text-[11px] text-slate-400 mt-1 font-mono">2 days ago</p>
    </div>
  )
}

function VideoGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-8">
      {FAKE_VIDEOS.map((v, i) => (
        <FakeCard key={i} {...v} color={THUMB_COLORS[i]} />
      ))}
    </div>
  )
}

const backgrounds: Record<string, { label: string; description: string; style: React.CSSProperties }> = {
  current: {
    label: "Current (Flat)",
    description: "Solid #0a0f1a — the existing background",
    style: { backgroundColor: "#0a0f1a" },
  },
  dots: {
    label: "Dot Grid",
    description: "Subtle repeating dot pattern, 24px spacing",
    style: {
      backgroundColor: "#0a0f1a",
      backgroundImage: "radial-gradient(circle, #1e293b 1px, transparent 1px)",
      backgroundSize: "24px 24px",
    },
  },
  dotsFine: {
    label: "Fine Dot Grid",
    description: "Tighter dot pattern, 16px spacing, smaller dots",
    style: {
      backgroundColor: "#0a0f1a",
      backgroundImage: "radial-gradient(circle, #1a2332 0.75px, transparent 0.75px)",
      backgroundSize: "16px 16px",
    },
  },
  gridLines: {
    label: "Line Grid",
    description: "Faint CSS grid lines, 48px cells",
    style: {
      backgroundColor: "#0a0f1a",
      backgroundImage:
        "linear-gradient(#141d2e 1px, transparent 1px), linear-gradient(90deg, #141d2e 1px, transparent 1px)",
      backgroundSize: "48px 48px",
    },
  },
  gridTight: {
    label: "Tight Line Grid",
    description: "Denser grid, 24px cells",
    style: {
      backgroundColor: "#0a0f1a",
      backgroundImage:
        "linear-gradient(#111827 1px, transparent 1px), linear-gradient(90deg, #111827 1px, transparent 1px)",
      backgroundSize: "24px 24px",
    },
  },
  blobs: {
    label: "Big Blobs",
    description: "Large soft radial blobs at fixed positions",
    style: {
      backgroundColor: "#0a0f1a",
      backgroundImage: [
        "radial-gradient(ellipse 600px 400px at 10% 20%, rgba(37,99,235,0.08), transparent)",
        "radial-gradient(ellipse 500px 500px at 80% 10%, rgba(99,102,241,0.06), transparent)",
        "radial-gradient(ellipse 700px 350px at 60% 70%, rgba(37,99,235,0.05), transparent)",
        "radial-gradient(ellipse 400px 600px at 20% 80%, rgba(139,92,246,0.05), transparent)",
      ].join(", "),
    },
  },
  blobsWarm: {
    label: "Warm Blobs",
    description: "Blobs with warmer indigo/purple tones",
    style: {
      backgroundColor: "#0a0f1a",
      backgroundImage: [
        "radial-gradient(ellipse 600px 500px at 15% 15%, rgba(99,102,241,0.1), transparent)",
        "radial-gradient(ellipse 500px 400px at 75% 25%, rgba(139,92,246,0.07), transparent)",
        "radial-gradient(ellipse 700px 400px at 50% 65%, rgba(79,70,229,0.06), transparent)",
      ].join(", "),
    },
  },
  dotsBlobs: {
    label: "Dots + Blobs Combo",
    description: "Fine dots layered over soft color blobs",
    style: {
      backgroundColor: "#0a0f1a",
      backgroundImage: [
        "radial-gradient(circle, #1a2332 0.75px, transparent 0.75px)",
        "radial-gradient(ellipse 600px 400px at 10% 20%, rgba(37,99,235,0.07), transparent)",
        "radial-gradient(ellipse 500px 500px at 80% 15%, rgba(99,102,241,0.05), transparent)",
        "radial-gradient(ellipse 600px 350px at 50% 70%, rgba(37,99,235,0.04), transparent)",
      ].join(", "),
      backgroundSize: "16px 16px, 100% 100%, 100% 100%, 100% 100%",
    },
  },
  noise: {
    label: "Gradient Wash",
    description: "Vertical gradient from slightly lighter top to dark bottom",
    style: {
      background: "linear-gradient(180deg, #0e1525 0%, #0a0f1a 40%, #080c15 100%)",
    },
  },
  crosshatch: {
    label: "Diagonal Crosshatch",
    description: "Subtle diagonal lines forming a crosshatch pattern",
    style: {
      backgroundColor: "#0a0f1a",
      backgroundImage: [
        "repeating-linear-gradient(45deg, transparent, transparent 23px, #111827 23px, #111827 24px)",
        "repeating-linear-gradient(-45deg, transparent, transparent 23px, #111827 23px, #111827 24px)",
      ].join(", "),
    },
  },
}

const bgKeys = Object.keys(backgrounds)

export default function TestBackgrounds() {
  const [active, setActive] = useState("current")
  const bg = backgrounds[active]

  return (
    <div className="min-h-screen" style={bg.style}>
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white mb-2">Background Style Test</h1>
          <p className="text-sm text-slate-400 mb-6">
            Click a style below to preview it behind mock video cards.
          </p>

          <div className="flex flex-wrap gap-2">
            {bgKeys.map((key) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  active === key
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {backgrounds[key].label}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-500 mt-3">
            <span className="text-slate-400 font-medium">{bg.label}:</span> {bg.description}
          </p>
        </div>

        {/* Section heading like the real page */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">All Talks</h2>
          <p className="text-xs text-slate-500 mt-1">6 videos</p>
        </div>

        <VideoGrid />

        {/* Show a second section to see how it looks with more content */}
        <div className="mt-16 mb-6">
          <h2 className="text-lg font-semibold text-white">More Talks</h2>
          <p className="text-xs text-slate-500 mt-1">6 videos</p>
        </div>

        <VideoGrid />
      </div>
    </div>
  )
}
