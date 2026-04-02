"use client"

import { useCallback, useRef } from "react"

/* ─── Download helpers ───────────────────────────────────────────────── */

function serializeSvg(el: SVGSVGElement): string {
  const clone = el.cloneNode(true) as SVGSVGElement
  // Ensure xmlns is set for standalone SVG files
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  // Remove React-added attributes that aren't needed in downloads
  clone.removeAttribute("role")
  clone.removeAttribute("aria-label")
  clone.removeAttribute("class")
  return new XMLSerializer().serializeToString(clone)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function downloadSvg(el: SVGSVGElement, filename: string) {
  const svg = serializeSvg(el)
  downloadBlob(new Blob([svg], { type: "image/svg+xml" }), filename)
}

function downloadPng(el: SVGSVGElement, filename: string, scale = 3) {
  const svg = serializeSvg(el)
  const viewBox = el.viewBox.baseVal
  const w = viewBox.width * scale
  const h = viewBox.height * scale

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")!

  const img = new Image()
  img.onload = () => {
    ctx.drawImage(img, 0, 0, w, h)
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, filename)
    }, "image/png")
  }
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)
}

/* ─── Download buttons ───────────────────────────────────────────────── */

function DownloadButtons({
  svgRef,
  name,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>
  name: string
}) {
  const handleSvg = useCallback(() => {
    if (svgRef.current) downloadSvg(svgRef.current, `${name}.svg`)
  }, [svgRef, name])

  const handlePng = useCallback(() => {
    if (svgRef.current) downloadPng(svgRef.current, `${name}.png`)
  }, [svgRef, name])

  return (
    <span className="inline-flex gap-2">
      <button
        onClick={handleSvg}
        className="px-2.5 py-1 text-[11px] font-mono text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white rounded transition-colors"
      >
        SVG
      </button>
      <button
        onClick={handlePng}
        className="px-2.5 py-1 text-[11px] font-mono text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white rounded transition-colors"
      >
        PNG
      </button>
    </span>
  )
}

/* ─── SVG building blocks ────────────────────────────────────────────── */

type Variant = "positive" | "negative" | "white" | "black"

const LOGOTYPE_FILLS: Record<Variant, { hugh: string; lou: string }> = {
  positive: { hugh: "#ffffff", lou: "#2563eb" },
  negative: { hugh: "#0a0f1a", lou: "#2563eb" },
  white:    { hugh: "#ffffff", lou: "#ffffff" },
  black:    { hugh: "#0a0f1a", lou: "#0a0f1a" },
}

const ICON_FILLS: Record<Variant, { bg: string; fg: string }> = {
  positive: { bg: "#0a0f1a", fg: "#2563eb" },
  negative: { bg: "#ffffff", fg: "#2563eb" },
  white:    { bg: "#0a0f1a", fg: "#ffffff" },
  black:    { bg: "#ffffff", fg: "#0a0f1a" },
}

function Logotype({
  variant,
  className,
  svgRef,
}: {
  variant: Variant
  className?: string
  svgRef?: React.Ref<SVGSVGElement>
}) {
  const { hugh, lou } = LOGOTYPE_FILLS[variant]
  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox="0 0 580 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`HUGHLOU logotype — ${variant}`}
    >
      <text x="0" y="82" fontFamily="'Outfit', system-ui, sans-serif" fontWeight="900" fontSize="92" letterSpacing="4">
        <tspan fill={hugh}>HUGH</tspan><tspan fill={lou}>LOU</tspan>
      </text>
    </svg>
  )
}

function AppIcon({
  variant,
  className,
  svgRef,
}: {
  variant: Variant
  className?: string
  svgRef?: React.Ref<SVGSVGElement>
}) {
  const { bg, fg } = ICON_FILLS[variant]
  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`HUGHLOU icon — ${variant}`}
    >
      <rect width="512" height="512" rx="108" fill={bg} />
      <path d="M108 140h42v88h72v-88h42v220h-42v-96h-72v96h-42z" fill={fg} />
      <path d="M298 140h42v184h80v36h-122z" fill={fg} />
    </svg>
  )
}

/* ─── Reusable section pieces ────────────────────────────────────────── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-white tracking-tight mb-2">{children}</h2>
}

function SectionSub({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-400 mb-8 max-w-xl">{children}</p>
}

function AssetCard({
  label,
  bg,
  name,
  children,
  svgRef,
}: {
  label: string
  bg: string
  name: string
  children: React.ReactNode
  svgRef: React.RefObject<SVGSVGElement | null>
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className={`aspect-[3/2] rounded-lg flex items-center justify-center p-8 ${bg}`}>
        {children}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-mono">{label}</span>
        <DownloadButtons svgRef={svgRef} name={name} />
      </div>
    </div>
  )
}

function IconCard({
  label,
  bg,
  name,
  children,
  svgRef,
}: {
  label: string
  bg: string
  name: string
  children: React.ReactNode
  svgRef: React.RefObject<SVGSVGElement | null>
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl flex items-center justify-center p-4 ${bg}`}>
        {children}
      </div>
      <span className="text-xs text-slate-500 font-mono mb-1">{label}</span>
      <DownloadButtons svgRef={svgRef} name={name} />
    </div>
  )
}

function ColorSwatch({ name, hex, border }: { name: string; hex: string; border?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-12 h-12 rounded-lg shrink-0 ${border ? "border border-slate-700" : ""}`}
        style={{ backgroundColor: hex }}
      />
      <div>
        <p className="text-sm text-white font-medium">{name}</p>
        <p className="text-xs text-slate-400 font-mono uppercase">{hex}</p>
      </div>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export default function BrandClient() {
  const logoPositiveRef = useRef<SVGSVGElement>(null)
  const logoNegativeRef = useRef<SVGSVGElement>(null)
  const logoWhiteRef = useRef<SVGSVGElement>(null)
  const logoBlackRef = useRef<SVGSVGElement>(null)

  const iconPositiveRef = useRef<SVGSVGElement>(null)
  const iconNegativeRef = useRef<SVGSVGElement>(null)
  const iconWhiteRef = useRef<SVGSVGElement>(null)
  const iconBlackRef = useRef<SVGSVGElement>(null)

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-14">
        <h1 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight mb-3">
          Brand
        </h1>
        <p className="text-base text-slate-400 leading-relaxed max-w-2xl">
          The HUGHLOU logotype, icon, and color palette. Use these assets when
          referencing HUGHLOU in press, social, or integrations.
        </p>
      </div>

      {/* ── Logotype ─────────────────────────────────────────────────── */}
      <section className="mb-20">
        <SectionHeading>Logotype</SectionHeading>
        <SectionSub>
          The primary wordmark. &ldquo;HUGH&rdquo; is always set in the primary
          text color and &ldquo;LOU&rdquo; in accent blue. Monochrome variants
          are provided for single-color contexts.
        </SectionSub>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <AssetCard label="Positive (dark background)" bg="bg-[#0a0f1a] border border-slate-800" name="hughlou-logotype-positive" svgRef={logoPositiveRef}>
            <Logotype variant="positive" className="w-full max-w-xs" svgRef={logoPositiveRef} />
          </AssetCard>

          <AssetCard label="Negative (light background)" bg="bg-white" name="hughlou-logotype-negative" svgRef={logoNegativeRef}>
            <Logotype variant="negative" className="w-full max-w-xs" svgRef={logoNegativeRef} />
          </AssetCard>

          <AssetCard label="White only" bg="bg-[#0a0f1a] border border-slate-800" name="hughlou-logotype-white" svgRef={logoWhiteRef}>
            <Logotype variant="white" className="w-full max-w-xs" svgRef={logoWhiteRef} />
          </AssetCard>

          <AssetCard label="Black only" bg="bg-white" name="hughlou-logotype-black" svgRef={logoBlackRef}>
            <Logotype variant="black" className="w-full max-w-xs" svgRef={logoBlackRef} />
          </AssetCard>
        </div>
      </section>

      {/* ── Icon ─────────────────────────────────────────────────────── */}
      <section className="mb-20">
        <SectionHeading>Icon</SectionHeading>
        <SectionSub>
          The &ldquo;HL&rdquo; monogram inside a rounded square. Use as an app
          icon, favicon, or avatar.
        </SectionSub>

        <div className="flex flex-wrap gap-8">
          <IconCard label="Positive" bg="bg-slate-900 border border-slate-800" name="hughlou-icon-positive" svgRef={iconPositiveRef}>
            <AppIcon variant="positive" className="w-full h-full" svgRef={iconPositiveRef} />
          </IconCard>

          <IconCard label="Negative" bg="bg-slate-200" name="hughlou-icon-negative" svgRef={iconNegativeRef}>
            <AppIcon variant="negative" className="w-full h-full" svgRef={iconNegativeRef} />
          </IconCard>

          <IconCard label="White" bg="bg-slate-900 border border-slate-800" name="hughlou-icon-white" svgRef={iconWhiteRef}>
            <AppIcon variant="white" className="w-full h-full" svgRef={iconWhiteRef} />
          </IconCard>

          <IconCard label="Black" bg="bg-slate-200" name="hughlou-icon-black" svgRef={iconBlackRef}>
            <AppIcon variant="black" className="w-full h-full" svgRef={iconBlackRef} />
          </IconCard>
        </div>
      </section>

      {/* ── Colors ───────────────────────────────────────────────────── */}
      <section className="mb-20">
        <SectionHeading>Colors</SectionHeading>
        <SectionSub>
          The core palette. The background and accent pair should be used
          consistently across all branded surfaces.
        </SectionSub>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ColorSwatch name="Background" hex="#0a0f1a" border />
          <ColorSwatch name="Accent Blue" hex="#2563eb" />
          <ColorSwatch name="Primary Text" hex="#e2e8f0" border />
          <ColorSwatch name="Secondary Text" hex="#94a3b8" border />
        </div>
      </section>

      {/* ── Typography ───────────────────────────────────────────────── */}
      <section className="mb-20">
        <SectionHeading>Typography</SectionHeading>
        <SectionSub>
          Two typefaces make up the type system.
        </SectionSub>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <p className="font-display text-3xl font-black text-white uppercase tracking-tight mb-3">
              Outfit Black
            </p>
            <p className="text-xs text-slate-400 font-mono">
              Display &middot; Logo &middot; Headings
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Weight 900. Used for the logotype, hero text, and section titles.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <p className="text-2xl font-semibold text-white tracking-tight mb-3">
              Inter
            </p>
            <p className="text-xs text-slate-400 font-mono">
              Body &middot; UI &middot; Captions
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Weights 400 &ndash; 700. Used for body text, navigation, metadata,
              and interface elements.
            </p>
          </div>
        </div>
      </section>

      {/* ── Usage guidelines ─────────────────────────────────────────── */}
      <section>
        <SectionHeading>Usage Guidelines</SectionHeading>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 sm:p-8">
          <ul className="space-y-3 text-sm text-slate-300 list-disc list-inside marker:text-slate-600">
            <li>Always keep the logotype horizontal. Do not rotate, skew, or stack.</li>
            <li>Maintain clear space around the logo equal to at least the height of the &ldquo;H&rdquo;.</li>
            <li>On dark backgrounds use the positive variant. On light backgrounds use the negative variant.</li>
            <li>Use monochrome (white-only or black-only) when color reproduction is limited.</li>
            <li>Do not alter the colors, proportions, or typeface of the logotype.</li>
            <li>The icon may be used independently at small sizes (favicons, avatars).</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
