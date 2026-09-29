"use client"

import { CheckIcon, CopyIcon, Loader2Icon } from "lucide-react"
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp"
import { motion } from "motion/react"
import { useState } from "react"
import { toast } from "sonner"
import { Logo } from "@/components/logo"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import { AUTEUR, CONTACT, CREDITS, LOGO, NOM } from "@/lib/site"
import { cn } from "@/lib/utils"

export function Ecran({
  children,
  bouton,
  bas,
  haut,
  onSubmit,
}: {
  children?: React.ReactNode
  bouton?: React.ReactNode
  bas?: React.ReactNode
  haut?: React.ReactNode
  onSubmit?: (e: React.FormEvent) => void
}) {
  const Conteneur = onSubmit ? "form" : "div"
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="fond relative flex flex-1 flex-col items-center overflow-hidden px-4 pt-[8vh] pb-[6vh]">
        {haut && <div className="absolute top-5 right-5 z-20">{haut}</div>}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="w-[min(80vw,520px)]">
          {LOGO ? <Logo src={LOGO} /> : <h1 className="text-center font-display text-5xl font-black tracking-tight text-balance md:text-6xl">{NOM}</h1>}
        </motion.div>
        <Conteneur onSubmit={onSubmit} className="flex w-full flex-1 flex-col items-center">
          {children}
          <div className="mt-auto flex w-full flex-col items-center gap-5 pt-[5vh]">
            {bouton}
            {bas}
          </div>
        </Conteneur>
      </main>
      <PiedDePage />
    </div>
  )
}

export function BoutonPrincipal({
  children,
  occupe,
  disabled,
  onClick,
  className,
}: {
  children: React.ReactNode
  occupe?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      disabled={disabled || occupe}
      onClick={onClick}
      className={cn(
        "inline-flex h-14 w-full max-w-md cursor-pointer items-center justify-center gap-2 rounded-xl bg-foreground px-8 font-display text-xl font-bold tracking-wide text-background uppercase shadow-[0_10px_30px_rgb(0_0_0/45%)] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-default disabled:opacity-60 disabled:hover:scale-100",
        className,
      )}
    >
      {occupe && <Loader2Icon className="size-5 animate-spin" />}
      {children}
    </button>
  )
}

export function ChampPseudo({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      id="pseudo"
      name="pseudo"
      type="text"
      value={value}
      maxLength={20}
      autoFocus
      autoComplete="off"
      spellCheck={false}
      data-1p-ignore
      data-lpignore="true"
      placeholder="VOTRE PSEUDO…"
      aria-label="Votre pseudo"
      onChange={(e) => onChange(e.target.value.toUpperCase())}
      className="mt-[6vh] h-14 w-full max-w-md border-b border-foreground/30 bg-transparent px-2 text-center font-display text-2xl tracking-[0.12em] uppercase outline-none placeholder:text-foreground/35 focus:border-foreground"
    />
  )
}

const CASE = "size-11 bg-surface-fonce/80 font-display text-lg uppercase"

export function ChampCode({ value, onChange, copiable }: { value: string; onChange?: (v: string) => void; copiable?: string }) {
  const [copie, setCopie] = useState(false)
  async function copier() {
    if (!copiable) return
    try {
      await navigator.clipboard.writeText(copiable)
      setCopie(true)
      toast.success("Lien de la partie copié !")
      setTimeout(() => setCopie(false), 1600)
    } catch {
      toast.error("Impossible de copier")
    }
  }
  return (
    <div className="relative flex items-center">
      <InputOTP
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
        value={value}
        onChange={(v) => onChange?.(v.toUpperCase())}
        disabled={!onChange}
        aria-label="Code de la partie"
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
      >
        <InputOTPGroup>
          {[0, 1, 2].map((i) => (
            <InputOTPSlot key={i} index={i} className={cn(CASE, !onChange && "opacity-100")} />
          ))}
        </InputOTPGroup>
        <InputOTPSeparator className="text-foreground/60" />
        <InputOTPGroup>
          {[3, 4, 5].map((i) => (
            <InputOTPSlot key={i} index={i} className={cn(CASE, !onChange && "opacity-100")} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      {copiable && (
        <button
          type="button"
          onClick={copier}
          aria-label="Copier le lien de la partie"
          className="absolute -right-14 flex size-11 cursor-pointer items-center justify-center rounded-lg border border-foreground/40 bg-surface-fonce/80 transition-transform hover:scale-110"
        >
          {copie ? <CheckIcon className="size-5" /> : <CopyIcon className="size-5" strokeWidth={1.5} />}
        </button>
      )}
    </div>
  )
}

export function Texte({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 }}
      className={cn("mt-[3vh] max-w-2xl text-center text-lg leading-snug text-balance text-foreground/80", className)}
    >
      {children}
    </motion.div>
  )
}

function PiedDePage() {
  const lien = "underline decoration-foreground/30 underline-offset-2 hover:text-foreground"
  return (
    <footer className="shrink-0 bg-surface-fonce px-4 py-5 text-center text-xs leading-relaxed text-foreground/55">
      {CREDITS && (
        <p>
          Adaptation en ligne non officielle et gratuite de <em>{CREDITS.jeu}</em>, un jeu de {CREDITS.auteurs}, édité par{" "}
          <a href={CREDITS.editeur.url} target="_blank" rel="noreferrer" className={lien}>
            {CREDITS.editeur.nom}
          </a>
          . Tous droits réservés à leurs auteurs et à l&apos;éditeur.
        </p>
      )}
      <p>
        Développé par{" "}
        <a href={AUTEUR.url} target="_blank" rel="noreferrer" className={lien}>
          {AUTEUR.nom}
        </a>{" "}
        · Contact :{" "}
        <a href={`mailto:${CONTACT}`} className={lien}>
          {CONTACT}
        </a>
      </p>
    </footer>
  )
}
