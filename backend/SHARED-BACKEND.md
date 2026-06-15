# Shared "Games" backend

#LLM-generated

This repo's Supabase project is your shared **Games** project. One Supabase project
backs **every** game you ship, so you stay on the free tier (2 projects total: one
**Games**, one **Apps**) until revenue justifies more. Each game is namespaced by a
short `game` slug; **jabber-jawbreaker is the first tenant**.

## The model

- **`feedback`** — one shared playtest table for all games, tagged by `game`
  (anon INSERT-only via RLS; you read it in the dashboard). The static front-end
  stamps its slug automatically (`feedback.mjs` `init({..., game})`).
- **`matches` / `match_members` / `scores`** — async-multiplayer ledger. `matches`
  carries the `game` slug (set by the `create_match(p_game, …)` RPC); `scores`
  inherit their game from the parent match, so they don't need their own tag.
- **`profiles`** — intentionally NOT tagged: one shared player identity across all
  your games (same person, one handle).
- Auth is shared across games (anonymous or magic-link).

## Apply the genericization (one time)

In the SQL editor of the project you're keeping as **Games**, after `001`→`005`:

1. Run `backend/migrations/006_genericize.sql` — adds the `game` slug to `matches`
   and `feedback` (backfilling existing rows to `jabber-jawbreaker`), bounds the
   feedback RLS check, and upgrades `create_match` to require the slug. Non-destructive.
2. Deploy this repo. `app.mjs`'s `FEEDBACK` config now includes `game: "jabber-jawbreaker"`.

## Add a new game

1. Pick a slug (e.g. `prism-pond`).
2. **Feedback only** (static playtest page): set `FEEDBACK.game = "prism-pond"` and
   point `FEEDBACK.url` / `anonKey` at this same Games project. Done.
3. **Multiplayer too:** call `createMatch("prism-pond", …)` (see
   `backend/client/api.mjs`); matches/scores are then scoped to that slug.

No new Supabase project and no new migration per game.

## Credentials

Project URL + anon/publishable key are safe to embed in the front-end (RLS guards the
data). The database password / service_role key are never committed.
