import { JEU, normaliserOptions } from "@jeu/engine"
import type { NextRequest } from "next/server"
import { ApiError, handle, lireJson } from "@/server/api"
import { getJoueurId } from "@/server/joueur"
import { modifierPartie, partiePublique } from "@/server/parties"

export const POST = handle(async (request: NextRequest, ctx: RouteContext<"/api/parties/[code]/options">) => {
  const { code } = await ctx.params
  const id = await getJoueurId()
  const { options } = await lireJson<{ options?: unknown }>(request)
  const row = await modifierPartie(code, (partie) => {
    if (partie.hote_id !== id) throw new ApiError("RESERVE_A_L_HOTE", 403)
    if (partie.statut === "jeu") throw new ApiError("PARTIE_EN_COURS", 409)
    return { options: normaliserOptions(JEU.options, { ...partie.options, ...(options as object) }) }
  })
  return partiePublique(row, id)
})
