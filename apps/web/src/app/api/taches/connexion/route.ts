import { handle, lireJson } from "@/server/api"
import { connecter } from "@/server/taches"

export const POST = handle(async (request: Request) => {
  const { motDePasse } = await lireJson<{ motDePasse?: unknown }>(request)
  await connecter(typeof motDePasse === "string" ? motDePasse : "")
  return { ok: true }
})
