import { handle, readJson } from "@/server/api"
import { login } from "@/server/tasks"

export const POST = handle(async (request: Request) => {
  const { password } = await readJson<{ password?: unknown }>(request)
  await login(typeof password === "string" ? password : "")
  return { ok: true }
})
