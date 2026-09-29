import type { MetadataRoute } from "next"
import { COLOR, DESCRIPTION, NAME, TITLE } from "@/lib/site"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: TITLE,
    short_name: NAME,
    description: DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: COLOR,
    theme_color: COLOR,
    lang: "fr",
  }
}
