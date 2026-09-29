import type { Metadata, Viewport } from "next"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AUTEUR, COULEUR, DESCRIPTION, MOTS_CLES, NOM, SITE_URL, TITRE } from "@/lib/site"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITRE, template: `%s · ${TITRE}` },
  description: DESCRIPTION,
  applicationName: NOM,
  keywords: MOTS_CLES,
  authors: [{ name: AUTEUR.nom, url: AUTEUR.url }],
  creator: AUTEUR.nom,
  category: "games",
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "fr_FR", url: "/", siteName: TITRE, title: TITRE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITRE, description: DESCRIPTION },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  formatDetection: { telephone: false, email: false, address: false },
}

export const viewport: Viewport = { themeColor: COULEUR, colorScheme: "dark" }

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
