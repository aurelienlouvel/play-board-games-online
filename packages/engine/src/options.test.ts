import { describe, expect, it } from "vitest"
import { type DefinitionsOptions, normaliserOptions, optionsParDefaut } from "./options"

const DEFS: DefinitionsOptions = {
  manches: { type: "nombre", label: "Manches", defaut: 3, min: 1, max: 5 },
  mode: { type: "choix", label: "Mode", defaut: "a", choix: [{ valeur: "a", label: "A" }, { valeur: "b", label: "B" }] },
  variante: { type: "booleen", label: "Variante", defaut: false },
}

describe("options", () => {
  it("donne les valeurs par défaut", () => {
    expect(optionsParDefaut(DEFS)).toEqual({ manches: 3, mode: "a", variante: false })
  })
  it("borne, arrondit et rejette les valeurs invalides", () => {
    expect(normaliserOptions(DEFS, { manches: 9, mode: "z", variante: "oui", inconnue: 1 })).toEqual({ manches: 5, mode: "a", variante: false })
    expect(normaliserOptions(DEFS, { manches: 2.4, mode: "b", variante: true })).toEqual({ manches: 2, mode: "b", variante: true })
    expect(normaliserOptions(DEFS, null)).toEqual({ manches: 3, mode: "a", variante: false })
  })
})
