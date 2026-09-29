import { Accueil } from "@/components/accueil/accueil"
import { chargerRegles } from "@/lib/regles-serveur"
import { AUTEUR, DESCRIPTION, GENRES, NOM, SITE_URL, TITRE } from "@/lib/site"
import { JEU } from "@jeu/engine"

export const revalidate = 60

const DONNEES_STRUCTUREES = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE_URL}/#site`, url: SITE_URL, name: TITRE, inLanguage: "fr-FR", description: DESCRIPTION },
    {
      "@type": "VideoGame",
      name: NOM,
      alternateName: TITRE,
      url: SITE_URL,
      description: DESCRIPTION,
      inLanguage: "fr-FR",
      genre: GENRES,
      gamePlatform: "Navigateur web",
      applicationCategory: "Game",
      playMode: "MultiPlayer",
      numberOfPlayers: { "@type": "QuantitativeValue", minValue: JEU.joueursMin, maxValue: JEU.joueursMax },
      offers: { "@type": "Offer", price: 0, priceCurrency: "EUR" },
      author: { "@type": "Person", name: AUTEUR.nom, url: AUTEUR.url },
    },
  ],
}

export default async function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(DONNEES_STRUCTUREES) }} />
      <h1 className="sr-only">{TITRE}</h1>
      <Accueil regles={await chargerRegles()} />
    </>
  )
}
