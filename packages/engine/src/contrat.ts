import type { DefinitionsOptions, ValeursOptions } from "./options"

export type JoueurInfo = { id: string; pseudo: string }

export type ActionJoueur = { type: string; joueurId: string }

export type ResultatJoueur = {
  joueurId: string
  total: number
  rang: number
  detail: { cle: string; label: string; points: number }[]
}

export type Resultats = { joueurs: ResultatJoueur[]; vainqueurs: string[] }

export type DefinitionJeu<Etat, Action extends ActionJoueur, Vue> = {
  id: string
  nom: string
  joueursMin: number
  joueursMax: number
  options: DefinitionsOptions
  actionsClient: readonly Action["type"][]
  setup: (args: { joueurs: JoueurInfo[]; options: ValeursOptions; graine?: number }) => Etat
  appliquer: (etat: Etat, action: Action) => Etat
  vue: (etat: Etat, joueurId: string | null) => Vue
  termine: (etat: Etat) => boolean
  debug?: Partial<Record<CommandeDebug, (etat: Etat) => Etat>>
}

export type CommandeDebug = "tour" | "fin"
