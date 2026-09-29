import { ApiError, handle, lireJson } from "@/server/api"
import { supabaseAdmin } from "@/server/supabase"
import { exigerAcces, nettoyerTexte, type Tache } from "@/server/taches"

export const GET = handle(async () => {
  await exigerAcces()
  const { data, error } = await supabaseAdmin().from("taches").select("*").order("categorie").order("ordre")
  if (error) throw error
  return data as Tache[]
})

export const POST = handle(async (request: Request) => {
  await exigerAcces()
  const corps = await lireJson<{ texte?: unknown; categorie?: unknown }>(request)
  const texte = nettoyerTexte(corps.texte, 300)
  if (!texte) throw new ApiError("TEXTE_VIDE")
  const categorie = nettoyerTexte(corps.categorie, 60) || "Général"
  const { data, error } = await supabaseAdmin().from("taches").insert({ texte, categorie, ordre: Date.now() / 1000 }).select("*").single()
  if (error) throw error
  return data as Tache
})
