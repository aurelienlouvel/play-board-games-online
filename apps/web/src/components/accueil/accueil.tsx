"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { ReglesButton } from "@/components/regles"
import { api, lienPartie } from "@/lib/api"
import { useProfil } from "@/lib/profil"
import { ACCROCHE } from "@/lib/site"
import type { ContenuRegles } from "@/lib/regles"
import { BoutonPrincipal, ChampCode, ChampPseudo, Ecran, Texte } from "./ecran"

export function Accueil({ regles }: { regles: ContenuRegles }) {
  const router = useRouter()
  const { profil, setProfil, valide } = useProfil()
  const [code, setCode] = useState("")
  const [enCours, setEnCours] = useState(false)

  function verifierProfil() {
    if (valide) return true
    toast.error("Choisissez d'abord votre pseudo.")
    document.getElementById("pseudo")?.focus()
    return false
  }

  async function valider(event: React.FormEvent) {
    event.preventDefault()
    if (!verifierProfil()) return
    if (code.length > 0 && code.length !== 6) {
      toast.error("Le code de partie fait 6 caractères.")
      return
    }
    setEnCours(true)
    if (code.length === 6) {
      router.push(`/partie/${code}`)
      return
    }
    try {
      const partie = await api.creer(profil)
      try {
        await navigator.clipboard.writeText(lienPartie(partie.code))
        toast.success("Lien de la partie copié !", { description: "Envoyez-le à vos amis pour qu'ils vous rejoignent." })
      } catch {
        toast.success(`Partie ${partie.code} créée !`)
      }
      router.push(`/partie/${partie.code}`)
    } catch (error) {
      toast.error((error as Error).message)
      setEnCours(false)
    }
  }

  return (
    <Ecran
      onSubmit={valider}
      haut={<ReglesButton regles={regles} />}
      bouton={<BoutonPrincipal occupe={enCours}>{code.length === 6 ? "Rejoindre la partie" : "Créer une partie"}</BoutonPrincipal>}
      bas={<ChampCode value={code} onChange={setCode} />}
    >
      <Texte>{ACCROCHE}</Texte>
      <ChampPseudo value={profil.pseudo} onChange={(pseudo) => setProfil({ pseudo })} />
    </Ecran>
  )
}
