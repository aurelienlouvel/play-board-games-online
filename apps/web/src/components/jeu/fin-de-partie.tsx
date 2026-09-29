"use client"

import type { ResultatJoueur, VueJoueur } from "@jeu/engine"
import { CrownIcon } from "lucide-react"
import { LinkForwardIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { ApercuPartage } from "./apercu-partage"
import { genererPartage, type LignePartage } from "./partage"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { BoutonPrincipal } from "@/components/accueil/ecran"
import { api } from "@/lib/api"
import type { PartiePublique } from "@/lib/partie-types"
import { cn } from "@/lib/utils"
import { useJeu } from "./contexte"

function hash(texte: string) {
  let h = 0
  for (const c of texte) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

const PHRASES_VICTOIRE = ["Victoire de", "Bravo à", "La partie est remportée par", "Champion·ne du jour"]

export function annonceVainqueur(partie: PartiePublique, vue: VueJoueur) {
  const resultats = vue.resultats
  if (!resultats) return { phrase: "", detail: "" }
  const vainqueurs = resultats.joueurs.filter((j) => resultats.vainqueurs.includes(j.joueurId))
  const phrase = PHRASES_VICTOIRE[hash(partie.code + vue.journal.length) % PHRASES_VICTOIRE.length]!
  const noms = vainqueurs.map((v) => partie.joueurs.find((j) => j.id === v.joueurId)?.pseudo).join(" & ")
  return { phrase, detail: `${noms} · ${vainqueurs[0]?.total ?? 0} pts` }
}

function Details({ j, grand, centre }: { j: ResultatJoueur; grand?: boolean; centre?: boolean }) {
  const signe = (n: number) => `${n > 0 ? "+" : ""}${n}`
  return (
    <div className={cn("flex flex-wrap items-center", centre ? "justify-center" : "justify-start", grand ? "gap-2" : "gap-1.5")}>
      {j.detail.map((d) => (
        <span
          key={d.cle}
          title={`${d.label} : ${signe(d.points)}`}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-md border border-white/15 bg-white/10 font-display font-bold text-white/90 tabular-nums",
            grand ? "h-8 px-3 text-sm" : "h-7 px-2.5 text-xs",
          )}
          style={{ opacity: d.points === 0 ? 0.45 : 1 }}
        >
          <span className="font-sans font-medium text-white/60">{d.label}</span>
          {signe(d.points)}
        </span>
      ))}
    </div>
  )
}

export function FinDePartie({ onMaj, ouvert, onBasculer }: { onMaj: (p: PartiePublique) => void; ouvert: boolean; onBasculer: () => void }) {
  const { vue, partie, couleur } = useJeu()
  const [envoi, setEnvoi] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [apercu, setApercu] = useState(false)
  const resultats = vue.phase === "fin" ? vue.resultats : null
  const info = (id: string) => partie.joueurs.find((j) => j.id === id)

  const cleResultats = resultats ? `${partie.code}|${resultats.vainqueurs.join()}|${resultats.joueurs.map((j) => `${j.joueurId}:${j.total}`).join()}` : null
  useEffect(() => {
    if (!resultats) return
    let annule = false
    const lignes: LignePartage[] = [...resultats.joueurs]
      .sort((a, b) => a.rang - b.rang)
      .map((j) => ({
        rang: j.rang,
        pseudo: partie.joueurs.find((x) => x.id === j.joueurId)?.pseudo ?? "?",
        couleur: couleur(j.joueurId),
        total: j.total,
        vainqueur: resultats.vainqueurs.includes(j.joueurId),
      }))
    const t = setTimeout(() => {
      genererPartage(lignes, partie.code)
        .then((f) => !annule && setImage(f))
        .catch(() => !annule && toast.error("Impossible de générer l'image du résultat"))
    }, 1200)
    return () => {
      annule = true
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleResultats])

  const url = useMemo(() => (image ? URL.createObjectURL(image) : null), [image])
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url])

  if (!resultats) return null
  const vainqueurs = resultats.joueurs.filter((j) => resultats.vainqueurs.includes(j.joueurId))
  const classement = [...resultats.joueurs].sort((a, b) => a.rang - b.rang)
  const dejaVote = !!partie.moiId && partie.rejouer.includes(partie.moiId)

  async function rejouer() {
    setEnvoi(true)
    try {
      onMaj(await api.rejouer(partie.code))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setEnvoi(false)
    }
  }

  const textePartage = `${vainqueurs.map((v) => info(v.joueurId)?.pseudo).join(" & ")} remporte la partie avec ${vainqueurs[0]?.total ?? 0} points !`
  const noms = vainqueurs.map((v) => info(v.joueurId)?.pseudo).join(" & ")

  return (
    <>
      <ApercuPartage fichier={apercu ? image : null} texte={textePartage} onFermer={() => setApercu(false)} />
      <AnimatePresence>
        {ouvert && (
          <motion.div
            key="fond"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-[2px]"
            onClick={onBasculer}
          />
        )}
      </AnimatePresence>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 bottom-[10rem] z-40 flex flex-col items-center justify-end px-6 pt-6"
      >
        <AnimatePresence mode="popLayout">
          {ouvert && (
            <motion.section
              key="tableau"
              role="dialog"
              aria-label="Tableau des scores"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 200, damping: 24 }}
              className="pointer-events-auto relative flex max-h-full w-full max-w-lg flex-col"
            >

              <div className="relative flex min-h-[26rem] flex-1 flex-col overflow-hidden rounded-lg border border-jeu/70 bg-surface shadow-[0_24px_70px_rgb(0_0_0/65%)]">
                            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgb(255_255_255/8%),transparent_70%)]" />
              <div className="relative shrink-0 px-8 pt-6 pb-5">
                <button
                  type="button"
                  onClick={() => setApercu(true)}
                  disabled={!image}
                  title="Partager le résultat"
                  aria-label="Partager le résultat"
                  className="group absolute -top-3 -right-10 z-20 w-40 rotate-[5deg] cursor-pointer rounded-[3px] bg-[#f3ecd6] p-[2px] shadow-[0_10px_24px_rgb(0_0_0/55%)] transition-transform duration-200 hover:rotate-[1deg] disabled:cursor-wait"
                >
                  <span className="relative block aspect-[4/3] overflow-hidden rounded-[2px] bg-surface-fonce">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="" className="size-full scale-[1.35] object-cover" style={{ transformOrigin: "50% 58%" }} />
                    ) : (
                      <span className="block size-full animate-pulse bg-surface" />
                    )}
                  </span>
                  <span className="absolute top-1/2 left-[30%] flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#f3ecd6]/50 bg-surface-fonce text-foreground shadow-md transition-transform group-hover:scale-110">
                    <HugeiconsIcon icon={LinkForwardIcon} strokeWidth={1.8} className="size-4" />
                  </span>
                </button>
                <div className="relative flex flex-col items-center gap-1.5 px-20 text-center">
                  <p className="-mx-16 font-display text-sm tracking-[0.18em] whitespace-nowrap text-foreground/55 uppercase">Victoire de</p>
                  <CrownIcon aria-hidden className="relative z-10 -mt-1 size-9 fill-jeu text-jeu drop-shadow-[0_0_12px_var(--accent-jeu)]" />
                  <p className="font-sans text-4xl font-black tracking-[0.16em] uppercase brightness-150" style={{ color: couleur(vainqueurs[0]!.joueurId) }}>
                    {noms}
                  </p>
                  <p className="font-display text-2xl text-jeu tabular-nums">
                    {vainqueurs[0]!.total > 0 ? "+" : ""}
                    {vainqueurs[0]!.total} pts
                  </p>
                  <div className="mt-2 space-y-2">
                    {vainqueurs.map((v) => (
                      <Details key={v.joueurId} j={v} grand centre />
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative min-h-0 flex-1 overflow-y-auto px-8 pb-20 [scrollbar-width:thin]">
                <ol className="divide-y divide-foreground/15 border-t border-foreground/15">
                  {classement
                    .filter((j) => !resultats.vainqueurs.includes(j.joueurId))
                    .map((j) => (
                      <li key={j.joueurId} className="space-y-2 py-3.5">
                        <div className="flex items-baseline gap-2">
                          <span className="font-display text-lg text-foreground/45 tabular-nums">{j.rang}.</span>
                          <span className="min-w-0 flex-1 truncate font-sans text-lg font-black tracking-[0.14em] uppercase brightness-150" style={{ color: couleur(j.joueurId) }}>
                            {info(j.joueurId)?.pseudo}
                          </span>
                          <span className="font-display text-3xl leading-none text-foreground/90 tabular-nums">
                            {j.total > 0 ? "+" : ""}
                            {j.total} pts
                          </span>
                        </div>
                        <Details j={j} />
                      </li>
                    ))}
                </ol>
              </div>

              </div>
              <div className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2 translate-y-1/2">
                <BoutonPrincipal onClick={rejouer} occupe={envoi} disabled={dejaVote} className="w-auto max-w-none px-8 whitespace-nowrap">
                  Rejouer ({partie.rejouer.length}/{partie.joueurs.length})
                </BoutonPrincipal>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={onBasculer}
          className="pointer-events-auto fixed bottom-8 left-1/2 z-50 h-9 -translate-x-1/2 cursor-pointer px-4 font-display text-sm tracking-wide whitespace-nowrap text-foreground/75 uppercase underline-offset-4 transition-colors duration-200 [text-shadow:0_1px_6px_rgb(0_0_0/80%)] hover:text-foreground hover:underline"
        >
          {ouvert ? "Masquer le tableau des scores" : "Afficher le tableau des scores"}
        </button>
    </>
  )
}
