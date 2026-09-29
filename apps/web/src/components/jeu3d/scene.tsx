"use client"

import type { CartePosee, VueJoueur } from "@jeu/engine"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { Suspense, useEffect, useMemo, useState } from "react"
import { type PerspectiveCamera, Vector3 } from "three"
import { Aura, REGLAGES_AURA_GAGNANT } from "./aura"
import { Carte3D } from "./carte3d"
import { POSE_PAQUET, type Pose, poseDos, poseMain, posePli, poseRamasse, REGLAGES_DISPOSITION, sieges } from "./disposition"
import { boutonCopie, onglet } from "./onglets-debug"
import { PhotoPartie } from "./photo"
import { useReglages } from "./reglages"
import { TexteTable } from "./texte-table"
import { CARTE_H, CARTE_L, textureDos, textureFace, textureTapis } from "./textures"

const RAD = Math.PI / 180
const CIBLE = new Vector3()

function CameraRig() {
  const { size } = useThree()
  const r = useControls(
    "Camera",
    {
      inclinaison: { value: 42, min: 0, max: 85, step: 0.5, label: "tilt °" },
      distance: { value: 21, min: 8, max: 60, step: 0.1, label: "distance" },
      fov: { value: 34, min: 10, max: 90, step: 0.5, label: "fov °" },
      cibleZ: { value: 1.2, min: -6, max: 6, step: 0.05, label: "target z" },
      ...boutonCopie("SCENE", "Camera"),
    },
    { order: 0 },
    onglet("SCENE"),
  )
  useFrame((etat) => {
    const cam = etat.camera as PerspectiveCamera
    const k = Math.max(1, 1.6 / (size.width / size.height))
    const d = r.distance * k
    cam.position.set(0, d * Math.cos(r.inclinaison * RAD), r.cibleZ + d * Math.sin(r.inclinaison * RAD))
    cam.lookAt(CIBLE.set(0, 0, r.cibleZ))
    if (cam.fov !== r.fov) {
      cam.fov = r.fov
      cam.updateProjectionMatrix()
    }
  })
  return null
}

function Table() {
  const R = REGLAGES_DISPOSITION
  const [tex] = useState(textureTapis)
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02} raycast={() => null}>
        <planeGeometry args={[120, 80]} />
        <meshBasicMaterial color="#0d1729" toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} scale={[R.rayonX + 1.6, R.rayonZ + 1.6, 1]} raycast={() => null}>
        <circleGeometry args={[1, 96]} />
        <meshBasicMaterial color="#6b4a2a" toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.005} scale={[R.rayonX + 1.35, R.rayonZ + 1.35, 1]} raycast={() => null}>
        <circleGeometry args={[1, 96]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}

function useRamassage(vue: VueJoueur) {
  const cle = vue.dernierPli ? vue.dernierPli.cartes.map((c) => c.carte.id).join("|") : null
  const [etat, setEtat] = useState<{ cle: string | null; phase: "pose" | "vol" | "fini" }>({ cle, phase: "fini" })
  if (etat.cle !== cle) setEtat({ cle, phase: cle ? "pose" : "fini" })
  useEffect(() => {
    if (etat.phase === "fini") return
    const t = setTimeout(() => setEtat((e) => ({ ...e, phase: e.phase === "pose" ? "vol" : "fini" })), etat.phase === "pose" ? 1300 : 1100)
    return () => clearTimeout(t)
  }, [etat.phase, etat.cle])
  return etat.phase
}

function Monde({ vue, couleur, onJouer, monTour }: SceneProps) {
  useReglages("Layout", REGLAGES_DISPOSITION, {
    rayonX: ["table radius x", 3, 14, 0.1],
    rayonZ: ["table radius z", 2, 10, 0.1],
    mainZ: ["hand z", 0, 10, 0.05],
    mainY: ["hand height", 0, 4, 0.05],
    mainInclinaison: ["hand tilt", 0, 1.5, 0.01],
    mainEcart: ["hand spacing", 0.5, 2, 0.01],
    mainEchelle: ["hand scale", 0.5, 2, 0.01],
    survolLevee: ["hover lift", 0, 1.5, 0.01],
    pliEcart: ["trick spread", 0, 1, 0.01],
  }, { ordre: 1 })
  const moiId = vue.moi?.id ?? null
  const places = useMemo(() => sieges(vue.joueurs.map((j) => j.id), moiId), [vue.joueurs, moiId])
  const [survol, setSurvol] = useState<string | null>(null)
  const ramassage = useRamassage(vue)
  const dos = useMemo(() => textureDos(), [])

  const main = vue.moi?.main ?? []
  const cartesPli: { p: CartePosee; pose: Pose; depart?: Pose }[] = vue.pli.map((p, rang) => {
    const siege = places.get(p.joueurId)!
    return { p, pose: posePli(siege, rang), depart: p.joueurId === moiId ? undefined : poseDos(siege, 0, 1) }
  })
  const dernier = vue.dernierPli
  const cartesRamassees =
    dernier && ramassage !== "fini"
      ? dernier.cartes.map((p, rang) => ({
          p,
          pose: ramassage === "pose" ? posePli(places.get(p.joueurId)!, rang) : poseRamasse(places.get(dernier.gagnantId)!),
          depart: p.joueurId === moiId ? undefined : poseDos(places.get(p.joueurId)!, 0, 1),
        }))
      : []
  const gagnants = vue.resultats?.vainqueurs ?? []

  return (
    <>
      <CameraRig />
      <Table />
      {vue.joueurs.map((j) => {
        const s = places.get(j.id)!
        const actif = vue.joueurActifId === j.id
        const pos: [number, number, number] = [s.x * (j.id === moiId ? 1 : 1.32), 0.02, s.z * (j.id === moiId ? 1.18 : 1.32)]
        return (
          <group key={j.id}>
            <Aura largeur={3.2} profondeur={1.6} position={[pos[0], 0.015, pos[2]]} lacet={0} force={actif ? 0.9 : gagnants.includes(j.id) ? 1 : 0} couleur={couleur(j.id)} reglages={REGLAGES_AURA_GAGNANT} />
            <TexteTable texte={j.pseudo.toUpperCase()} style={{ couleur: couleur(j.id), ombre: "rgba(0,0,0,0.6)|12|4" }} hauteur={0.62} position={[pos[0], 0.03, pos[2] - 0.25]} />
            <TexteTable texte={`${j.points} pt${j.points > 1 ? "s" : ""}`} style={{ couleur: "#f5f2ea", graisse: 700 }} hauteur={0.42} position={[pos[0], 0.03, pos[2] + 0.35]} />
            {j.id !== moiId &&
              Array.from({ length: j.nbCartes }, (_, i) => (
                <Carte3D key={`dos-${j.id}-${i}`} cible={poseDos(s, i, j.nbCartes)} depart={{ ...POSE_PAQUET, delai: i * 0.08 }} recto={dos} verso={dos} largeur={CARTE_L} hauteur={CARTE_H} />
              ))}
          </group>
        )
      })}
      {main.map((c, i) => (
        <Carte3D
          key={c.id}
          cible={poseMain(i, main.length, monTour && survol === c.id)}
          depart={{ ...POSE_PAQUET, delai: i * 0.08 }}
          recto={textureFace(c)}
          verso={dos}
          largeur={CARTE_L}
          hauteur={CARTE_H}
          lueur={monTour && survol === c.id ? "selection" : null}
          reflet={survol === c.id}
          onSurvol={(s) => setSurvol((v) => (s ? c.id : v === c.id ? null : v))}
          onClick={
            monTour
              ? (e) => {
                  e.stopPropagation()
                  setSurvol(null)
                  onJouer(c.id)
                }
              : undefined
          }
        />
      ))}
      {[...cartesRamassees, ...cartesPli].map(({ p, pose, depart }) => (
        <Carte3D key={p.carte.id} cible={pose} depart={depart} recto={textureFace(p.carte)} verso={dos} largeur={CARTE_L} hauteur={CARTE_H} />
      ))}
      <PhotoPartie />
    </>
  )
}

type SceneProps = {
  vue: VueJoueur
  couleur: (id: string) => string
  monTour: boolean
  onJouer: (carteId: string) => void
}

export function Scene(props: SceneProps) {
  return (
    <Canvas id="scene-3d" gl={{ preserveDrawingBuffer: true }} dpr={[1, 2]} camera={{ fov: 34, near: 0.1, far: 300, position: [0, 18, 14] }}>
      <Suspense fallback={null}>
        <Monde {...props} />
      </Suspense>
    </Canvas>
  )
}
