import "server-only"
import { client } from "@/sanity/client"
import { urlFor } from "@/sanity/image"
import { type Localise, traduire } from "./i18n"
import { type ContenuRegles, REGLES_PAR_DEFAUT } from "./regles"

type RulesSanity = {
  intro?: Localise
  videoId?: string
  sections?: { title?: Localise; body?: Localise; image?: Parameters<typeof urlFor>[0] }[]
} | null

export async function chargerRegles(): Promise<ContenuRegles> {
  if (!client) return REGLES_PAR_DEFAUT
  try {
    const rules = await client.fetch<RulesSanity>(`*[_id == "rules"][0]{ intro, videoId, sections[]{ title, body, image } }`, {}, { next: { revalidate: 60 } })
    const sections = (rules?.sections ?? [])
      .map((s) => ({ titre: traduire(s.title) ?? "", texte: traduire(s.body) ?? "", image: s.image ? urlFor(s.image).width(1200).url() : null }))
      .filter((s) => s.titre)
    return {
      intro: traduire(rules?.intro) || REGLES_PAR_DEFAUT.intro,
      videoId: rules?.videoId || REGLES_PAR_DEFAUT.videoId,
      sections: sections.length ? sections : REGLES_PAR_DEFAUT.sections,
    }
  } catch {
    return REGLES_PAR_DEFAUT
  }
}
