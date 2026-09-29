import { describe, expect, it } from "vitest"
import { EngineError } from "../errors"
import { demo } from "./jeu"
import type { Etat } from "./types"

const joueurs = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `j${i}`, pseudo: `J${i}` }))

function jouerJusquaLaFin(etat: Etat) {
  let e = etat
  let garde = 0
  while (e.phase === "jeu" && garde++ < 1000) {
    const j = e.joueurs[e.joueurActif]!
    e = demo.appliquer(e, { type: "jouerCarte", joueurId: j.id, carteId: j.main[0]!.id })
  }
  return e
}

describe("La Plus Haute", () => {
  it("distribue la taille de main demandée, bornée par le paquet", () => {
    expect(demo.setup({ joueurs: joueurs(3), options: { tailleMain: 5 }, graine: 1 }).joueurs.every((j) => j.main.length === 5)).toBe(true)
    expect(demo.setup({ joueurs: joueurs(6), options: { tailleMain: 8 }, graine: 1 }).joueurs.every((j) => j.main.length === 6)).toBe(true)
  })

  it("refuse de jouer hors de son tour ou une carte absente", () => {
    const e = demo.setup({ joueurs: joueurs(2), options: {}, graine: 2 })
    const autre = e.joueurs[(e.joueurActif + 1) % 2]!
    expect(() => demo.appliquer(e, { type: "jouerCarte", joueurId: autre.id, carteId: autre.main[0]!.id })).toThrow(EngineError)
    const actif = e.joueurs[e.joueurActif]!
    expect(() => demo.appliquer(e, { type: "jouerCarte", joueurId: actif.id, carteId: "inconnue" })).toThrow(EngineError)
  })

  it("donne le pli à la plus haute carte (ou la plus basse en variante inversée)", () => {
    for (const inverse of [false, true]) {
      let e = demo.setup({ joueurs: joueurs(3), options: { inverse }, graine: 3 })
      const cartes = []
      for (let k = 0; k < 3; k++) {
        const j = e.joueurs[e.joueurActif]!
        cartes.push({ joueurId: j.id, valeur: j.main[0]!.valeur })
        e = demo.appliquer(e, { type: "jouerCarte", joueurId: j.id, carteId: j.main[0]!.id })
      }
      const attendu = cartes.reduce((m, c) => ((inverse ? c.valeur < m.valeur : c.valeur > m.valeur) ? c : m))
      expect(e.dernierPli?.gagnantId).toBe(attendu.joueurId)
      expect(e.joueurs[e.joueurActif]!.id).toBe(attendu.joueurId)
    }
  })

  it("enchaîne les manches puis termine, avec des résultats cohérents", () => {
    for (let graine = 0; graine < 30; graine++) {
      const n = 2 + (graine % 5)
      const manches = 1 + (graine % 3)
      const fin = jouerJusquaLaFin(demo.setup({ joueurs: joueurs(n), options: { manches, tailleMain: 4 }, graine }))
      expect(fin.phase).toBe("fin")
      expect(fin.joueurs.every((j) => j.pointsParManche.length === manches)).toBe(true)
      const vue = demo.vue(fin, "j0")
      const total = vue.resultats!.joueurs.reduce((a, j) => a + j.total, 0)
      expect(total).toBe(manches * Math.min(4, Math.floor(40 / n)))
      expect(vue.resultats!.vainqueurs.length).toBeGreaterThan(0)
    }
  })

  it("ne montre que sa propre main", () => {
    const e = demo.setup({ joueurs: joueurs(3), options: {}, graine: 4 })
    const vue = demo.vue(e, "j1")
    expect(vue.moi?.main).toEqual(e.joueurs[1]!.main)
    expect(JSON.stringify(vue)).not.toContain(e.joueurs[0]!.main[0]!.id + '"')
    expect(demo.vue(e, null).moi).toBeNull()
  })

  it("commandes de debug", () => {
    const e = demo.setup({ joueurs: joueurs(3), options: {}, graine: 5 })
    expect(demo.debug!.tour!(e).dernierPli).not.toBeNull()
    expect(demo.debug!.fin!(e).phase).toBe("fin")
  })
})
