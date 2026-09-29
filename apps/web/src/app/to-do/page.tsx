import type { Metadata } from "next"
import { TodoLogin } from "@/components/todo/login"
import { TaskList } from "@/components/todo/task-list"
import { hasAccess } from "@/server/tasks"

export const metadata: Metadata = { title: "To-do", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

export default async function TodoPage() {
  return <main className="game-bg flex min-h-dvh justify-center px-4 py-10 sm:py-16">{(await hasAccess()) ? <TaskList /> : <TodoLogin />}</main>
}
