"use client"

import { CheckIcon, Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Task = { id: string; text: string; category: string; done: boolean; sort_order: number }

async function apiRequest<T>(route: string, init?: RequestInit): Promise<T> {
  const res = await fetch(route, { ...init, headers: { "Content-Type": "application/json" }, cache: "no-store" })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "ERROR")
  return data as T
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [text, setText] = useState("")
  const [category, setCategory] = useState("")
  const [showDone, setShowDone] = useState(true)

  const load = useCallback(async () => {
    try {
      setTasks(await apiRequest<Task[]>("/api/tasks"))
    } catch {
      toast.error("Impossible de charger la to-do (table « tasks » créée ?)")
      setTasks([])
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(load)
    window.addEventListener("focus", load)
    return () => window.removeEventListener("focus", load)
  }, [load])

  const categories = useMemo(() => [...new Set((tasks ?? []).map((t) => t.category))], [tasks])
  const groups = useMemo(
    () =>
      categories.map((c) => ({
        category: c,
        tasks: (tasks ?? []).filter((t) => t.category === c && (showDone || !t.done)).sort((a, b) => Number(a.done) - Number(b.done) || a.sort_order - b.sort_order),
        total: (tasks ?? []).filter((t) => t.category === c).length,
        doneTasks: (tasks ?? []).filter((t) => t.category === c && t.done).length,
      })),
    [categories, tasks, showDone],
  )
  const total = tasks?.length ?? 0
  const doneTasks = tasks?.filter((t) => t.done).length ?? 0

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    try {
      const task = await apiRequest<Task>("/api/tasks", { method: "POST", body: JSON.stringify({ text, category: category || categories[0] }) })
      setTasks((l) => [...(l ?? []), task])
      setText("")
    } catch {
      toast.error("Ajout impossible")
    }
  }

  async function updateTask(id: string, patch: Partial<Task>) {
    const before = tasks
    setTasks((l) => l?.map((t) => (t.id === id ? { ...t, ...patch } : t)) ?? null)
    try {
      await apiRequest(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch) })
    } catch {
      setTasks(before)
      toast.error("Modification impossible")
    }
  }

  async function remove(id: string) {
    const before = tasks
    setTasks((l) => l?.filter((t) => t.id !== id) ?? null)
    try {
      await apiRequest(`/api/tasks/${id}`, { method: "DELETE" })
    } catch {
      setTasks(before)
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
            <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="accent-(--accent-game)" />
            Afficher les terminées
          </label>
          <span className="rounded-full bg-foreground/10 px-3 py-1 text-sm tabular-nums">
            {doneTasks}/{total}
          </span>
        </div>
      </header>

      <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-foreground/10">
        <motion.div className="h-full bg-accent-game" animate={{ width: total ? `${(doneTasks / total) * 100}%` : "0%" }} />
      </div>

      <form onSubmit={add} className="mb-10 flex flex-wrap gap-2 rounded-xl border border-foreground/10 bg-surface/70 p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nouvelle tâche…"
          className="h-11 min-w-0 flex-1 rounded-lg bg-transparent px-3 outline-none placeholder:text-foreground/40"
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          list="categories"
          placeholder={categories[0] ?? "Catégorie"}
          className="h-11 w-44 rounded-lg border border-foreground/10 bg-surface-dark px-3 text-sm outline-none focus:border-accent-game"
        />
        <datalist id="categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <button type="submit" disabled={!text.trim()} className="flex h-11 cursor-pointer items-center gap-1.5 rounded-lg bg-accent-game px-4 font-semibold text-background disabled:opacity-40">
          <PlusIcon className="size-4" /> Ajouter
        </button>
      </form>

      {tasks === null ? (
        <Loader2Icon className="mx-auto size-6 animate-spin text-foreground/50" />
      ) : (
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g.category}>
              <h2 className="mb-3 flex items-baseline gap-3 font-display text-sm font-semibold tracking-[0.14em] text-foreground/60 uppercase">
                {g.category}
                <span className="text-xs tracking-normal text-foreground/40 tabular-nums">
                  {g.doneTasks}/{g.total}
                </span>
              </h2>
              <ul className="divide-y divide-foreground/10 rounded-xl border border-foreground/10 bg-surface/50">
                <AnimatePresence initial={false}>
                  {g.tasks.map((t) => (
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
                        aria-label={t.done ? "Marquer à faire" : "Marquer faite"}
                        onClick={() => updateTask(t.id, { done: !t.done })}
                        className={cn(
                          "flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors",
                          t.done ? "border-accent-game bg-accent-game text-background" : "border-foreground/35 hover:border-accent-game",
                        )}
                      >
                        {t.done && <CheckIcon className="size-3.5" strokeWidth={3} />}
                      </button>
                      <EditableText value={t.text} done={t.done} onConfirm={(text) => updateTask(t.id, { text })} />
                      <button
                        type="button"
                        aria-label="Supprimer"
                        onClick={() => remove(t.id)}
                        className="cursor-pointer text-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
                      >
                        <Trash2Icon className="size-4" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
                {g.tasks.length === 0 && <li className="px-4 py-3 text-sm text-foreground/40">Tout est fait ici.</li>}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function EditableText({ value, done, onConfirm }: { value: string; done: boolean; onConfirm: (text: string) => void }) {
  const [editing, setEditing] = useState<string | null>(null)
  if (editing !== null)
    return (
      <input
        autoFocus
        value={editing}
        onChange={(e) => setEditing(e.target.value)}
        onBlur={() => {
          if (editing.trim() && editing !== value) onConfirm(editing.trim())
          setEditing(null)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
          if (e.key === "Escape") setEditing(null)
        }}
        className="min-w-0 flex-1 rounded bg-surface-dark px-2 py-0.5 outline-none"
      />
    )
  return (
    <span onDoubleClick={() => setEditing(value)} className={cn("min-w-0 flex-1 cursor-text", done && "text-foreground/40 line-through")} title="Double-clic pour modifier">
      {value}
    </span>
  )
}
