import { type CommandeDebug, JEU } from "@jeu/engine"
import type { NextRequest } from "next/server"
import { ApiError, handle, lireJson } from "@/server/api"
import { getJoueurId } from "@/server/joueur"
import { modifierPartie, nouvellePartie, partiePublique } from "@/server/parties"

export const POST = handle(async (request: NextRequest, ctx: RouteContext<"/api/parties/[code]/debug">) => {
  if (process.env.NODE_ENV === "production" && process.env.DEBUG_PARTIES !== "1") throw new ApiError("DEBUG_DESACTIVE", 403)
  const { code } = await ctx.params
  const id = await getJoueurId()
  const { commande } = await lireJson<{ commande: "debut" | CommandeDebug }>(request)

  const row = await modifierPartie(code, (partie) => {
    if (!id || !partie.joueurs.some((j) => j.id === id)) throw new ApiError("JOUEUR_INCONNU", 403)
    if (commande === "debut") return nouvellePartie(partie)
    const etape = JEU.debug?.[commande]
    if (!etape) throw new ApiError("ACTION_INVALIDE")
    if (!partie.etat) throw new ApiError("PARTIE_NON_LANCEE", 409)
    const etat = etape(partie.etat)
    return { etat, statut: JEU.termine(etat) ? "fin" : "jeu" }
  })
  return partiePublique(row, id)
})
