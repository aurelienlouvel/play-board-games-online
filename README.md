# play-game-online-template

Base des jeux de société en ligne : lobby avec options de partie, table 3D temps réel, fin de partie partageable, règles Sanity, administration sur `/setup` (paramètres + to-do) et `/status` (dashboard).

## Démarrer

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # remplir Supabase, Sanity, ADMIN_LOGIN / ADMIN_PASSWORD
pnpm dev                                       # http://localhost:3000
pnpm dev:studio                                # Sanity Studio
pnpm test && pnpm typecheck
```

Supabase : exécuter `supabase/migrations/0001_games.sql` puis `0002_tasks.sql` (SQL editor).

## Administration

- `/setup` : paramètres du site enregistrés dans Sanity (titre, description, logo, min/max joueurs, thème, polices, règles PDF FR/EN) + to-do du projet
- `/status` : parties en cours, créées, joueurs uniques, dernières parties, audience Vercel Web Analytics, état de la config et liste des sites du compte Vercel
- Connexion : `ADMIN_LOGIN` / `ADMIN_PASSWORD`. Style shadcn preset `b1VlJAwK` (luma, neutral, Inter, Hugeicons), composants dans `apps/web/src/components/admin/ui`

## Nouveau jeu

Voir `CLAUDE.md` (section « Adapter à un nouveau jeu ») et le guide complet `docs/GUIDE_TEMPLATE_JEU_EN_LIGNE.md`.
