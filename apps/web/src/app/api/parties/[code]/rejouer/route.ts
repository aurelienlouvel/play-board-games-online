import type { NextRequest } from "next/server"
import { ApiError, handle } from "@/server/api"
import { getJoueurId } from "@/server/joueur"
import { modifierPartie, nouvellePartie, partiePublique } from "@/server/parties"

export const POST = handle(async (_request: NextRequest, ctx: RouteContext<"/api/parties/[code]/rejouer">) => {
  const { code } = await ctx.params
  const id = await getJoueurId()
  const row = await modifierPartie(code, (partie) => {
    if (partie.statut !== "fin") throw new ApiError("PARTIE_NON_TERMINEE", 409)
    if (!id || !partie.joueurs.some((j) => j.id === id)) throw new ApiError("JOUEUR_INCONNU", 403)
    if (partie.rejouer.includes(id)) return null
    const rejouer = [...partie.rejouer, id]
    if (rejouer.length < partie.joueurs.length) return { rejouer }
    return nouvellePartie(partie)
  })
  return partiePublique(row, id)
})
