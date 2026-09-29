"use client"

import type { VueJoueur } from "@jeu/engine"
import { createContext, useContext, useMemo } from "react"
import type { PartiePublique } from "@/lib/partie-types"

type JeuContexte = {
  partie: PartiePublique
  vue: VueJoueur
  pseudo: (joueurId: string) => string
  couleur: (joueurId: string) => string
}

export const COULEURS_JOUEURS = ["#e8795a", "#9d8cf2", "#e56fa4", "#6fb4e5", "#e8b43a", "#6fd3a8"]

const Contexte = createContext<JeuContexte | null>(null)

export function JeuProvider({ partie, vue, children }: { partie: PartiePublique; vue: VueJoueur; children: React.ReactNode }) {
  const valeur = useMemo<JeuContexte>(
    () => ({
      partie,
      vue,
      pseudo: (id) => partie.joueurs.find((j) => j.id === id)?.pseudo ?? "?",
      couleur: (id) => COULEURS_JOUEURS[Math.max(0, partie.joueurs.findIndex((j) => j.id === id)) % COULEURS_JOUEURS.length]!,
    }),
    [partie, vue],
  )
  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>
}

export function useJeu() {
  const ctx = useContext(Contexte)
  if (!ctx) throw new Error("useJeu hors de JeuProvider")
  return ctx
}
