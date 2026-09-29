# play-game-online-template

Base des jeux de société en ligne : lobby avec options de partie, table 3D temps réel, fin de partie partageable, règles Sanity et to-do du projet sur `/to-do`.

## Démarrer

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # remplir Supabase, Sanity, TODO_PASSWORD
pnpm dev                                       # http://localhost:3000
pnpm dev:studio                                # Sanity Studio
pnpm test && pnpm typecheck
```

Supabase : exécuter `supabase/migrations/0001_parties.sql` puis `0002_taches.sql` (SQL editor).

## Nouveau jeu

Voir `CLAUDE.md` (section « Adapter à un nouveau jeu ») et le guide complet `docs/GUIDE_TEMPLATE_JEU_EN_LIGNE.md`.
