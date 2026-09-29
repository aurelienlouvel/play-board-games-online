import type { Metadata } from "next"
import { GameClient } from "@/components/game/game-client"
import { loadRules } from "@/lib/rules-server"

export async function generateMetadata({ params }: PageProps<"/game/[code]">): Promise<Metadata> {
  const { code } = await params
  return { title: `[${code.toUpperCase()}]`, robots: { index: false, follow: true } }
}

export default async function GamePage({ params }: PageProps<"/game/[code]">) {
  const { code } = await params
  return <GameClient code={code.toUpperCase()} rules={await loadRules()} />
}
