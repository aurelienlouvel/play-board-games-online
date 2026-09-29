"use client"

import { Leva, LevaPanel, button, useControls } from "leva"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { cn } from "@/lib/utils"
import { arrondir, MAGASINS_DEBUG, ONGLETS_DEBUG, type OngletDebug } from "./onglets-debug"

const CLE = "jeu:debug"
const abonnes = new Set<() => void>()

function lire() {
  try {
    return new URLSearchParams(window.location.search).has("debug") || localStorage.getItem(CLE) === "1"
  } catch {
    return false
  }
}

function basculer() {
  try {
    localStorage.setItem(CLE, lire() ? "0" : "1")
    const url = new URL(window.location.href)
    if (url.searchParams.has("debug")) {
      url.searchParams.delete("debug")
      window.history.replaceState(null, "", url)
    }
  } catch {}
  abonnes.forEach((f) => f())
}

function copierTout() {
  const valeurs: Record<string, Record<string, unknown>> = {}
  for (const nom of ONGLETS_DEBUG) {
    const donnees = MAGASINS_DEBUG[nom].getData() as Record<string, { type?: string; value?: unknown }>
    for (const [chemin, entree] of Object.entries(donnees)) {
      if (!entree || entree.type === "BUTTON" || entree.value === undefined) continue
      ;(valeurs[nom] ??= {})[chemin] = entree.value
    }
  }
  const texte = JSON.stringify(valeurs, arrondir, 2)
  navigator.clipboard?.writeText(texte).catch(() => null)
  console.info("Réglages debug", valeurs)
}

function Fps() {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let id = 0
    let images = 0
    let debut = performance.now()
    let pire = 0
    let precedent = debut
    const boucle = (t: number) => {
      images++
      pire = Math.max(pire, t - precedent)
      precedent = t
      if (t - debut >= 500) {
        const fps = Math.round((images * 1000) / (t - debut))
        const el = ref.current
        if (el) {
          el.textContent = `${fps} FPS · ${Math.round(pire)}ms`
          el.style.color = fps >= 50 ? "#7ee787" : fps >= 30 ? "#f2cc60" : "#ff7b72"
        }
        images = 0
        pire = 0
        debut = t
      }
      id = requestAnimationFrame(boucle)
    }
    id = requestAnimationFrame(boucle)
    return () => cancelAnimationFrame(id)
  }, [])
  return <span ref={ref} className="shrink-0 self-center px-3 tabular-nums" />
}

export function PanneauDebug() {
  useControls({ "Copy all settings": button(copierTout) })
  const [ongletActif, setOnglet] = useState<OngletDebug>("GAME")
  const actif = useSyncExternalStore(
    (f) => {
      abonnes.add(f)
      return () => abonnes.delete(f)
    },
    lire,
    () => false,
  )

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === "d" && !(e.target instanceof HTMLInputElement)) basculer()
    }
    window.addEventListener("keydown", touche)
    return () => window.removeEventListener("keydown", touche)
  }, [])

  return (
    <div className={cn("absolute top-44 left-4 z-40 w-[27rem]", !actif && "hidden")}>
      <div className="flex gap-px overflow-hidden rounded-t-md bg-[#292d39] font-mono text-[10px] tracking-wider">
        {ONGLETS_DEBUG.map((nom) => (
          <button
            key={nom}
            type="button"
            onClick={() => setOnglet(nom)}
            className={cn("flex-1 py-2 text-[#8c92a4] hover:text-white", ongletActif === nom && "bg-[#181c20] text-white")}
          >
            {nom}
          </button>
        ))}
        {actif && <Fps />}
      </div>
      <Leva hidden />
      {actif && (
        <div className="max-h-[min(60vh,calc(100dvh-14rem))] overflow-y-auto rounded-b-md bg-[#181c20] [scrollbar-width:thin]">
          <LevaPanel
            key={ongletActif}
            store={MAGASINS_DEBUG[ongletActif]}
            fill
            flat
            collapsed={false}
            titleBar={{ title: "Debug · Shift+D", filter: false }}
          />
        </div>
      )}
    </div>
  )
}
