export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")

export const SLUG = "template"

export const NOM = "La Plus Haute"

export const TITRE = "Play Game Online · Template"

export const ACCROCHE = "Le socle commun des jeux de société en ligne"

export const DESCRIPTION =
  "Template des jeux de société en ligne : lobby, configuration de partie, temps réel, plateau 3D, fin de partie et partage. Jeu de démonstration : La Plus Haute."

export const MOTS_CLES = ["jeu de cartes en ligne", "jeu de société en ligne", "jeu entre amis", "jeu gratuit", "multijoueur"]

export const COULEUR = "#13213a"

export const LOGO: string | null = null

export const AUTEUR = { nom: "oré", url: "https://ore.today" }

export const GENRES = ["Jeu de cartes", "Jeu de plis"]

export const CONTACT = "louvel.aurelien.pro@gmail.com"

export const CREDITS: { jeu: string; auteurs: string; editeur: { nom: string; url: string } } | null = null
