import type { Resultats } from "../contrat"

export const COULEURS = ["soleil", "lune", "etoile", "comete"] as const
export type Couleur = (typeof COULEURS)[number]
export const VALEUR_MAX = 10

export type Carte = { id: string; couleur: Couleur; valeur: number }

export type CartePosee = { joueurId: string; carte: Carte }

export type JoueurEtat = {
  id: string
  pseudo: string
  main: Carte[]
  pointsParManche: number[]
}

export type Evenement =
  | { type: "carteJouee"; joueurId: string; carte: Carte }
  | { type: "pliRemporte"; joueurId: string; cartes: Carte[] }
  | { type: "nouvelleManche"; manche: number }

export type OptionsDemo = { manches: number; tailleMain: number; inverse: boolean }

export type Etat = {
  graine: number
  options: OptionsDemo
  joueurs: JoueurEtat[]
  manche: number
  entameurManche: number
  joueurActif: number
  pli: CartePosee[]
  dernierPli: { cartes: CartePosee[]; gagnantId: string } | null
  phase: "jeu" | "fin"
  journal: Evenement[]
}

export type Action = { type: "jouerCarte"; joueurId: string; carteId: string }

export type VueJoueur = {
  phase: Etat["phase"]
  options: OptionsDemo
  manche: number
  moi: { id: string; main: Carte[] } | null
  joueurs: { id: string; pseudo: string; nbCartes: number; points: number; pointsParManche: number[] }[]
  joueurActifId: string | null
  pli: CartePosee[]
  dernierPli: Etat["dernierPli"]
  journal: Evenement[]
  resultats: Resultats | null
}
