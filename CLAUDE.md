# Play Game Online · Template

Base commune des jeux de société en ligne (`<slug>-online`). La démo « La Plus Haute » (jeu de plis minimal) montre le contrat moteur ↔ web ; on la remplace par le vrai jeu.

## Conventions de code
Code en anglais avec peu de commentaires
Mots "métier" en français (`partie`, `joueur`, `manche`, `pli`, `carte`, `options`, `vue`, `etat`…)

## Assets
Fichiers dans `apps/web/public` nommés en anglais, `EN_MAJUSCULES_AVEC_DES_TIRETS_DU_BAS` (ex. `cards/BACK.webp`), dossiers en anglais minuscules.

## Stack technique
- Next.js 16 (App Router, React 19), Tailwind 4, shadcn/ui, motion, sonner
- 3D : three + @react-three/fiber + drei, réglages leva (panneau debug `Shift+D`)
- Temps réel : Supabase (Postgres + Realtime broadcast), logique autoritaire côté serveur (routes API Next.js)
- Sanity (studio autonome `apps/studio`) pour règles/textes/médias
- Vitest pour le moteur · pnpm workspaces · Vercel

## Structure
- `packages/engine` (`@jeu/engine`) — moteur pur TypeScript, sans UI
  - `contrat.ts` : `DefinitionJeu<Etat, Action, Vue>` (setup, appliquer, vue, termine, options, actionsClient, debug)
  - `options.ts` : options de partie déclaratives (`nombre` / `choix` / `booleen`), `normaliserOptions`
  - `demo/` : le jeu démo ; `index.ts` exporte `JEU` = le jeu actif
- `apps/web` — front Next.js
  - `server/parties.ts` : création, `nouvellePartie`, vue publique ; routes `api/parties/[code]/*`
  - `components/partie` : lobby + options (rendues automatiquement depuis `JEU.options`, éditables par l'hôte)
  - `components/jeu` : `jeu.tsx` (table, annonces, debug), `fin-de-partie.tsx`, `partage.ts` (image de résultat)
  - `components/jeu3d` : scène (`scene.tsx`), poses (`disposition.ts`), textures, annonces, debug leva
  - `app/to-do` + `api/taches` : to-do du projet (Supabase, protégée par `TODO_PASSWORD`)
  - `lib/site.ts` : nom, slug, SEO, couleurs du jeu
- `apps/studio` — Sanity Studio (singletons `interface`, `game`, `rules`, `texts`)
- `supabase/migrations` — `0001_parties.sql`, `0002_taches.sql`

## Adapter à un nouveau jeu
1. Écrire le moteur dans `packages/engine/src/<jeu>/` (types, `DefinitionJeu`, tests) puis `export { monJeu as JEU }` dans `index.ts`
2. Déclarer les options de partie dans `options` du `DefinitionJeu` : le lobby les affiche seul
3. Adapter `lib/site.ts`, `globals.css` (tokens `--background`, `--accent-jeu`, `--surface`…), puis la scène 3D et `jeu.tsx`
4. Remplacer `__SANITY_PROJECT_ID__` / `__SANITY_STUDIO_HOST__` (fait par `setup-games.sh`)

## Supabase (temps réel)
- Table `parties`, RLS activée sans policy : seul le serveur (clé service role) la lit/écrit
- `etat` = état complet du moteur (secret) ; les clients reçoivent uniquement `JEU.vue(etat, joueurId)` via `GET /api/parties/[code]`
- Après chaque écriture (verrou optimiste sur `version`), le serveur diffuse `maj` sur `partie:{code}` ; le client refetch
- Identité joueur = cookie httpOnly `<slug>_joueur`
- Routes : `POST /api/parties`, `GET /api/parties/[code]`, `POST .../rejoindre|quitter|options|lancer|action|rejouer|debug`

## Principes
- Le serveur est la seule source de vérité ; chaque joueur ne reçoit qu'une vue filtrée
- Les règles du jeu vivent uniquement dans le moteur
- `debug` (START / NEXT TURN / END) désactivé en production sauf `DEBUG_PARTIES=1`

## Commits
Format gitmoji : `<emoji>(<scope>): <description>`
Scopes : `nextjs` · `studio` · `engine`

Commiter souvent, à chaque feature significative.
