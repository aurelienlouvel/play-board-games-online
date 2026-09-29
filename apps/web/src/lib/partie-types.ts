import { type Etat, JEU, type JoueurInfo, type ValeursOptions, type VueJoueur } from "@jeu/engine"

export const MAX_JOUEURS = JEU.joueursMax
export const MIN_JOUEURS = JEU.joueursMin

export type StatutPartie = "lobby" | "jeu" | "fin"

export type PartiePublique = {
  code: string
  hoteId: string
  statut: StatutPartie
  joueurs: JoueurInfo[]
  moiId: string | null
  options: ValeursOptions
  rejouer: string[]
  version: number
  vue: VueJoueur | null
}

export type EtatPartie = Etat

export const canalPartie = (code: string) => `partie:${code}`
export const EVENEMENT_MAJ = "maj"
