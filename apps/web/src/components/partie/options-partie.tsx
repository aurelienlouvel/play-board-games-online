"use client"

import { type DefinitionOption, JEU, type ValeurOption, type ValeursOptions } from "@jeu/engine"
import { MinusIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import type { PartiePublique } from "@/lib/partie-types"
import { cn } from "@/lib/utils"

export function OptionsPartie({ partie, onMaj }: { partie: PartiePublique; onMaj: (p: PartiePublique) => void }) {
  const editable = partie.moiId === partie.hoteId && partie.statut !== "jeu"
  const [local, setLocal] = useState<{ version: number; valeurs: ValeursOptions } | null>(null)
  const valeurs = local && local.version >= partie.version ? local.valeurs : partie.options
  const entrees = Object.entries(JEU.options)
  if (entrees.length === 0) return null

  async function changer(cle: string, valeur: ValeurOption) {
    const suivantes = { ...valeurs, [cle]: valeur }
    setLocal({ version: partie.version + 1, valeurs: suivantes })
    try {
      onMaj(await api.options(partie.code, suivantes))
    } catch (e) {
      setLocal(null)
      toast.error((e as Error).message)
    }
  }

  return (
    <section className="mt-[4vh] w-full max-w-md rounded-2xl border border-foreground/10 bg-surface/70 p-5 backdrop-blur-sm">
      <h2 className="mb-4 flex items-baseline justify-between font-display text-sm font-semibold tracking-[0.14em] text-foreground/60 uppercase">
        Options de la partie
        {!editable && <span className="text-xs tracking-normal normal-case">choisies par l&apos;hôte</span>}
      </h2>
      <ul className="space-y-4">
        {entrees.map(([cle, def]) => (
          <li key={cle} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold">{def.label}</p>
              {def.aide && <p className="text-xs text-foreground/50">{def.aide}</p>}
            </div>
            <Controle def={def} valeur={valeurs[cle] ?? def.defaut} editable={editable} onChange={(v) => changer(cle, v)} />
          </li>
        ))}
      </ul>
    </section>
  )
}

const BOUTON = "flex size-8 cursor-pointer items-center justify-center rounded-md border border-foreground/20 transition-colors hover:bg-foreground/10 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"

function Controle({ def, valeur, editable, onChange }: { def: DefinitionOption; valeur: ValeurOption; editable: boolean; onChange: (v: ValeurOption) => void }) {
  if (def.type === "nombre") {
    const n = Number(valeur)
    const pas = def.pas ?? 1
    return (
      <div className="flex shrink-0 items-center gap-2">
        {editable && (
          <button type="button" aria-label="Moins" className={BOUTON} disabled={n <= def.min} onClick={() => onChange(Math.max(def.min, n - pas))}>
            <MinusIcon className="size-4" />
          </button>
        )}
        <span className="w-8 text-center font-display text-xl font-bold tabular-nums">{n}</span>
        {editable && (
          <button type="button" aria-label="Plus" className={BOUTON} disabled={n >= def.max} onClick={() => onChange(Math.min(def.max, n + pas))}>
            <PlusIcon className="size-4" />
          </button>
        )}
      </div>
    )
  }
  if (def.type === "choix")
    return (
      <div className="flex shrink-0 overflow-hidden rounded-lg border border-foreground/20">
        {def.choix.map((c) => (
          <button
            key={c.valeur}
            type="button"
            disabled={!editable}
            onClick={() => onChange(c.valeur)}
            className={cn(
              "px-3 py-1.5 text-sm transition-colors disabled:cursor-default",
              valeur === c.valeur ? "bg-jeu font-semibold text-background" : editable ? "cursor-pointer hover:bg-foreground/10" : "text-foreground/50",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
    )
  const actif = Boolean(valeur)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      disabled={!editable}
      onClick={() => onChange(!actif)}
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-default", actif ? "bg-jeu" : "bg-foreground/20", editable && "cursor-pointer")}
    >
      <span className={cn("absolute top-1 size-5 rounded-full bg-foreground shadow transition-[left]", actif ? "left-6" : "left-1")} />
    </button>
  )
}
