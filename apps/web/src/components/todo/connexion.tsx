"use client"

import { LockKeyholeIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export function ConnexionTodo() {
  const router = useRouter()
  const [motDePasse, setMotDePasse] = useState("")
  const [envoi, setEnvoi] = useState(false)

  async function valider(e: React.FormEvent) {
    e.preventDefault()
    setEnvoi(true)
    const reponse = await fetch("/api/taches/connexion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ motDePasse }) })
    setEnvoi(false)
    if (!reponse.ok) {
      toast.error("Mot de passe incorrect")
      return
    }
    router.refresh()
  }

  return (
    <form onSubmit={valider} className="mt-[12vh] flex h-fit w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-foreground/10 bg-surface/80 p-8 text-center shadow-2xl">
      <LockKeyholeIcon className="size-8 text-jeu" strokeWidth={1.5} />
      <h1 className="font-display text-2xl font-bold">To-do du projet</h1>
      <input
        type="password"
        autoFocus
        value={motDePasse}
        onChange={(e) => setMotDePasse(e.target.value)}
        placeholder="Mot de passe"
        className="h-11 w-full rounded-lg border border-foreground/20 bg-surface-fonce px-4 text-center outline-none focus:border-jeu"
      />
      <button type="submit" disabled={envoi || !motDePasse} className="h-11 w-full cursor-pointer rounded-lg bg-jeu font-semibold text-background disabled:opacity-50">
        Entrer
      </button>
    </form>
  )
}
