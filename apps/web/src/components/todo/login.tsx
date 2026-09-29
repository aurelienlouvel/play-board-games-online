"use client"

import { LockKeyholeIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export function TodoLogin() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [sending, setSending] = useState(false)

  async function validate(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    const res = await fetch("/api/tasks/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) })
    setSending(false)
    if (!res.ok) {
      toast.error("Mot de passe incorrect")
      return
    }
    router.refresh()
  }

  return (
    <form onSubmit={validate} className="mt-[12vh] flex h-fit w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-foreground/10 bg-surface/80 p-8 text-center shadow-2xl">
      <LockKeyholeIcon className="size-8 text-accent-game" strokeWidth={1.5} />
      <h1 className="font-display text-2xl font-bold">To-do du projet</h1>
      <input
        type="password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe"
        className="h-11 w-full rounded-lg border border-foreground/20 bg-surface-dark px-4 text-center outline-none focus:border-accent-game"
      />
      <button type="submit" disabled={sending || !password} className="h-11 w-full cursor-pointer rounded-lg bg-accent-game font-semibold text-background disabled:opacity-50">
        Entrer
      </button>
    </form>
  )
}
