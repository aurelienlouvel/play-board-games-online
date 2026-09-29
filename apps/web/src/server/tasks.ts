import "server-only"
import { createHash } from "node:crypto"
import { cookies } from "next/headers"
import { ApiError } from "./api"

export type Task = { id: string; text: string; category: string; done: boolean; sort_order: number; created_at: string }

const COOKIE = "todo_access"

function token(password: string) {
  return createHash("sha256").update(`todo:${password}`).digest("hex")
}

export function passwordRequired() {
  return !!process.env.TODO_PASSWORD
}

export async function hasAccess() {
  const password = process.env.TODO_PASSWORD
  if (!password) return process.env.NODE_ENV !== "production"
  return (await cookies()).get(COOKIE)?.value === token(password)
}

export async function requireAccess() {
  if (!(await hasAccess())) throw new ApiError("ACCESS_DENIED", 401)
}

export async function login(password: string) {
  const expected = process.env.TODO_PASSWORD
  if (!expected || password !== expected) throw new ApiError("INVALID_PASSWORD", 401)
  ;(await cookies()).set(COOKIE, token(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  })
}

export function sanitizeText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}
