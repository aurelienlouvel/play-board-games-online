# Courtisans Online

Version en ligne du jeu de société **Courtisans** (Catch Up Games).

## Conventions de code
Code en anglais avec peu de commentaires
Mot "métier" en français

Exemples de mots métier gardés en français : `courtisan`, `famille`, `role`, `mission`, `domaine`, `tableDeLaReine`, `lumiere`, `disgrace`, `noble`, `espion`, `assassin`, `garde`, `pioche`, `chateau`.

## Stack Technique
- Nextjs
- Sanity
- Package manager : **pnpm**
- UI : shadcn/ui, Tailwind CSS, motion (motion.dev)
- Temps réel : Supabase (Postgres + Realtime), logique autoritaire côté serveur (routes API Next.js)
- Déploiement : Vercel (auto depuis GitHub)

## Structure
- `apps/web` — front Next.js
- `apps/studio` — Sanity Studio (médias, familles, rôles, courtisans, missions)
- `packages/engine` — moteur de jeu pur TypeScript (règles, tours, score, missions), testé avec Vitest, sans dépendance UI. Réutilisable pour une V2 en react-three-fiber.

## Principes
- Le serveur est la seule source de vérité ; chaque joueur ne reçoit qu'une vue filtrée (mains, espions, missions cachés).
- Le rendu du plateau passe par des « slots » de position pour pouvoir basculer en 3D plus tard.
- Les règles du jeu vivent uniquement dans `packages/engine`.

## Commits

Format gitmoji : `<emoji>(<scope>): <description>`
Scopes : `nextjs` · `studio`

Commiter souvent, à chaque feature significative, pour garder un historique.
