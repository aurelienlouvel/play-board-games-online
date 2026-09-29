import { GAME } from "@game/engine"
import { DESCRIPTION, NAME } from "./site"

// Keep in sync with FONT_CHOICES in apps/studio/schemaTypes/constants.ts
export const FONT_CHOICES = [
  "Inter",
  "Nunito",
  "Fredoka",
  "Baloo 2",
  "Poppins",
  "Outfit",
  "DM Sans",
  "Montserrat",
  "Space Grotesk",
  "Lilita One",
  "Bangers",
  "Bebas Neue",
  "Cinzel",
  "Playfair Display",
  "Alegreya",
  "Press Start 2P",
] as const

const FONT_WEIGHTS: Record<string, string> = {
  Inter: "400..900",
  Nunito: "400..900",
  Fredoka: "400..700",
  "Baloo 2": "400..800",
  Poppins: "400;500;600;700;800;900",
  Outfit: "400..900",
  "DM Sans": "400..900",
  Montserrat: "400..900",
  "Space Grotesk": "400..700",
  Cinzel: "400..900",
  "Playfair Display": "400..900",
  Alegreya: "400..900",
}

export type ThemeColors = { background: string; foreground: string; accent: string; surface: string; surfaceDark: string }

export type SiteSettings = {
  title: string
  description: string
  logo: string | null
  minPlayers: number
  maxPlayers: number
  theme: ThemeColors
  bodyFont: string | null
  displayFont: string | null
  rulesPdf: { fr: string | null; en: string | null }
}

export const THEME_FIELDS: { key: keyof ThemeColors; label: string; hint: string }[] = [
  { key: "background", label: "Fond", hint: "Arrière-plan des écrans" },
  { key: "foreground", label: "Texte", hint: "Texte principal" },
  { key: "accent", label: "Accent", hint: "Boutons, sélection, titres" },
  { key: "surface", label: "Surface", hint: "Cartes et panneaux" },
  { key: "surfaceDark", label: "Surface foncée", hint: "Champs et fonds secondaires" },
]

export const DEFAULT_THEME: ThemeColors = {
  background: "#13213a",
  foreground: "#f5f2ea",
  accent: "#e8b43a",
  surface: "#1b2c4a",
  surfaceDark: "#0d1729",
}

export const PLAYER_BOUNDS = { min: GAME.minPlayers, max: GAME.maxPlayers }

export const DEFAULT_SETTINGS: SiteSettings = {
  title: NAME,
  description: DESCRIPTION,
  logo: null,
  minPlayers: GAME.minPlayers,
  maxPlayers: GAME.maxPlayers,
  theme: DEFAULT_THEME,
  bodyFont: null,
  displayFont: null,
  rulesPdf: { fr: null, en: null },
}

const HEX = /^#[0-9a-fA-F]{6}$/

export const isHex = (v: unknown): v is string => typeof v === "string" && HEX.test(v)

export function clampPlayers(min: unknown, max: unknown) {
  const toInt = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : d)
  const lo = Math.min(PLAYER_BOUNDS.max, Math.max(PLAYER_BOUNDS.min, toInt(min, PLAYER_BOUNDS.min)))
  const hi = Math.min(PLAYER_BOUNDS.max, Math.max(lo, toInt(max, PLAYER_BOUNDS.max)))
  return { minPlayers: lo, maxPlayers: hi }
}

export const isFont = (v: unknown): v is string => typeof v === "string" && (FONT_CHOICES as readonly string[]).includes(v)

const fontStack = (family: string | null, fallback: string) => (family ? `"${family}", ${fallback}` : fallback)

const BODY_FALLBACK = 'ui-rounded, "Avenir Next", "Nunito", system-ui, -apple-system, sans-serif'

export function themeStyle(s: SiteSettings): Record<string, string> {
  return {
    "--background": s.theme.background,
    "--foreground": s.theme.foreground,
    "--accent-game": s.theme.accent,
    "--surface": s.theme.surface,
    "--surface-dark": s.theme.surfaceDark,
    "--primary-foreground": s.theme.background,
    "--popover": s.theme.foreground,
    "--popover-foreground": s.theme.background,
    "--secondary": s.theme.foreground,
    "--secondary-foreground": s.theme.background,
    "--muted": `color-mix(in oklab, ${s.theme.surface}, ${s.theme.foreground} 8%)`,
    "--accent": `color-mix(in oklab, ${s.theme.surface}, ${s.theme.foreground} 8%)`,
    "--font-body": fontStack(s.bodyFont, BODY_FALLBACK),
    "--font-title": fontStack(s.displayFont ?? s.bodyFont, BODY_FALLBACK),
  }
}

export function googleFontsHref(fonts: (string | null)[]) {
  const families = [...new Set(fonts.filter(isFont))]
  if (!families.length) return null
  const query = families.map((f) => `family=${f.replace(/ /g, "+")}${FONT_WEIGHTS[f] ? `:wght@${FONT_WEIGHTS[f]}` : ""}`).join("&")
  return `https://fonts.googleapis.com/css2?${query}&display=swap`
}
