import { Euler, Quaternion, Vector3 } from "three"

export type Pose = { position: Vector3; quaternion: Quaternion; echelle: number; delai?: number }
export type Siege = { x: number; z: number; lacet: number }

export const REGLAGES_DISPOSITION = {
  rayonX: 7.4,
  rayonZ: 4.4,
  mainZ: 6.1,
  mainY: 1.1,
  mainInclinaison: 0.62,
  mainEcart: 1.05,
  mainEchelle: 1.2,
  survolLevee: 0.45,
  pliEcart: 0.3,
}

const q = (x: number, y: number, z: number) => new Quaternion().setFromEuler(new Euler(x, y, z))
const aplat = (lacet: number) => q(-Math.PI / 2, 0, lacet)

export function sieges(ids: string[], moiId: string | null): Map<string, Siege> {
  const R = REGLAGES_DISPOSITION
  const debut = Math.max(0, ids.indexOf(moiId ?? ""))
  const ordre = [...ids.slice(debut), ...ids.slice(0, debut)]
  const autres = ordre.length - 1
  const resultat = new Map<string, Siege>()
  ordre.forEach((id, i) => {
    if (i === 0 && moiId) {
      resultat.set(id, { x: 0, z: R.rayonZ, lacet: 0 })
      return
    }
    const k = moiId ? i - 1 : i
    const n = moiId ? autres : ordre.length
    const angle = n === 1 ? -Math.PI / 2 : Math.PI + 0.35 + (k / (n - 1)) * (Math.PI - 0.7)
    const x = Math.cos(angle) * R.rayonX
    const z = Math.sin(angle) * R.rayonZ
    resultat.set(id, { x, z, lacet: Math.atan2(x, z) + Math.PI })
  })
  return resultat
}

export function poseMain(i: number, n: number, leve: boolean): Pose {
  const R = REGLAGES_DISPOSITION
  const x = (i - (n - 1) / 2) * R.mainEcart
  const courbe = Math.abs(i - (n - 1) / 2) * 0.06
  return {
    position: new Vector3(x, R.mainY + (leve ? R.survolLevee : 0) + i * 0.004, R.mainZ + courbe - (leve ? 0.25 : 0)),
    quaternion: q(-Math.PI / 2 + R.mainInclinaison, 0, -(i - (n - 1) / 2) * 0.05),
    echelle: R.mainEchelle,
  }
}

export function poseDos(siege: Siege, i: number, n: number): Pose {
  const decalage = (i - (n - 1) / 2) * 0.32
  const cos = Math.cos(siege.lacet)
  const sin = Math.sin(siege.lacet)
  const recul = 1.1
  return {
    position: new Vector3(siege.x * 1.08 + cos * decalage + sin * recul * 0, 0.02 + i * 0.004, siege.z * 1.08 - sin * decalage),
    quaternion: q(Math.PI / 2, 0, siege.lacet + Math.PI),
    echelle: 0.62,
  }
}

export function posePli(siege: Siege, rang: number): Pose {
  const R = REGLAGES_DISPOSITION
  return {
    position: new Vector3(siege.x * R.pliEcart, 0.03 + rang * 0.012, siege.z * R.pliEcart),
    quaternion: aplat(siege.lacet + ((rang * 37) % 11) * 0.02 - 0.1),
    echelle: 1,
  }
}

export function poseRamasse(siege: Siege): Pose {
  return { position: new Vector3(siege.x * 1.05, 0.04, siege.z * 1.05), quaternion: aplat(siege.lacet), echelle: 0.35 }
}

export const POSE_PAQUET: Pose = { position: new Vector3(0, 3.2, -0.5), quaternion: q(Math.PI / 2, 0, 0), echelle: 0.9 }
