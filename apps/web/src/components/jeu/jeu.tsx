"use client"

import type { Evenement } from "@jeu/engine"
import { button, useControls } from "leva"
import { LogOutIcon } from "lucide-react"
import { AnimatePresence } from "motion/react"
import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Annonce, type TypeAnnonce, useReglagesAnnonces } from "@/components/jeu3d/annonce"
import { PanneauDebug } from "@/components/jeu3d/debug"
import { onglet } from "@/components/jeu3d/onglets-debug"
import { ReglesButton } from "@/components/regles"
import { api, type CommandeDebugClient } from "@/lib/api"
import type { PartiePublique } from "@/lib/partie-types"
import type { ContenuRegles } from "@/lib/regles"
import { NOM } from "@/lib/site"
import { cn } from "@/lib/utils"
import { JeuProvider, useJeu } from "./contexte"
import { annonceVainqueur, FinDePartie } from "./fin-de-partie"

const Scene = dynamic(() => import("@/components/jeu3d/scene").then((m) => m.Scene), { ssr: false })

let compteurAnnonces = 0

type AnnonceFile = { id: number; texte: string; sousTexte?: string; type: TypeAnnonce }

type Props = { partie: PartiePublique; regles: ContenuRegles; onMaj: (p: PartiePublique) => void; onQuitter: () => void }

export function Jeu(props: Props) {
  const vue = props.partie.vue
  if (!vue) return null
  return (
    <JeuProvider partie={props.partie} vue={vue}>
      <Table {...props} />
    </JeuProvider>
  )
}

function texteEvenement(e: Evenement, pseudo: (id: string) => string) {
  if (e.type === "carteJouee") return `${pseudo(e.joueurId)} joue ${e.carte.valeur}`
  if (e.type === "pliRemporte") return `${pseudo(e.joueurId)} remporte le pli`
  return `Manche ${e.manche}`
}

function Table({ regles, onMaj, onQuitter }: Props) {
  const { partie, vue, pseudo, couleur } = useJeu()
  const reglages = useReglagesAnnonces()
  const [annonces, setAnnonces] = useState<AnnonceFile[]>([])
  const [scoresOuverts, setScoresOuverts] = useState(true)
  const [envoi, setEnvoi] = useState(false)
  const precedent = useRef<{ manche: number; actif: string | null; phase: string } | null>(null)

  const moiId = vue.moi?.id ?? null
  const monTour = vue.phase === "jeu" && !!moiId && vue.joueurActifId === moiId
  const fin = vue.phase === "fin"

  function annoncer(texte: string, type: TypeAnnonce, sousTexte?: string) {
    const id = ++compteurAnnonces
    setAnnonces((l) => [...l, { id, texte, sousTexte, type }])
  }

  useEffect(() => {
    const avant = precedent.current
    precedent.current = { manche: vue.manche, actif: vue.joueurActifId, phase: vue.phase }
    if (vue.phase === "fin") {
      if (avant?.phase !== "fin") {
        const { phrase, detail } = annonceVainqueur(partie, vue)
        annoncer(phrase, "victoire", detail)
        setScoresOuverts(true)
      }
      return
    }
    if (!avant || avant.phase === "fin") annoncer("C'est parti !", "debut", `${vue.options.manches} manche${vue.options.manches > 1 ? "s" : ""}`)
    else if (avant.manche !== vue.manche) annoncer(`Manche ${vue.manche}`, "debut")
    if (monTour && (avant?.actif !== vue.joueurActifId || avant?.manche !== vue.manche)) annoncer("C'est votre tour", "tour")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vue.phase, vue.manche, vue.joueurActifId])

  const annonce = annonces[0] ?? null
  useEffect(() => {
    if (!annonce) return
    const t = setTimeout(() => setAnnonces((l) => l.slice(1)), reglages[annonce.type].duree * 1000)
    return () => clearTimeout(t)
  }, [annonce, reglages])

  function commandeDebug(commande: CommandeDebugClient) {
    api
      .debug(partie.code, commande)
      .then(onMaj)
      .catch((e: Error) => toast.error(e.message))
  }

  useControls(
    "Phases",
    {
      "START · new game": button(() => commandeDebug("debut")),
      "NEXT TURN · auto play": button(() => commandeDebug("tour")),
      "END · play to the end": button(() => commandeDebug("fin")),
    },
    [partie.code],
  )
  useControls(
    "Replay",
    {
      "Start announcement": button(() => annoncer("C'est parti !", "debut", "3 manches")),
      "Your turn announcement": button(() => annoncer("C'est votre tour", "tour")),
      "Victory announcement": button(() => annoncer("Victoire de", "victoire", "Oré · 9 pts")),
    },
    { order: 1 },
    onglet("TRANSITION"),
  )

  async function jouer(carteId: string) {
    if (!monTour || envoi || !moiId) return
    setEnvoi(true)
    try {
      onMaj(await api.action(partie.code, { type: "jouerCarte", carteId }))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setEnvoi(false)
    }
  }

  const derniers = vue.journal.slice(-4).reverse()

  return (
    <div className="fond fixed inset-0 overflow-hidden text-foreground">
      <div className="absolute inset-0">
        <Scene vue={vue} couleur={couleur} monTour={monTour && !envoi} onJouer={jouer} />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-4 p-4">
        <div className="pointer-events-auto flex items-center gap-3">
          <p className="font-display text-xl font-black tracking-[0.14em] uppercase">{NOM}</p>
          <ReglesButton regles={regles} />
        </div>
        <button
          type="button"
          onClick={onQuitter}
          className="pointer-events-auto inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm text-foreground/75 transition-colors hover:bg-white/10 hover:text-foreground"
        >
          <LogOutIcon className="size-4" />
          Quitter
        </button>
      </header>

      {!fin && (
        <div className="pointer-events-none absolute top-16 left-4 z-20 flex flex-col items-start gap-0.5">
          <p className="font-display text-sm tracking-[0.2em] text-foreground/55 uppercase tabular-nums">
            Manche {vue.manche}/{vue.options.manches}
            {vue.options.inverse && " · la plus basse gagne"}
          </p>
          <p
            className={cn("font-display text-xl font-black tracking-[0.12em] uppercase", monTour && "text-jeu")}
            style={monTour || !vue.joueurActifId ? undefined : { color: couleur(vue.joueurActifId) }}
          >
            {monTour ? "À vous de jouer" : vue.joueurActifId ? `Tour de ${pseudo(vue.joueurActifId)}` : ""}
          </p>
        </div>
      )}

      {!fin && derniers.length > 0 && (
        <ol className="pointer-events-none absolute right-4 bottom-4 z-20 flex flex-col items-end gap-1 text-sm">
          {derniers.map((e, i) => (
            <li key={vue.journal.length - i} className="rounded-md bg-black/35 px-2.5 py-1 text-foreground/80" style={{ opacity: 1 - i * 0.2 }}>
              {texteEvenement(e, pseudo)}
            </li>
          ))}
        </ol>
      )}

      <AnimatePresence>{annonce && <Annonce key={annonce.id} texte={annonce.texte} sousTexte={annonce.sousTexte} reglages={reglages[annonce.type]} />}</AnimatePresence>

      {fin && !annonce && <FinDePartie onMaj={onMaj} ouvert={scoresOuverts} onBasculer={() => setScoresOuverts((o) => !o)} />}

      <PanneauDebug />
    </div>
  )
}
