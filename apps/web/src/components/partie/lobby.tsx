"use client"

import { CrownIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import { toast } from "sonner"
import { BoutonPrincipal } from "@/components/accueil/ecran"
import { COULEURS_JOUEURS } from "@/components/jeu/contexte"
import { api } from "@/lib/api"
import { MAX_JOUEURS, MIN_JOUEURS, type PartiePublique } from "@/lib/partie-types"

export function ListeJoueurs({ partie }: { partie: PartiePublique }) {
  return (
    <div className="mt-[4vh] flex w-full max-w-md flex-col items-center">
      <p className="mb-2 text-sm text-foreground/50 tabular-nums">
        {partie.joueurs.length}/{MAX_JOUEURS} joueurs
      </p>
      <ul className="flex w-full flex-col items-center gap-1.5">
        <AnimatePresence>
          {partie.joueurs.map((j, i) => (
            <motion.li
              key={j.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2.5 font-display text-2xl font-black tracking-[0.12em] uppercase"
              style={{ color: COULEURS_JOUEURS[i % COULEURS_JOUEURS.length] }}
            >
              {j.id === partie.hoteId && <CrownIcon aria-label="Hôte" className="size-6" />}
              <span>{j.pseudo}</span>
              {j.id === partie.moiId && <span className="text-sm font-semibold tracking-normal text-foreground/60 normal-case">(vous)</span>}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}

export function BoutonLobby({ partie, onMaj }: { partie: PartiePublique; onMaj: (p: PartiePublique) => void }) {
  const [lancement, setLancement] = useState(false)
  const estHote = partie.moiId === partie.hoteId
  const assez = partie.joueurs.length >= MIN_JOUEURS

  async function lancer() {
    setLancement(true)
    try {
      onMaj(await api.lancer(partie.code))
    } catch (e) {
      toast.error((e as Error).message)
      setLancement(false)
    }
  }

  if (!estHote)
    return (
      <BoutonPrincipal disabled occupe>
        En attente de l&apos;hôte
      </BoutonPrincipal>
    )
  return (
    <BoutonPrincipal onClick={lancer} disabled={!assez} occupe={lancement}>
      {assez ? "Lancer la partie" : "En attente de joueurs…"}
    </BoutonPrincipal>
  )
}
