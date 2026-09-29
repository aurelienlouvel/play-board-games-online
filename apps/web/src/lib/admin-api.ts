const MESSAGES: Record<string, string> = {
  ACCESS_DENIED: "Session expirée, reconnectez-vous.",
  INVALID_CREDENTIALS: "Identifiant ou mot de passe incorrect.",
  SANITY_TOKEN_MISSING: "Ajoutez SANITY_API_WRITE_TOKEN pour enregistrer dans Sanity.",
  SANITY_NOT_CONFIGURED: "Sanity n'est pas configuré (NEXT_PUBLIC_SANITY_PROJECT_ID).",
  INVALID_COLOR: "Une couleur n'est pas au format #rrggbb.",
  INVALID_URL: "Le lien PDF doit commencer par http(s)://.",
  EMPTY_TITLE: "Le titre est obligatoire.",
  EMPTY_TEXT: "La tâche est vide.",
  INVALID_FILE: "Choisissez une image.",
  FILE_TOO_LARGE: "Image trop lourde (5 Mo max).",
}

export class AdminApiError extends Error {
  constructor(public code: string) {
    super(MESSAGES[code] ?? "Une erreur est survenue.")
  }
}

export async function adminRequest<T>(route: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData
  const res = await fetch(route, { ...init, headers: isForm ? undefined : { "Content-Type": "application/json" }, cache: "no-store" })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new AdminApiError((data as { error?: string }).error ?? "ERROR")
  return data as T
}
