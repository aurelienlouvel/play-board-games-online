# Guide template — Jeu de société en ligne (base : Courtisans Online)

Ce document décrit le repo **Courtisans Online** pour le réutiliser comme **template** d'autres jeux de société multijoueurs en ligne. Il est destiné à **Oré** (porteur du projet, designer) et à **Claude** (l'IA qui code). Chaque section indique clairement **qui fait quoi**.

> Légende : 👤 = à faire par Oré · 🤖 = à faire par l'IA · ⭐ = point de validation obligatoire (l'IA s'arrête et attend le retour d'Oré)

---

## 1. Stack

| Couche | Techno | Rôle |
|---|---|---|
| Monorepo | **pnpm** workspaces (`apps/*`, `packages/*`) | un seul repo, 3 paquets |
| Front | **Next.js 16** (App Router, React 19, TypeScript) | site, lobby, jeu, routes API |
| UI | **Tailwind CSS 4**, **shadcn/ui** (Radix), **motion** (motion.dev), **sonner** (toasts), icônes **lucide-react** + **Hugeicons** | interface DOM |
| 3D | **three**, **@react-three/fiber**, **@react-three/drei**, **maath** (easing) | plateau de jeu en 3D |
| Debug | **leva** (panneaux de réglages, onglets custom) | réglages en direct, copiables |
| Moteur | **TypeScript pur** + **Vitest** (`packages/engine`) | règles du jeu, aucune dépendance UI |
| Temps réel / BDD | **Supabase** (Postgres + Realtime) | stockage des parties + diffusion des mises à jour |
| CMS | **Sanity** (Studio autonome dans `apps/studio`) | images, textes, règles, cartes, missions |
| Hébergement | **Vercel** (déploiement auto depuis GitHub `main`) | prod + previews |

⚠️ Next.js 16 a des changements cassants : l'IA doit lire `node_modules/next/dist/docs/` avant de coder (voir `apps/web/AGENTS.md`).

---

## 2. Architecture (les principes à garder dans chaque jeu)

1. **Le moteur est la seule source des règles.** Tout ce qui est règle (setup, tour, actions légales, score, fin) vit dans `packages/engine`, en TypeScript pur, testé. Le front et le serveur ne font qu'appeler le moteur.
2. **Serveur autoritaire.** Le client n'envoie que des *intentions* (`POST /api/parties/[code]/action`). Le serveur charge l'état, appelle le moteur, sauvegarde, diffuse.
3. **Vue filtrée par joueur.** L'état complet (`GameState`) est secret (mains, cartes cachées, missions). Chaque joueur reçoit uniquement `vueJoueur(state, joueurId)` via `GET /api/parties/[code]`.
4. **Temps réel "ping + refetch".** Après chaque écriture (verrou optimiste sur `version`), le serveur diffuse `maj` sur le canal Supabase `partie:{code}` ; les clients refetch leur vue. Pas de données sensibles dans le canal.
5. **Identité sans compte.** Cookie httpOnly (`courtisans_joueur`) = id joueur. Pseudo + avatar/château stockés dans le profil local.
6. **Contenu dans Sanity, valeurs par défaut dans le code.** Le site fonctionne même si Sanity est vide (`CATALOGUE_PAR_DEFAUT`), Sanity surcharge.
7. **3D = présentation seulement.** `disposition.ts` calcule des *poses* (position/rotation) pour chaque carte selon la vue ; `scene.tsx` anime chaque objet vers sa pose. Même clé React = même objet ⇒ vrais trajets (main → table).
8. **UI DOM par-dessus la 3D** (bandeau, journal, annonces, fin de partie, règles).

---

## 3. Organisation des fichiers

```
<jeu>/
├─ CLAUDE.md                     # règles du projet pour l'IA (à adapter par jeu)
├─ package.json                  # scripts racine (dev, build, test, typecheck, deploy:studio)
├─ pnpm-workspace.yaml
├─ supabase/migrations/0001_parties.sql   # table `parties` (RLS sans policy)
├─ scripts/                      # scripts ponctuels (extraction d'images depuis le PDF, seed Sanity)
├─ packages/engine/src/          # 🧠 MOTEUR (TS pur)
│  ├─ types.ts                   # GameState, Carte, Action, Phase…
│  ├─ setup.ts                   # setupPartie(joueurs, contenu, rng)
│  ├─ actions.ts                 # applyAction(state, action) + validations
│  ├─ scoring.ts                 # calcul des résultats
│  ├─ view.ts                    # vueJoueur(state, joueurId) → infos filtrées
│  ├─ missions.ts / deck.ts / rng.ts / errors.ts
│  ├─ debug.ts                   # commandes de debug (avancer d'un tour, finir la partie…)
│  └─ *.test.ts                  # Vitest (dont simulation.test.ts : parties complètes aléatoires)
├─ apps/studio/                  # 🗂 SANITY STUDIO (tout en anglais)
│  ├─ schemaTypes/documents/     # singletons (interface, game, rules, texts) + documents (family, role, courtier, mission…)
│  ├─ schemaTypes/objects/       # locale.ts (fr/en), condition.ts (récursif, calqué sur le moteur)
│  └─ scripts/migrate.ts         # migration idempotente du contenu
└─ apps/web/                     # 🌐 NEXT.JS
   ├─ public/                    # assets (voir conventions)
   └─ src/
      ├─ app/
      │  ├─ page.tsx, layout.tsx # accueil, métadonnées SEO, polices
      │  ├─ partie/[code]/       # page de partie (lobby puis jeu)
      │  ├─ api/parties/…        # routes : créer, rejoindre, quitter, lancer, action, rejouer, debug
      │  ├─ api/media/           # proxy same-origin des images Sanity (SVG en masque CSS)
      │  └─ robots.ts, sitemap.ts, manifest.ts, opengraph-image.*
      ├─ server/                 # code serveur : supabase.ts, parties.ts (modifierPartie + verrou), joueur.ts (cookie), api.ts (handle/ApiError)
      ├─ sanity/                 # client, queries.ts (defineQuery), types.ts (généré), catalogue-client.ts (Sanity → CatalogueClient)
      ├─ lib/                    # api.ts (client fetch), use-partie.ts, realtime.ts, catalogue.ts (+ défauts), i18n.ts, son.ts, regles-defaut.ts
      └─ components/
         ├─ ui/                  # shadcn
         ├─ accueil/, banquet/   # écran d'accueil (création / rejoindre)
         ├─ partie/              # lobby, partie-client (bascule lobby → jeu)
         ├─ jeu/                 # UI DOM du jeu : bandeau, journal, fin-de-partie, partage, contexte
         ├─ jeu3d/               # scène 3D : scene, carte3d, disposition, fin3d, annonce, debug, reglages…
         └─ regles.tsx           # règles en onglets (textes Sanity)
```

---

## 4. Conventions

### Langue & nommage
- **Code en anglais, mots "métier" en français** : `courtisan`, `famille`, `domaine`, `pioche`, `lumiere`, `disgrace`… (fonctions/variables métier en français : `jouerCarte`, `vueJoueur`, `modifierPartie`, `REGLAGES_CARTE`). Garder le même principe pour un nouveau jeu : lister dans `CLAUDE.md` les mots métier du jeu.
- **Peu de commentaires** ; noms explicites.
- **Sanity 100 % anglais** (types, ids, champs, titres). Ids déterministes : `family-butterfly`, `role-spy`, `courtier-noble-hare`. Le champ `key` contient la clé du moteur (`papillon`, `espion`).
- Textes affichés localisés `{ fr, en }` (`localeString` / `localeText`), lus avec `traduire()`.

### Assets (`apps/web/public`)
- Dossiers en anglais minuscules : `home/`, `cards/`, `pictograms/`, `rules/`, `sounds/`, `textures/`.
- Fichiers en anglais `UPPER_SNAKE_CASE` : `cards/SPY_HARE.webp`, `home/QUEEN.webp`, `sounds/HOVER.mp3`, `pictograms/PICTOGRAM_ARROW_UP.svg`.
- Format : `.webp` pour les images, `.svg` pour les pictos, `.mp3` pour le son.

### Commits
- Gitmoji : `<emoji>(<scope>): <description>` — scopes `nextjs` · `studio` (ajouter `engine` si besoin).
- Commits fréquents, un par feature significative.

### Debug
- Panneau **Shift+D** (ou `?debug`). Onglets `GAME / SCENE / AUDIO / TRANSITION` + compteur FPS.
- **Tout paramètre visuel est réglable** (via `useReglages(dossier, objetMutable, champs)`) avec un bouton **Copy values** : Oré règle en live puis colle le JSON à l'IA, qui fige les valeurs par défaut.
- Boutons de phase (START / NEXT TURN / END) branchés sur `POST /api/parties/[code]/debug` (désactivé en prod sauf `DEBUG_PARTIES=1`).

---

## 5. Qui fait quoi

### 👤 Oré (humain) — ce que l'IA ne peut pas faire
- **Comptes & secrets** : créer le projet Supabase, Sanity, Vercel, le repo GitHub ; remplir `apps/web/.env.local` et les variables Vercel. **Ne jamais coller de token dans le chat** : les mettre dans `.env.local`.
- **Pousser le code** : `git push` (l'IA commite, Oré pousse).
- **Commandes Sanity avec son compte** :
  - `pnpm --filter studio schema:deploy` (après un changement de schéma)
  - `pnpm --filter studio migrate` (migration du contenu)
  - `pnpm --filter studio run deploy` (déployer le Studio)
- **Appliquer la migration SQL** Supabase (`supabase/migrations/*.sql`).
- **Fournir les assets** : PDF des règles, images des cartes, pictos (SVG), textures, polices, sons — nommés selon la convention, ou dans un dossier `ASSETS/` à trier.
- **Saisir / valider le contenu dans Sanity** (textes, missions, images).
- **Tester en vrai à plusieurs** (l'IA ne peut pas joindre Supabase depuis son environnement cloud : elle teste avec des données simulées).
- **Search Console / domaine / SEO** (validation de propriété, DNS).

### 🤖 IA (Claude)
- Écrire et tester le **moteur** (règles + tests Vitest, dont simulations de parties complètes).
- Schémas Sanity, requêtes GROQ, `typegen`, script `migrate.ts` idempotent.
- Routes API, vue filtrée, temps réel, lobby.
- Scène 3D, animations, UI DOM, règles, fin de partie, partage.
- Exposer **chaque réglage visuel dans le debug** avec "Copy values".
- Vérifier chaque changement : `tsc`, `eslint`, `next build`, captures Playwright (le rendu 3D headless est lent : les captures servent à vérifier la mise en page, pas les FPS).
- Commiter (gitmoji) ; ne jamais committer `.env.local` ni les modifs locales non liées (`package.json`, `pnpm-lock.yaml`… sauf si voulu).
- Ne jamais envoyer l'email d'Oré à un service tiers ; ne pas contourner les blocages réseau.

---

## 6. Déroulé pour un nouveau jeu (avec points de validation ⭐)

| # | Étape | Qui | Livrable |
|---|---|---|---|
| 0 | Fournir le PDF des règles + assets bruts + nom du jeu | 👤 | dossier `ASSETS/` |
| 1 | Lire les règles, rédiger **`plan-v1.md`** (règles formalisées, matériel, cas limites, infos cachées, liste des mots métier) | 🤖 | plan |
| ⭐ | **Valider l'interprétation des règles** (c'est le point le plus critique : une règle mal comprise se propage partout) | 👤 | ok / corrections |
| 2 | Dupliquer le template, renommer (`@<jeu>/engine`, cookie `<jeu>_joueur`, canal `partie:`), adapter `CLAUDE.md` | 🤖 | repo propre |
| 3 | Créer comptes + `.env.local` + table Supabase + projet Sanity | 👤 | env prêts |
| 4 | **Moteur** : types, setup, actions, scoring, vue filtrée, tests + simulation | 🤖 | tests verts |
| ⭐ | Valider le moteur via un récap des règles codées (et, si possible, une partie texte simulée) | 👤 | ok |
| 5 | Schémas Sanity + migration + seed (images extraites du PDF si besoin) | 🤖 | studio |
| 6 | `schema:deploy`, `migrate`, deploy studio, vérifier le contenu | 👤 | contenu en ligne |
| 7 | Accueil + lobby (réutiliser `banquet/`, `partie/`) — adapter l'habillage | 🤖 | écrans |
| ⭐ | **Direction artistique** : ambiance, typos, couleurs, décor d'accueil | 👤 | retours visuels |
| 8 | Plateau 3D : disposition, cartes, main, zones jouables, ciblage | 🤖 | jeu jouable |
| ⭐ | **Jouabilité / lisibilité** : taille des cartes, caméra, feedbacks, ce qui est caché | 👤 | retours + JSON de réglages copiés |
| 9 | Ouverture (installation animée), annonces de tour | 🤖 | |
| 10 | Fin de partie : séquence de décompte, tableau des scores, rejouer, partage image | 🤖 | |
| ⭐ | **Fin de partie & partage** (moment émotionnel du jeu) | 👤 | retours |
| 11 | Règles in-app (textes Sanity, illustrations), SEO, OG image | 🤖 + 👤 (textes) | |
| 12 | **Test réel multijoueur** (2 → max joueurs, reconnexion, départ en cours) | 👤 | bugs remontés |
| 13 | Perf (FPS sur machine moyenne), accessibilité, mobile | 🤖 | |
| 14 | Son (en dernier) | 🤖 + 👤 (sons) | |

### Comment donner ses retours efficacement 👤
- **Capture d'écran annotée** + phrase courte ("plus petit", "moins saturé", "à cheval sur la bordure").
- **JSON "Copy values"** du debug quand un réglage est trouvé → l'IA en fait la valeur par défaut.
- Préciser **quelle phase** (ouverture, tour, fin) et **quel état** (mon tour / tour adverse).
- Un retour = une liste de points : l'IA les traite tous puis envoie un récap.

---

## 7. Ce qui est générique (réutilisable tel quel) vs spécifique au jeu

**Générique (garder)**
- `server/` (supabase, parties avec verrou optimiste, cookie joueur, `handle`/`ApiError`), routes `api/parties/*`, `lib/api.ts`, `use-partie.ts`, `realtime.ts`
- Lobby, écran d'accueil (habillage à changer), `EcranOrdinateur`
- Debug : `debug.tsx`, `onglets-debug.ts`, `reglages.ts` (`useReglages`, Copy values, FPS)
- Annonces (`annonce.tsx`), auras, `texte-table.tsx`, carte 3D (`carte3d.tsx` : pli, reflets, contour), textures/motifs
- Règles en onglets (`regles.tsx` + `regles-defaut.ts` + singleton Sanity `rules`)
- Partage de fin (photo 3D `photo.tsx` + `partage.ts` + `apercu-partage.tsx`), tableau des scores (structure)
- SEO (`layout.tsx` metadata, robots, sitemap, manifest, OG), proxy `api/media`
- Sanity : `locale.ts`, singletons `interface/game/texts/rules`, pattern `migrate.ts`

**Spécifique (à réécrire par jeu)**
- `packages/engine/*` (règles)
- `disposition.ts` (où vont les cartes), `scene.tsx` (zones, interactions), `fin.ts`/`fin3d.tsx` (séquence de décompte)
- Types de contenu Sanity (family/role/courtier/mission → équivalents du nouveau jeu), `condition.ts`
- Textes, assets, couleurs, `CATALOGUE_PAR_DEFAUT`

---

## 8. Pièges connus (à transmettre à l'IA)
- **Phase "missions"** : dans Courtisans, le moteur démarre directement en phase `jeu` ; l'ouverture est déclenchée côté client par "missions non lues". Vérifier que les déclencheurs UI correspondent aux vrais états du moteur (bug trouvé tard car les données simulées ne reflétaient pas le moteur) → **toujours générer les mocks depuis le moteur**.
- **Images Sanity en CSS mask** : bloquées cross-origin → passer par `/api/media` (same-origin). `next/image` n'accepte que les qualités configurées (75 par défaut).
- **SVG à petite taille intrinsèque** (24×24) en texture 3D → floues : les rasteriser en 512 px avant `CanvasTexture`.
- **Effets React** dépendant d'objets recréés à chaque rendu (vue filtrée, réglages) → dépendre d'une clé stable (string) sinon timers annulés en boucle.
- **Canvas 2D coûteux** (`shadowBlur` par frame) → pré-rendre les sprites.
- **Capture WebGL** : `preserveDrawingBuffer: true` + caméra dédiée ; masquer les objets attachés à la caméra (`userData.horsPhoto`).
- **Textes du livret** : l'IA reformule (droits d'auteur) ; Oré peut coller le texte officiel lui-même dans Sanity.
- **Verrous git** : si l'IA n'a pas le droit de supprimer dans le dossier, git peut laisser des `.lock` → donner la permission de suppression ou les retirer à la main.

---

## 9. Commandes utiles
```bash
pnpm install
pnpm dev                     # site (apps/web)
pnpm dev:studio              # Sanity Studio local
pnpm test                    # tests du moteur
pnpm typecheck
pnpm --filter studio typegen # régénère apps/web/src/sanity/types.ts
pnpm --filter studio schema:deploy
pnpm --filter studio migrate
pnpm --filter studio run deploy
```

### Variables d'environnement (`apps/web/.env.local`, jamais commité)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ou `ANON_KEY`), `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SITE_URL`, optionnel `DEBUG_PARTIES=1`.
