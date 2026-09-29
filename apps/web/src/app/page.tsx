import { Home } from "@/components/home/home"
import { loadRules } from "@/lib/rules-server"
import { AUTHOR, DESCRIPTION, GENRES, NAME, SITE_URL, TITLE } from "@/lib/site"
import { GAME } from "@game/engine"

export const revalidate = 60

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE_URL}/#site`, url: SITE_URL, name: TITLE, inLanguage: "fr-FR", description: DESCRIPTION },
    {
      "@type": "VideoGame",
      name: NAME,
      alternateName: TITLE,
      url: SITE_URL,
      description: DESCRIPTION,
      inLanguage: "fr-FR",
      genre: GENRES,
      gamePlatform: "Navigateur web",
      applicationCategory: "Game",
      playMode: "MultiPlayer",
      numberOfPlayers: { "@type": "QuantitativeValue", minValue: GAME.minPlayers, maxValue: GAME.maxPlayers },
      offers: { "@type": "Offer", price: 0, priceCurrency: "EUR" },
      author: { "@type": "Person", name: AUTHOR.name, url: AUTHOR.url },
    },
  ],
}

export default async function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
      <h1 className="sr-only">{TITLE}</h1>
      <Home rules={await loadRules()} />
    </>
  )
}
