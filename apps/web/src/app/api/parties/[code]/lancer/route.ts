import type { NextRequest } from "next/server"
import { MIN_JOUEURS } from "@/lib/partie-types"
import { ApiError, handle } from "@/server/api"
import { getJoueurId } from "@/server/joueur"
import { modifierPartie, nouvellePartie, partiePublique } from "@/server/parties"

export const POST = handle(async (_request: NextRequest, ctx: RouteContext<"/api/parties/[code]/lancer">) => {
  const { code } = await ctx.params
  const id = await getJoueurId()
  const row = await modifierPartie(code, (partie) => {
    if (partie.hote_id !== id) throw new ApiError("RESERVE_A_L_HOTE", 403)
    if (partie.statut !== "lobby") throw new ApiError("PARTIE_EN_COURS", 409)
    if (partie.joueurs.length < MIN_JOUEURS) throw new ApiError("PAS_ASSEZ_DE_JOUEURS")
    return nouvellePartie(partie)
  })
  return partiePublique(row, id)
})
