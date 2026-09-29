import type { Metadata } from "next"
import { ConnexionTodo } from "@/components/todo/connexion"
import { ListeTaches } from "@/components/todo/liste-taches"
import { accesAutorise } from "@/server/taches"

export const metadata: Metadata = { title: "To-do", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

export default async function PageTodo() {
  return <main className="fond flex min-h-dvh justify-center px-4 py-10 sm:py-16">{(await accesAutorise()) ? <ListeTaches /> : <ConnexionTodo />}</main>
}
