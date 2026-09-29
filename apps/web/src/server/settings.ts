import "server-only"
import { revalidatePath, revalidateTag } from "next/cache"
import { SETTINGS_QUERY, SETTINGS_TAG, type SettingsDoc, toSettings } from "@/lib/settings-server"
import { clampPlayers, DEFAULT_THEME, isFont, isHex, type SiteSettings, type ThemeColors } from "@/lib/settings"
import { sanityConfigure } from "@/sanity/client"
import { writeClient } from "@/sanity/write-client"
import { ApiError } from "./api"

const DOC_ID = "settings"

function client() {
  if (!writeClient) throw new ApiError(sanityConfigure ? "SANITY_TOKEN_MISSING" : "SANITY_NOT_CONFIGURED", 503)
  return writeClient
}

export async function readSettingsFresh(): Promise<SiteSettings> {
  return toSettings(await client().fetch<SettingsDoc>(SETTINGS_QUERY))
}

function refresh() {
  revalidateTag(SETTINGS_TAG, { expire: 0 })
  revalidatePath("/", "layout")
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")
const httpUrl = (v: unknown) => {
  const s = text(v, 500)
  if (!s) return null
  if (!/^https?:\/\/\S+$/.test(s)) throw new ApiError("INVALID_URL")
  return s
}

export async function saveSettings(input: Partial<SiteSettings>) {
  const theme = Object.fromEntries(
    Object.keys(DEFAULT_THEME).map((k) => {
      const v = input.theme?.[k as keyof ThemeColors]
      if (!isHex(v)) throw new ApiError("INVALID_COLOR")
      return [k, v.toLowerCase()]
    }),
  )
  const set: Record<string, unknown> = {
    title: text(input.title, 80),
    description: text(input.description, 400),
    ...clampPlayers(input.minPlayers, input.maxPlayers),
    theme,
  }
  const unset: string[] = []
  const optional: Record<string, string | null> = {
    bodyFont: isFont(input.bodyFont) ? input.bodyFont : null,
    displayFont: isFont(input.displayFont) ? input.displayFont : null,
    rulesPdfFr: httpUrl(input.rulesPdf?.fr),
    rulesPdfEn: httpUrl(input.rulesPdf?.en),
    creditsAuthors: text(input.credits?.authors, 240) || null,
    publisher: text(input.credits?.publisher, 80) || null,
    publisherUrl: httpUrl(input.credits?.publisherUrl),
  }
  for (const [k, v] of Object.entries(optional)) {
    if (v) set[k] = v
    else unset.push(k)
  }
  if (!set.title) throw new ApiError("EMPTY_TITLE")
  const c = client()
  await c.createIfNotExists({ _id: DOC_ID, _type: "settings" })
  await c.patch(DOC_ID).set(set).unset(unset).commit()
  refresh()
  return readSettingsFresh()
}

const MAX_LOGO = 5 * 1024 * 1024

export async function uploadLogo(file: File) {
  if (!file.type.startsWith("image/")) throw new ApiError("INVALID_FILE")
  if (file.size > MAX_LOGO) throw new ApiError("FILE_TOO_LARGE")
  const c = client()
  const asset = await c.assets.upload("image", Buffer.from(await file.arrayBuffer()), { filename: file.name, contentType: file.type })
  await c.createIfNotExists({ _id: DOC_ID, _type: "settings" })
  await c
    .patch(DOC_ID)
    .set({ logo: { _type: "image", asset: { _type: "reference", _ref: asset._id } } })
    .commit()
  refresh()
  return readSettingsFresh()
}

export async function removeLogo() {
  const c = client()
  await c.createIfNotExists({ _id: DOC_ID, _type: "settings" })
  await c.patch(DOC_ID).unset(["logo"]).commit()
  refresh()
  return readSettingsFresh()
}
