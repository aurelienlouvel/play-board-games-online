"use client"

import { Delete02Icon, Pdf02Icon, ImageUpload01Icon, LinkSquare02Icon, RotateLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/admin/ui/alert"
import { Badge } from "@/components/admin/ui/badge"
import { Button } from "@/components/admin/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/admin/ui/field"
import { Input } from "@/components/admin/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/admin/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select"
import { Spinner } from "@/components/admin/ui/spinner"
import { Textarea } from "@/components/admin/ui/textarea"
import { adminRequest } from "@/lib/admin-api"
import { DEFAULT_THEME, FONT_CHOICES, googleFontsHref, isHex, type SiteSettings, THEME_FIELDS, type ThemeColors } from "@/lib/settings"

type Meta = { writable: boolean; sanityConfigured: boolean; bounds: { min: number; max: number } }

const DEFAULT_FONT = "__default__"

function useFontPreview(fonts: (string | null)[]) {
  const href = googleFontsHref(fonts)
  useEffect(() => {
    if (!href) return
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = href
    document.head.appendChild(link)
    return () => link.remove()
  }, [href])
}

export function SettingsForm({ initial, meta }: { initial: SiteSettings; meta: Meta }) {
  const router = useRouter()
  const [saved, setSaved] = useState(initial)
  const [draft, setDraft] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const dirty = useMemo(() => JSON.stringify({ ...draft, logo: null }) !== JSON.stringify({ ...saved, logo: null }), [draft, saved])
  const disabled = !meta.writable
  useFontPreview([draft.bodyFont, draft.displayFont])

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => setDraft((d) => ({ ...d, [key]: value }))
  const setColor = (key: keyof ThemeColors, value: string) => setDraft((d) => ({ ...d, theme: { ...d.theme, [key]: value } }))

  function applySaved(s: SiteSettings, keepDraft = false) {
    setSaved(s)
    setDraft((d) => (keepDraft ? { ...d, logo: s.logo } : s))
    router.refresh()
  }

  async function save() {
    const invalid = THEME_FIELDS.find((f) => !isHex(draft.theme[f.key]))
    if (invalid) return toast.error(`Couleur « ${invalid.label} » invalide (format #rrggbb).`)
    setSaving(true)
    try {
      applySaved(await adminRequest<SiteSettings>("/api/admin/settings", { method: "PUT", body: JSON.stringify(draft) }))
      toast.success("Paramètres enregistrés")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function upload(file: File) {
    const form = new FormData()
    form.append("file", file)
    setUploading(true)
    try {
      applySaved(await adminRequest<SiteSettings>("/api/admin/logo", { method: "POST", body: form }), true)
      toast.success("Logo envoyé dans Sanity")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  async function removeLogo() {
    setUploading(true)
    try {
      applySaved(await adminRequest<SiteSettings>("/api/admin/logo", { method: "DELETE" }), true)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-6">
        {!meta.writable && (
          <Alert>
            <AlertTitle>{meta.sanityConfigured ? "Lecture seule" : "Sanity non configuré"}</AlertTitle>
            <AlertDescription>
              {meta.sanityConfigured
                ? "Ajoutez un token Sanity avec les droits Editor dans SANITY_API_WRITE_TOKEN pour enregistrer depuis cette page."
                : "Renseignez NEXT_PUBLIC_SANITY_PROJECT_ID puis SANITY_API_WRITE_TOKEN. Les valeurs affichées sont celles par défaut du code."}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Identité</CardTitle>
            <CardDescription>Nom du jeu, description pour le référencement et logo.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="title">Titre</FieldLabel>
                <Input id="title" value={draft.title} maxLength={80} onChange={(e) => set("title", e.target.value)} disabled={disabled} />
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea id="description" rows={3} value={draft.description} maxLength={400} onChange={(e) => set("description", e.target.value)} disabled={disabled} />
                <FieldDescription>
                  Utilisée pour Google et les aperçus de partage · {draft.description.length}/400
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Logo</FieldLabel>
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/50">
                    {draft.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={draft.logo} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Aucun logo</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                    <Button variant="outline" size="sm" disabled={disabled || uploading} onClick={() => fileInput.current?.click()}>
                      {uploading ? <Spinner data-icon="inline-start" /> : <HugeiconsIcon icon={ImageUpload01Icon} strokeWidth={2} data-icon="inline-start" />}
                      {draft.logo ? "Remplacer" : "Envoyer une image"}
                    </Button>
                    {draft.logo && (
                      <Button variant="ghost" size="sm" disabled={disabled || uploading} onClick={removeLogo}>
                        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
                        Retirer
                      </Button>
                    )}
                  </div>
                </div>
                <FieldDescription>PNG, SVG ou WebP · 5 Mo max · stocké dans Sanity. Sans logo, le titre est affiché.</FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Joueurs</CardTitle>
            <CardDescription>
              Le moteur du jeu autorise de {meta.bounds.min} à {meta.bounds.max} joueurs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="minPlayers">Minimum pour lancer</FieldLabel>
                <Input
                  id="minPlayers"
                  type="number"
                  min={meta.bounds.min}
                  max={draft.maxPlayers}
                  value={draft.minPlayers}
                  onChange={(e) => set("minPlayers", Number(e.target.value))}
                  disabled={disabled}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="maxPlayers">Maximum par partie</FieldLabel>
                <Input
                  id="maxPlayers"
                  type="number"
                  min={draft.minPlayers}
                  max={meta.bounds.max}
                  value={draft.maxPlayers}
                  onChange={(e) => set("maxPlayers", Number(e.target.value))}
                  disabled={disabled}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thème</CardTitle>
            <CardDescription>Couleurs de l&apos;accueil, du lobby et de l&apos;interface de jeu.</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" disabled={disabled} onClick={() => set("theme", DEFAULT_THEME)}>
                <HugeiconsIcon icon={RotateLeft01Icon} strokeWidth={2} data-icon="inline-start" />
                Défaut
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {THEME_FIELDS.map((f) => (
                <Field key={f.key}>
                  <FieldLabel htmlFor={`color-${f.key}`}>{f.label}</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <label className="relative block size-5 cursor-pointer overflow-hidden rounded-full border shadow-xs" style={{ background: isHex(draft.theme[f.key]) ? draft.theme[f.key] : "transparent" }}>
                        <input
                          type="color"
                          aria-label={f.label}
                          value={isHex(draft.theme[f.key]) ? draft.theme[f.key] : "#000000"}
                          onChange={(e) => setColor(f.key, e.target.value)}
                          disabled={disabled}
                          className="absolute inset-0 cursor-pointer opacity-0"
                        />
                      </label>
                    </InputGroupAddon>
                    <InputGroupInput
                      id={`color-${f.key}`}
                      value={draft.theme[f.key]}
                      onChange={(e) => setColor(f.key, e.target.value.trim())}
                      aria-invalid={!isHex(draft.theme[f.key])}
                      className="font-mono uppercase"
                      maxLength={7}
                      disabled={disabled}
                    />
                  </InputGroup>
                  <FieldDescription>{f.hint}</FieldDescription>
                </Field>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Typographie</CardTitle>
            <CardDescription>Polices Google Fonts chargées sur le site.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  { key: "displayFont", label: "Titres", hint: "Titres, boutons, annonces" },
                  { key: "bodyFont", label: "Texte", hint: "Paragraphes et interface" },
                ] as const
              ).map((f) => (
                <Field key={f.key}>
                  <FieldLabel>{f.label}</FieldLabel>
                  <Select value={draft[f.key] ?? DEFAULT_FONT} onValueChange={(v) => set(f.key, v === DEFAULT_FONT ? null : v)} disabled={disabled}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DEFAULT_FONT}>{f.key === "displayFont" ? "Comme le texte" : "Police système arrondie"}</SelectItem>
                      {FONT_CHOICES.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>{f.hint}</FieldDescription>
                </Field>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Règles PDF</CardTitle>
            <CardDescription>Liens affichés dans la fenêtre des règles.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {(["fr", "en"] as const).map((lang) => (
                <Field key={lang}>
                  <FieldLabel htmlFor={`pdf-${lang}`}>Règles PDF ({lang.toUpperCase()})</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <HugeiconsIcon icon={Pdf02Icon} strokeWidth={2} />
                    </InputGroupAddon>
                    <InputGroupInput
                      id={`pdf-${lang}`}
                      type="url"
                      placeholder="https://…"
                      value={draft.rulesPdf[lang] ?? ""}
                      onChange={(e) => set("rulesPdf", { ...draft.rulesPdf, [lang]: e.target.value || null })}
                      disabled={disabled}
                    />
                    {draft.rulesPdf[lang] && (
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton asChild size="icon-xs" aria-label="Ouvrir">
                          <a href={draft.rulesPdf[lang]!} target="_blank" rel="noopener noreferrer">
                            <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} />
                          </a>
                        </InputGroupButton>
                      </InputGroupAddon>
                    )}
                  </InputGroup>
                </Field>
              ))}
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crédits du jeu</CardTitle>
            <CardDescription>
              Affichés dans le pied de page : « Adaptation en ligne non officielle et gratuite de {draft.title || "…"}, un jeu de …, illustré par … et édité par … ». Laisser vide pour
              un jeu original.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  { key: "authors", label: "Auteurs", placeholder: "Romaric Galonnier et Anthony Perone" },
                  { key: "illustrator", label: "Illustration", placeholder: "Noëmie Chevalier" },
                  { key: "publisher", label: "Éditeur", placeholder: "Catch Up Games" },
                  { key: "publisherUrl", label: "Page du jeu chez l'éditeur", placeholder: "https://…" },
                ] as const
              ).map((f) => (
                <Field key={f.key}>
                  <FieldLabel htmlFor={`credits-${f.key}`}>{f.label}</FieldLabel>
                  <Input
                    id={`credits-${f.key}`}
                    type={f.key === "publisherUrl" ? "url" : "text"}
                    placeholder={f.placeholder}
                    value={draft.credits[f.key] ?? ""}
                    onChange={(e) => set("credits", { ...draft.credits, [f.key]: e.target.value || null })}
                    disabled={disabled}
                  />
                </Field>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Aperçu</CardTitle>
            <CardDescription>Écran d&apos;accueil</CardDescription>
          </CardHeader>
          <CardContent>
            <Preview settings={draft} />
          </CardContent>
        </Card>
        <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-3 pl-4">
          {dirty ? <Badge variant="secondary">Non enregistré</Badge> : <span className="text-sm text-muted-foreground">À jour</span>}
          <div className="flex gap-2">
            {dirty && (
              <Button variant="ghost" onClick={() => setDraft(saved)} disabled={saving}>
                Annuler
              </Button>
            )}
            <Button onClick={save} disabled={disabled || saving || !dirty}>
              {saving && <Spinner data-icon="inline-start" />}
              Enregistrer
            </Button>
          </div>
        </div>
      </aside>
    </div>
  )
}

function Preview({ settings }: { settings: SiteSettings }) {
  const { theme } = settings
  const title = settings.displayFont ? `"${settings.displayFont}", sans-serif` : "ui-rounded, system-ui, sans-serif"
  const body = settings.bodyFont ? `"${settings.bodyFont}", sans-serif` : "ui-rounded, system-ui, sans-serif"
  return (
    <div
      className="flex aspect-[4/5] flex-col items-center overflow-hidden rounded-xl p-5 text-center"
      style={{ background: `radial-gradient(120% 80% at 50% 40%, color-mix(in oklab, ${theme.background}, white 14%) 0%, ${theme.background} 70%)`, color: theme.foreground, fontFamily: body }}
    >
      <div className="mt-4 flex h-16 w-full items-center justify-center">
        {settings.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logo} alt="" className="max-h-full max-w-[80%] object-contain" />
        ) : (
          <p className="text-2xl leading-tight font-black" style={{ fontFamily: title }}>
            {settings.title || "Titre"}
          </p>
        )}
      </div>
      <p className="mt-3 line-clamp-2 text-[11px] opacity-70">{settings.description}</p>
      <div className="mt-5 w-full space-y-2 rounded-lg p-3 text-left text-xs" style={{ background: theme.surface }}>
        <p className="font-bold tracking-wider uppercase opacity-60" style={{ fontFamily: title, fontSize: 9 }}>
          Options de la partie
        </p>
        <div className="flex items-center justify-between">
          <span>Joueurs</span>
          <span className="font-bold tabular-nums">
            {settings.minPlayers}–{settings.maxPlayers}
          </span>
        </div>
        <div className="h-6 rounded-md" style={{ background: theme.surfaceDark }} />
      </div>
      <div className="mt-auto w-full rounded-lg py-2.5 text-sm font-bold uppercase" style={{ background: theme.foreground, color: theme.background, fontFamily: title }}>
        Créer une partie
      </div>
      <div className="mt-2 w-full rounded-lg py-2 text-xs font-bold uppercase" style={{ background: theme.accent, color: theme.background, fontFamily: title }}>
        Accent
      </div>
    </div>
  )
}
