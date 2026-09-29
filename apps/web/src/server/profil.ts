import "server-only"
import { ApiError } from "./api"

export type ProfilInput = { pseudo?: unknown }

export function validerProfil(input: ProfilInput): { pseudo: string } {
  const pseudo = typeof input.pseudo === "string" ? input.pseudo.trim().slice(0, 20) : ""
  if (pseudo.length < 1) throw new ApiError("PSEUDO_INVALIDE")
  return { pseudo }
}
