import type { DefinitionJeu, Resultats } from "../contrat"
import { EngineError } from "../errors"
import { type DefinitionsOptions, normaliserOptions } from "../options"
import { createRng, shuffle } from "../rng"
import { type Action, type Carte, COULEURS, type Etat, type OptionsDemo, VALEUR_MAX, type VueJoueur } from "./types"

export const OPTIONS_DEMO: DefinitionsOptions = {
  manches: { type: "nombre", label: "Nombre de manches", defaut: 3, min: 1, max: 5 },
  tailleMain: { type: "nombre", label: "Cartes par joueur", aide: "Réduit automatiquement si le paquet ne suffit pas", defaut: 5, min: 3, max: 8 },
  inverse: { type: "booleen", label: "La plus basse l'emporte", defaut: false },
}

const PAQUET: Carte[] = COULEURS.flatMap((couleur) => Array.from({ length: VALEUR_MAX }, (_, i) => ({ id: `${couleur}-${i + 1}`, couleur, valeur: i + 1 })))

function distribuer(etat: Etat): Etat {
  const rng = createRng(etat.graine + etat.manche * 7919)
  const paquet = shuffle(PAQUET, rng)
  const taille = Math.min(etat.options.tailleMain, Math.floor(PAQUET.length / etat.joueurs.length))
  return {
    ...etat,
    joueurs: etat.joueurs.map((j, i) => ({ ...j, main: paquet.slice(i * taille, (i + 1) * taille), pointsParManche: [...j.pointsParManche, 0] })),
    joueurActif: etat.entameurManche,
    pli: [],
  }
}

function gagnantDuPli(pli: Etat["pli"], inverse: boolean) {
  return pli.reduce((meilleur, p) => ((inverse ? p.carte.valeur < meilleur.carte.valeur : p.carte.valeur > meilleur.carte.valeur) ? p : meilleur))
}

function jouerCarte(etat: Etat, action: Action): Etat {
  if (etat.phase !== "jeu") throw new EngineError("PHASE_INVALIDE")
  const index = etat.joueurs.findIndex((j) => j.id === action.joueurId)
  if (index < 0) throw new EngineError("JOUEUR_INCONNU")
  if (index !== etat.joueurActif) throw new EngineError("PAS_TON_TOUR")
  const joueur = etat.joueurs[index]!
  const carte = joueur.main.find((c) => c.id === action.carteId)
  if (!carte) throw new EngineError("CARTE_INCONNUE")

  let suivant: Etat = {
    ...etat,
    joueurs: etat.joueurs.map((j, i) => (i === index ? { ...j, main: j.main.filter((c) => c.id !== carte.id) } : j)),
    pli: [...etat.pli, { joueurId: joueur.id, carte }],
    joueurActif: (index + 1) % etat.joueurs.length,
    journal: [...etat.journal, { type: "carteJouee", joueurId: joueur.id, carte }],
  }
  if (suivant.pli.length < suivant.joueurs.length) return suivant

  const gagnant = gagnantDuPli(suivant.pli, suivant.options.inverse)
  const iGagnant = suivant.joueurs.findIndex((j) => j.id === gagnant.joueurId)
  suivant = {
    ...suivant,
    joueurs: suivant.joueurs.map((j, i) =>
      i === iGagnant ? { ...j, pointsParManche: j.pointsParManche.map((p, m) => (m === j.pointsParManche.length - 1 ? p + 1 : p)) } : j,
    ),
    dernierPli: { cartes: suivant.pli, gagnantId: gagnant.joueurId },
    pli: [],
    joueurActif: iGagnant,
    journal: [...suivant.journal, { type: "pliRemporte", joueurId: gagnant.joueurId, cartes: suivant.pli.map((p) => p.carte) }],
  }
  if (suivant.joueurs.some((j) => j.main.length > 0)) return suivant

  if (suivant.manche >= suivant.options.manches) return { ...suivant, phase: "fin" }
  const manche = suivant.manche + 1
  return distribuer({
    ...suivant,
    manche,
    entameurManche: (suivant.entameurManche + 1) % suivant.joueurs.length,
    journal: [...suivant.journal, { type: "nouvelleManche", manche }],
  })
}

export function resultats(etat: Etat): Resultats {
  const totaux = etat.joueurs.map((j) => ({ joueurId: j.id, total: j.pointsParManche.reduce((a, b) => a + b, 0), j }))
  const meilleur = Math.max(...totaux.map((t) => t.total))
  return {
    joueurs: totaux
      .map((t) => ({
        joueurId: t.joueurId,
        total: t.total,
        rang: 1 + totaux.filter((o) => o.total > t.total).length,
        detail: t.j.pointsParManche.map((points, m) => ({ cle: `manche-${m + 1}`, label: `Manche ${m + 1}`, points })),
      }))
      .sort((a, b) => a.rang - b.rang),
    vainqueurs: totaux.filter((t) => t.total === meilleur).map((t) => t.joueurId),
  }
}

function coupAutomatique(etat: Etat): Etat {
  const joueur = etat.joueurs[etat.joueurActif]!
  return jouerCarte(etat, { type: "jouerCarte", joueurId: joueur.id, carteId: joueur.main[0]!.id })
}

export const demo: DefinitionJeu<Etat, Action, VueJoueur> = {
  id: "demo",
  nom: "La Plus Haute",
  joueursMin: 2,
  joueursMax: 6,
  options: OPTIONS_DEMO,
  actionsClient: ["jouerCarte"],
  setup: ({ joueurs, options, graine = Math.floor(Math.random() * 2 ** 31) }) => {
    if (joueurs.length < 2 || joueurs.length > 6) throw new EngineError("JOUEURS_INVALIDES")
    const opts = normaliserOptions(OPTIONS_DEMO, options) as OptionsDemo
    return distribuer({
      graine,
      options: opts,
      joueurs: joueurs.map((j) => ({ id: j.id, pseudo: j.pseudo, main: [], pointsParManche: [] })),
      manche: 1,
      entameurManche: Math.floor(createRng(graine)() * joueurs.length),
      joueurActif: 0,
      pli: [],
      dernierPli: null,
      phase: "jeu",
      journal: [],
    })
  },
  appliquer: (etat, action) => {
    if (action.type === "jouerCarte") return jouerCarte(etat, action)
    throw new EngineError("ACTION_INVALIDE")
  },
  vue: (etat, joueurId): VueJoueur => {
    const moi = etat.joueurs.find((j) => j.id === joueurId)
    return {
      phase: etat.phase,
      options: etat.options,
      manche: etat.manche,
      moi: moi ? { id: moi.id, main: moi.main } : null,
      joueurs: etat.joueurs.map((j) => ({
        id: j.id,
        pseudo: j.pseudo,
        nbCartes: j.main.length,
        points: j.pointsParManche.reduce((a, b) => a + b, 0),
        pointsParManche: j.pointsParManche,
      })),
      joueurActifId: etat.phase === "jeu" ? (etat.joueurs[etat.joueurActif]?.id ?? null) : null,
      pli: etat.pli,
      dernierPli: etat.dernierPli,
      journal: etat.journal.slice(-40),
      resultats: etat.phase === "fin" ? resultats(etat) : null,
    }
  },
  termine: (etat) => etat.phase === "fin",
  debug: {
    tour: (etat) => {
      let e = etat
      const pliAvant = etat.journal.filter((ev) => ev.type === "pliRemporte").length
      while (e.phase === "jeu" && e.journal.filter((ev) => ev.type === "pliRemporte").length === pliAvant) e = coupAutomatique(e)
      return e
    },
    fin: (etat) => {
      let e = etat
      while (e.phase === "jeu") e = coupAutomatique(e)
      return e
    },
  },
}
