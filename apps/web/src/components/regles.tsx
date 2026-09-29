"use client"

import { BookOpenIcon, PlayIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ContenuRegles } from "@/lib/regles"
import { NOM } from "@/lib/site"
import { cn } from "@/lib/utils"

export function TexteRiche({ texte }: { texte: string }) {
  return (
    <>
      {texte
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={cn(i > 0 && "mt-[0.7em]")}>
            {p.split(/(\*\*[^*]+\*\*)/).map((m, j) =>
              m.startsWith("**") && m.endsWith("**") ? (
                <strong key={j}>{m.slice(2, -2)}</strong>
              ) : (
                m.split("\n").flatMap((l, k) => (k ? [<br key={`${j}-${k}`} />, l] : [l]))
              ),
            )}
          </p>
        ))}
    </>
  )
}

export function ReglesButton({ regles, className }: { regles: ContenuRegles; className?: string }) {
  const onglets = [...regles.sections.map((s) => s.titre), ...(regles.videoId ? ["Vidéo"] : [])]
  const [actif, setActif] = useState(0)
  const section = regles.sections[actif]
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Règles du jeu"
          title="Règles du jeu"
          className={cn("flex size-11 cursor-pointer items-center justify-center rounded-full text-foreground transition-transform hover:scale-110", className)}
        >
          <BookOpenIcon className="size-6 drop-shadow" strokeWidth={1.6} />
        </button>
      </DialogTrigger>
      <DialogContent className="flex h-[80vh] w-[min(95vw,64rem)] max-w-none gap-0 overflow-hidden rounded-2xl border-0 bg-secondary p-0 text-secondary-foreground sm:max-w-none">
        <nav className="flex w-64 shrink-0 flex-col gap-1 bg-surface p-5 text-foreground">
          <DialogTitle className="px-3 pb-1 font-display text-2xl">Règles</DialogTitle>
          <DialogDescription className="px-3 pb-5 text-sm text-foreground/60">{NOM}</DialogDescription>
          {onglets.map((titre, i) => (
            <button
              key={titre}
              type="button"
              onClick={() => setActif(i)}
              className={cn(
                "relative flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left font-display whitespace-nowrap transition-colors",
                actif === i ? "text-secondary-foreground" : "text-foreground/70 hover:text-foreground",
              )}
            >
              {actif === i && <motion.span layoutId="onglet-regles" className="absolute inset-0 rounded-lg bg-secondary" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
              {i >= regles.sections.length && <PlayIcon className="relative size-4" />}
              <span className="relative">{titre}</span>
            </button>
          ))}
        </nav>
        <ScrollArea className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={actif} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="p-10">
              {section ? (
                <>
                  <h3 className="font-display text-3xl font-bold">{section.titre}</h3>
                  {actif === 0 && <p className="mt-2 text-secondary-foreground/60">{regles.intro}</p>}
                  <div className="mt-6 max-w-3xl text-lg leading-[1.45]">
                    <TexteRiche texte={section.texte} />
                  </div>
                  {section.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={section.image} alt="" className="mt-8 max-h-96 rounded-xl object-contain" />
                  )}
                </>
              ) : (
                <div className="overflow-hidden rounded-xl bg-black">
                  <iframe
                    className="aspect-video w-full"
                    src={`https://www.youtube-nocookie.com/embed/${regles.videoId}?rel=0`}
                    title="Règles en vidéo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
