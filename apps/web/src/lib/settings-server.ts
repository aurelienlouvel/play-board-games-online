import "server-only"
import { cache } from "react"
import { client } from "@/sanity/client"
import { urlFor } from "@/sanity/image"
import { clampPlayers, DEFAULT_SETTINGS, DEFAULT_THEME, isFont, isHex, type SiteSettings, type ThemeColors } from "./settings"

export const SETTINGS_TAG = "settings"

export type SettingsDoc = {
  title?: string
  description?: string
  logo?: Parameters<typeof urlFor>[0] & { asset?: { _ref?: string } }
  minPlayers?: number
  maxPlayers?: number
  theme?: Partial<ThemeColors>
  bodyFont?: string
  displayFont?: string
  rulesPdfFr?: string
  rulesPdfEn?: string
  creditsAuthors?: string
  creditsIllustrator?: string
  publisher?: string
  publisherUrl?: string
} | null

export const SETTINGS_QUERY = `*[_id == "settings"][0]{ title, description, logo, minPlayers, maxPlayers, theme, bodyFont, displayFont, rulesPdfFr, rulesPdfEn, creditsAuthors, creditsIllustrator, publisher, publisherUrl }`

const url = (v: unknown) => (typeof v === "string" && /^https?:\/\//.test(v) ? v : null)

export function toSettings(doc: SettingsDoc): SiteSettings {
  if (!doc) return DEFAULT_SETTINGS
  const theme = Object.fromEntries(
    Object.entries(DEFAULT_THEME).map(([k, d]) => [k, isHex(doc.theme?.[k as keyof ThemeColors]) ? doc.theme![k as keyof ThemeColors]! : d]),
  ) as ThemeColors
  return {
    title: doc.title?.trim() || DEFAULT_SETTINGS.title,
    description: doc.description?.trim() || DEFAULT_SETTINGS.description,
    logo: doc.logo?.asset?._ref ? urlFor(doc.logo).width(1200).url() : null,
    ...clampPlayers(doc.minPlayers, doc.maxPlayers),
    theme,
    bodyFont: isFont(doc.bodyFont) ? doc.bodyFont : null,
    displayFont: isFont(doc.displayFont) ? doc.displayFont : null,
    rulesPdf: { fr: url(doc.rulesPdfFr), en: url(doc.rulesPdfEn) },
    credits: {
      authors: doc.creditsAuthors?.trim() || null,
      illustrator: doc.creditsIllustrator?.trim() || null,
      publisher: doc.publisher?.trim() || null,
      publisherUrl: url(doc.publisherUrl),
    },
  }
}

export const loadSettings = cache(async (): Promise<SiteSettings> => {
  if (!client) return DEFAULT_SETTINGS
  try {
    const doc = await client.withConfig({ useCdn: false }).fetch<SettingsDoc>(SETTINGS_QUERY, {}, { next: { tags: [SETTINGS_TAG], revalidate: 300 } })
    return toSettings(doc)
  } catch {
    return DEFAULT_SETTINGS
  }
})
