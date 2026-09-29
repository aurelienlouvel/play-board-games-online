"use client"

import { Loader2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { BoutonPrincipal, ChampCode, ChampPseudo, Ecran, Texte } from "@/components/accueil/ecran"
import { Jeu } from "@/components/jeu/jeu"
import { ReglesButton } from "@/components/regles"
import { api, lienPartie } from "@/lib/api"
import { useProfil } from "@/lib/profil"
import type { ContenuRegles } from "@/lib/regles"
import { usePartie } from "@/lib/use-partie"
import { BoutonLobby, ListeJoueurs } from "./lobby"
import { OptionsPartie } from "./options-partie"

export function PartieClient({ code, regles }: { code: string; regles: ContenuRegles }) {
  const router = useRouter()
  const { partie, erreur, appliquer } = usePartie(code)
  const { profil, setProfil, pret, valide } = useProfil()
  const [autoJoin, setAutoJoin] = useState<"idle" | "encours" | "echec" | "manuel">("idle")
  const invite = !!partie && pret && partie.moiId === null && partie.statut === "lobby"
  if (invite && !valide && autoJoin === "idle") setAutoJoin("manuel")
  const doitAutoJoin = invite && valide && (autoJoin === "idle" || autoJoin === "encours")

  async function rejoindre() {
    try {
      appliquer(await api.rejoindre(code, profil))
      return true
    } catch (e) {
      toast.error((e as Error).message)
      return false
    }
  }

  useEffect(() => {
    if (!doitAutoJoin || autoJoin !== "idle") return
    void Promise.resolve()
      .then(() => setAutoJoin("encours"))
      .then(rejoindre)
      .then((ok) => !ok && setAutoJoin("echec"))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doitAutoJoin, autoJoin])

  async function quitter() {
    if (partie?.statut === "lobby" && partie.moiId) await api.quitter(code).catch(() => null)
    router.push("/")
  }

  if (partie && partie.moiId && partie.statut !== "lobby" && partie.vue) {
    return <Jeu partie={partie} regles={regles} onMaj={appliquer} onQuitter={() => router.push("/")} />
  }

  const lien = typeof window === "undefined" ? "" : lienPartie(code)
  const retour = <BoutonPrincipal onClick={quitter}>Retour à l&apos;accueil</BoutonPrincipal>
  const haut = <ReglesButton regles={regles} />

  if (erreur)
    return (
      <Ecran haut={haut} bouton={retour}>
        <Texte>Cette partie est introuvable. Vérifiez le code {code} ou créez-en une nouvelle.</Texte>
      </Ecran>
    )

  if (!partie || !pret || doitAutoJoin || (partie.statut !== "lobby" && partie.moiId))
    return (
      <Ecran haut={haut} bas={<ChampCode value={code} />}>
        <Loader2Icon className="mt-[8vh] size-8 animate-spin text-jeu" />
      </Ecran>
    )

  if (partie.moiId === null && partie.statut !== "lobby")
    return (
      <Ecran haut={haut} bouton={retour}>
        <Texte>Cette partie a déjà commencé.</Texte>
      </Ecran>
    )

  if (partie.moiId === null)
    return (
      <Ecran
        haut={haut}
        onSubmit={async (e) => {
          e.preventDefault()
          if (!valide) {
            toast.error("Choisissez d'abord votre pseudo.")
            return
          }
          setAutoJoin("encours")
          if (!(await rejoindre())) setAutoJoin("echec")
        }}
        bouton={<BoutonPrincipal occupe={autoJoin === "encours"}>Rejoindre la partie</BoutonPrincipal>}
        bas={<ChampCode value={code} copiable={lien} />}
      >
        <ListeJoueurs partie={partie} />
        <ChampPseudo value={profil.pseudo} onChange={(pseudo) => setProfil({ pseudo })} />
      </Ecran>
    )

  return (
    <Ecran haut={haut} bouton={<BoutonLobby partie={partie} onMaj={appliquer} />} bas={<ChampCode value={code} copiable={lien} />}>
      <Texte>Partagez le code ou le lien de la partie à vos amis.</Texte>
      <ListeJoueurs partie={partie} />
      <OptionsPartie partie={partie} onMaj={appliquer} />
    </Ecran>
  )
}
