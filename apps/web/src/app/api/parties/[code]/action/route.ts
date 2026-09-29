import { type Action, JEU } from "@jeu/engine"
import type { NextRequest } from "next/server"
import { ApiError, handle, lireJson } from "@/server/api"
import { getJoueurId } from "@/server/joueur"
import { modifierPartie, partiePublique } from "@/server/parties"

export const POST = handle(async (request: NextRequest, ctx: RouteContext<"/api/parties/[code]/action">) => {
  const { code } = await ctx.params
  const id = await getJoueurId()
  if (!id) throw new ApiError("JOUEUR_INCONNU", 401)
  const action = await lireJson<{ type?: string }>(request)
  if (!action.type || !(JEU.actionsClient as readonly string[]).includes(action.type)) throw new ApiError("ACTION_INVALIDE")

  const row = await modifierPartie(code, (partie) => {
    if (!partie.etat || partie.statut !== "jeu") throw new ApiError("PARTIE_NON_LANCEE", 409)
    const etat = JEU.appliquer(partie.etat, { ...action, joueurId: id } as Action)
    return { etat, statut: JEU.termine(etat) ? "fin" : "jeu" }
  })
  return partiePublique(row, id)
})
