import type { NextRequest } from "next/server"
import { ApiError, handle, lireJson } from "@/server/api"
import { supabaseAdmin } from "@/server/supabase"
import { exigerAcces, nettoyerTexte, type Tache } from "@/server/taches"

export const PATCH = handle(async (request: NextRequest, ctx: RouteContext<"/api/taches/[id]">) => {
  await exigerAcces()
  const { id } = await ctx.params
  const corps = await lireJson<{ texte?: unknown; categorie?: unknown; fait?: unknown; ordre?: unknown }>(request)
  const patch: Partial<Tache> & { updated_at: string } = { updated_at: new Date().toISOString() }
  if (typeof corps.fait === "boolean") patch.fait = corps.fait
  if (typeof corps.ordre === "number" && Number.isFinite(corps.ordre)) patch.ordre = corps.ordre
  if (corps.texte !== undefined) {
    const texte = nettoyerTexte(corps.texte, 300)
    if (!texte) throw new ApiError("TEXTE_VIDE")
    patch.texte = texte
  }
  if (corps.categorie !== undefined) patch.categorie = nettoyerTexte(corps.categorie, 60) || "Général"
  const { data, error } = await supabaseAdmin().from("taches").update(patch).eq("id", id).select("*").maybeSingle()
  if (error) throw error
  if (!data) throw new ApiError("TACHE_INTROUVABLE", 404)
  return data as Tache
})

export const DELETE = handle(async (_request: NextRequest, ctx: RouteContext<"/api/taches/[id]">) => {
  await exigerAcces()
  const { id } = await ctx.params
  const { error } = await supabaseAdmin().from("taches").delete().eq("id", id)
  if (error) throw error
  return { ok: true }
})
