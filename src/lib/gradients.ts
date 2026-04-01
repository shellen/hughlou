// Deterministic gradient from title string — used as placeholder
// when no thumbnail is available. Reduced from 16 to 6 palettes
// (crisp design: avoid unnecessary visual noise).
const palettes = [
  { bg: "#14141f", accent: "#4a6fa5" },
  { bg: "#170d26", accent: "#7c5cbf" },
  { bg: "#111927", accent: "#5a8ec0" },
  { bg: "#0e1a1f", accent: "#4a9aa8" },
  { bg: "#131320", accent: "#7068a8" },
  { bg: "#101825", accent: "#5580ad" },
]

export function titleToGradient(title: string) {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash
  }
  return palettes[Math.abs(hash) % palettes.length]
}
