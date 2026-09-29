export type DefinitionOption =
  | { type: "nombre"; label: string; aide?: string; defaut: number; min: number; max: number; pas?: number }
  | { type: "choix"; label: string; aide?: string; defaut: string; choix: { valeur: string; label: string }[] }
  | { type: "booleen"; label: string; aide?: string; defaut: boolean }

export type DefinitionsOptions = Record<string, DefinitionOption>

export type ValeurOption = number | string | boolean
export type ValeursOptions = Record<string, ValeurOption>

export function optionsParDefaut(definitions: DefinitionsOptions): ValeursOptions {
  return Object.fromEntries(Object.entries(definitions).map(([cle, def]) => [cle, def.defaut]))
}

export function normaliserOptions(definitions: DefinitionsOptions, entree: unknown): ValeursOptions {
  const brut = entree && typeof entree === "object" ? (entree as Record<string, unknown>) : {}
  return Object.fromEntries(
    Object.entries(definitions).map(([cle, def]) => {
      const v = brut[cle]
      switch (def.type) {
        case "nombre": {
          const n = typeof v === "number" && Number.isFinite(v) ? v : def.defaut
          const pas = def.pas ?? 1
          const arrondi = Math.round((n - def.min) / pas) * pas + def.min
          return [cle, Math.min(def.max, Math.max(def.min, arrondi))]
        }
        case "choix":
          return [cle, typeof v === "string" && def.choix.some((c) => c.valeur === v) ? v : def.defaut]
        case "booleen":
          return [cle, typeof v === "boolean" ? v : def.defaut]
      }
    }),
  )
}
