"use client"

import { CheckIcon, Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Tache = { id: string; texte: string; categorie: string; fait: boolean; ordre: number }

async function requete<T>(chemin: string, init?: RequestInit): Promise<T> {
  const reponse = await fetch(chemin, { ...init, headers: { "Content-Type": "application/json" }, cache: "no-store" })
  const data = await reponse.json().catch(() => ({}))
  if (!reponse.ok) throw new Error((data as { erreur?: string }).erreur ?? "ERREUR")
  return data as T
}

export function ListeTaches() {
  const [taches, setTaches] = useState<Tache[] | null>(null)
  const [texte, setTexte] = useState("")
  const [categorie, setCategorie] = useState("")
  const [afficherFaites, setAfficherFaites] = useState(true)

  const charger = useCallback(async () => {
    try {
      setTaches(await requete<Tache[]>("/api/taches"))
    } catch {
      toast.error("Impossible de charger la to-do (table « taches » créée ?)")
      setTaches([])
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(charger)
    window.addEventListener("focus", charger)
    return () => window.removeEventListener("focus", charger)
  }, [charger])

  const categories = useMemo(() => [...new Set((taches ?? []).map((t) => t.categorie))], [taches])
  const groupes = useMemo(
    () =>
      categories.map((c) => ({
        categorie: c,
        taches: (taches ?? []).filter((t) => t.categorie === c && (afficherFaites || !t.fait)).sort((a, b) => Number(a.fait) - Number(b.fait) || a.ordre - b.ordre),
        total: (taches ?? []).filter((t) => t.categorie === c).length,
        faites: (taches ?? []).filter((t) => t.categorie === c && t.fait).length,
      })),
    [categories, taches, afficherFaites],
  )
  const total = taches?.length ?? 0
  const faites = taches?.filter((t) => t.fait).length ?? 0

  async function ajouter(e: React.FormEvent) {
    e.preventDefault()
    if (!texte.trim()) return
    try {
      const tache = await requete<Tache>("/api/taches", { method: "POST", body: JSON.stringify({ texte, categorie: categorie || categories[0] }) })
      setTaches((l) => [...(l ?? []), tache])
      setTexte("")
    } catch {
      toast.error("Ajout impossible")
    }
  }

  async function modifier(id: string, patch: Partial<Tache>) {
    const avant = taches
    setTaches((l) => l?.map((t) => (t.id === id ? { ...t, ...patch } : t)) ?? null)
    try {
      await requete(`/api/taches/${id}`, { method: "PATCH", body: JSON.stringify(patch) })
    } catch {
      setTaches(avant)
      toast.error("Modification impossible")
    }
  }

  async function supprimer(id: string) {
    const avant = taches
    setTaches((l) => l?.filter((t) => t.id !== id) ?? null)
    try {
      await requete(`/api/taches/${id}`, { method: "DELETE" })
    } catch {
      setTaches(avant)
      toast.error("Suppression impossible")
    }
  }

  return (
    <div className="w-full max-w-3xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">To-do</h1>
          <p className="mt-1 text-foreground/60">Prochaines étapes du projet</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/70 select-none">
            <input type="checkbox" checked={afficherFaites} onChange={(e) => setAfficherFaites(e.target.checked)} className="accent-(--accent-jeu)" />
            Afficher les terminées
          </label>
          <span className="rounded-full bg-foreground/10 px-3 py-1 text-sm tabular-nums">
            {faites}/{total}
          </span>
        </div>
      </header>

      <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-foreground/10">
        <motion.div className="h-full bg-jeu" animate={{ width: total ? `${(faites / total) * 100}%` : "0%" }} />
      </div>

      <form onSubmit={ajouter} className="mb-10 flex flex-wrap gap-2 rounded-xl border border-foreground/10 bg-surface/70 p-2">
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Nouvelle tâche…"
          className="h-11 min-w-0 flex-1 rounded-lg bg-transparent px-3 outline-none placeholder:text-foreground/40"
        />
        <input
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          list="categories"
          placeholder={categories[0] ?? "Catégorie"}
          className="h-11 w-44 rounded-lg border border-foreground/10 bg-surface-fonce px-3 text-sm outline-none focus:border-jeu"
        />
        <datalist id="categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <button type="submit" disabled={!texte.trim()} className="flex h-11 cursor-pointer items-center gap-1.5 rounded-lg bg-jeu px-4 font-semibold text-background disabled:opacity-40">
          <PlusIcon className="size-4" /> Ajouter
        </button>
      </form>

      {taches === null ? (
        <Loader2Icon className="mx-auto size-6 animate-spin text-foreground/50" />
      ) : (
        <div className="space-y-10">
          {groupes.map((g) => (
            <section key={g.categorie}>
              <h2 className="mb-3 flex items-baseline gap-3 font-display text-sm font-semibold tracking-[0.14em] text-foreground/60 uppercase">
                {g.categorie}
                <span className="text-xs tracking-normal text-foreground/40 tabular-nums">
                  {g.faites}/{g.total}
                </span>
              </h2>
              <ul className="divide-y divide-foreground/10 rounded-xl border border-foreground/10 bg-surface/50">
                <AnimatePresence initial={false}>
                  {g.taches.map((t) => (
                    <motion.li
                      key={t.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="group flex items-center gap-3 px-4 py-3"
                    >
                      <button
                        type="button"
                        aria-label={t.fait ? "Marquer à faire" : "Marquer faite"}
                        onClick={() => modifier(t.id, { fait: !t.fait })}
                        className={cn(
                          "flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors",
                          t.fait ? "border-jeu bg-jeu text-background" : "border-foreground/35 hover:border-jeu",
                        )}
                      >
                        {t.fait && <CheckIcon className="size-3.5" strokeWidth={3} />}
                      </button>
                      <TexteEditable valeur={t.texte} fait={t.fait} onValider={(texte) => modifier(t.id, { texte })} />
                      <button
                        type="button"
                        aria-label="Supprimer"
                        onClick={() => supprimer(t.id)}
                        className="cursor-pointer text-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
                      >
                        <Trash2Icon className="size-4" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
                {g.taches.length === 0 && <li className="px-4 py-3 text-sm text-foreground/40">Tout est fait ici.</li>}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function TexteEditable({ valeur, fait, onValider }: { valeur: string; fait: boolean; onValider: (texte: string) => void }) {
  const [edition, setEdition] = useState<string | null>(null)
  if (edition !== null)
    return (
      <input
        autoFocus
        value={edition}
        onChange={(e) => setEdition(e.target.value)}
        onBlur={() => {
          if (edition.trim() && edition !== valeur) onValider(edition.trim())
          setEdition(null)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
          if (e.key === "Escape") setEdition(null)
        }}
        className="min-w-0 flex-1 rounded bg-surface-fonce px-2 py-0.5 outline-none"
      />
    )
  return (
    <span onDoubleClick={() => setEdition(valeur)} className={cn("min-w-0 flex-1 cursor-text", fait && "text-foreground/40 line-through")} title="Double-clic pour modifier">
      {valeur}
    </span>
  )
}
