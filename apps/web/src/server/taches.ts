import "server-only"
import { createHash } from "node:crypto"
import { cookies } from "next/headers"
import { ApiError } from "./api"

export type Tache = { id: string; texte: string; categorie: string; fait: boolean; ordre: number; created_at: string }

const COOKIE = "todo_acces"

function jeton(motDePasse: string) {
  return createHash("sha256").update(`todo:${motDePasse}`).digest("hex")
}

export function motDePasseRequis() {
  return !!process.env.TODO_PASSWORD
}

export async function accesAutorise() {
  const motDePasse = process.env.TODO_PASSWORD
  if (!motDePasse) return process.env.NODE_ENV !== "production"
  return (await cookies()).get(COOKIE)?.value === jeton(motDePasse)
}

export async function exigerAcces() {
  if (!(await accesAutorise())) throw new ApiError("ACCES_REFUSE", 401)
}

export async function connecter(motDePasse: string) {
  const attendu = process.env.TODO_PASSWORD
  if (!attendu || motDePasse !== attendu) throw new ApiError("MOT_DE_PASSE_INVALIDE", 401)
  ;(await cookies()).set(COOKIE, jeton(attendu), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  })
}

export function nettoyerTexte(valeur: unknown, max: number) {
  return typeof valeur === "string" ? valeur.trim().slice(0, max) : ""
}
