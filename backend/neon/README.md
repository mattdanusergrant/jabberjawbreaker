# Ludus — Neon backend (Games)

#LLM-generated

jabber's playtest feedback now lands in the shared **Ludus** Neon project (Data API),
not Supabase. One Neon project backs every game, tagged by a `game` slug;
jabber-jawbreaker's slug is `jabber-jawbreaker`.

## Apply (one time, in the Ludus project)
1. **SQL Editor:** run `001_feedback.sql` (creates `feedback` + RLS + the anonymous-insert grant).
2. Auth isn't needed for the anonymous feedback path — leave Email OTP off until a game adds accounts.
3. Redeploy the `jabberjawbreaker` repo once the feedback client is swapped to Neon.

## Model
- `feedback(game, minigame, rating, …)` — one shared table; **anonymous INSERT-only** via RLS.
- Playtesters submit through the Data API's `anonymous` role (no login). You read in the
  SQL Editor / dashboard — there's no client read-back. The browser client must set
  `allowAnonymous` to send unauthenticated requests.

## Multiplayer (later)
The async-multiplayer tables (profiles / matches / scores + RPCs) aren't ported yet — they
need Neon Auth accounts, and note the Data API has **no realtime**, so live standings would
**poll** rather than subscribe. Add when multiplayer is actually built.

## Add another game
Set the game's `FEEDBACK.game` slug, point at this project's Data API URL, reuse `feedback`.
No new Neon project, no new migration.
