export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")

export const SLUG = "template"

export const NAME = "La Plus Haute"

export const TITLE = "Play Game Online · Template"

export const TAGLINE = "Le socle commun des jeux de société en ligne"

export const DESCRIPTION =
  "Template des jeux de société en ligne : lobby, configuration de partie, temps réel, plateau 3D, fin de partie et partage. Jeu de démonstration : La Plus Haute."

export const KEYWORDS = ["jeu de cartes en ligne", "jeu de société en ligne", "jeu entre amis", "jeu gratuit", "multijoueur"]

export const COLOR = "#13213a"

export const LOGO: string | null = null

export const AUTHOR = { name: "oré", url: "https://ore.today" }

export const GENRES = ["Jeu de cartes", "Jeu de plis"]

export const CONTACT = "louvel.aurelien.pro@gmail.com"

export const CREDITS: { game: string; authors: string; editor: { name: string; url: string } } | null = null
