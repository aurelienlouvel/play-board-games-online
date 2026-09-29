"use client"

import type { Carte, Couleur } from "@jeu/engine"
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three"

export const CARTE_L = 1.3
export const CARTE_H = 1.9
const PX = 360
const PY = Math.round((PX * CARTE_H) / CARTE_L)

export const COULEURS_CARTES: Record<Couleur, { fond: string; encre: string; symbole: string }> = {
  soleil: { fond: "#f4c542", encre: "#5a3b00", symbole: "☀" },
  lune: { fond: "#8fb3e8", encre: "#16305a", symbole: "☾" },
  etoile: { fond: "#e88fb3", encre: "#5a1633", symbole: "★" },
  comete: { fond: "#8fe8c2", encre: "#0f4a36", symbole: "✦" },
}

const POLICE = 'ui-rounded, "Avenir Next", "Nunito", system-ui, sans-serif'

function toile() {
  const c = document.createElement("canvas")
  c.width = PX
  c.height = PY
  return c
}

function arrondi(ctx: CanvasRenderingContext2D, x: number, y: number, l: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, l, h, r)
}

function finaliser(c: HTMLCanvasElement) {
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}

const faces = new Map<string, Texture>()

export function textureFace(carte: Carte): Texture {
  let t = faces.get(carte.id)
  if (t) return t
  const c = toile()
  const ctx = c.getContext("2d")!
  const { fond, encre, symbole } = COULEURS_CARTES[carte.couleur]
  ctx.fillStyle = "#fbf8f1"
  ctx.fillRect(0, 0, PX, PY)
  arrondi(ctx, 18, 18, PX - 36, PY - 36, 22)
  ctx.fillStyle = fond
  ctx.fill()
  ctx.fillStyle = encre
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `900 190px ${POLICE}`
  ctx.fillText(String(carte.valeur), PX / 2, PY / 2 + 8)
  ctx.font = `700 54px ${POLICE}`
  ctx.fillText(String(carte.valeur), 58, 66)
  ctx.fillText(symbole, 58, 124)
  ctx.save()
  ctx.translate(PX - 58, PY - 66)
  ctx.rotate(Math.PI)
  ctx.fillText(String(carte.valeur), 0, 0)
  ctx.fillText(symbole, 0, -58)
  ctx.restore()
  ctx.globalAlpha = 0.18
  ctx.font = `400 300px ${POLICE}`
  ctx.fillText(symbole, PX / 2, PY / 2 + 10)
  t = finaliser(c)
  faces.set(carte.id, t)
  return t
}

let dos: Texture | null = null
export function textureDos(accent = "#e8b43a", fond = "#1b2c4a"): Texture {
  if (dos) return dos
  const c = toile()
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#fbf8f1"
  ctx.fillRect(0, 0, PX, PY)
  arrondi(ctx, 18, 18, PX - 36, PY - 36, 22)
  ctx.fillStyle = fond
  ctx.fill()
  ctx.save()
  ctx.clip()
  ctx.strokeStyle = accent
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 3
  for (let d = -PY; d < PX + PY; d += 28) {
    ctx.beginPath()
    ctx.moveTo(d, 0)
    ctx.lineTo(d + PY, PY)
    ctx.moveTo(d, PY)
    ctx.lineTo(d + PY, 0)
    ctx.stroke()
  }
  ctx.restore()
  ctx.globalAlpha = 1
  ctx.strokeStyle = accent
  ctx.lineWidth = 6
  arrondi(ctx, 42, 42, PX - 84, PY - 84, 14)
  ctx.stroke()
  dos = finaliser(c)
  return dos
}

let tapis: Texture | null = null
export function textureTapis(): Texture {
  if (tapis) return tapis
  const c = document.createElement("canvas")
  c.width = c.height = 256
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#1f5a4a"
  ctx.fillRect(0, 0, 256, 256)
  const img = ctx.getImageData(0, 0, 256, 256)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 18
    img.data[i] = img.data[i]! + n
    img.data[i + 1] = img.data[i + 1]! + n
    img.data[i + 2] = img.data[i + 2]! + n
  }
  ctx.putImageData(img, 0, 0)
  tapis = finaliser(c)
  tapis.wrapS = tapis.wrapT = RepeatWrapping
  tapis.repeat.set(6, 4)
  return tapis
}
