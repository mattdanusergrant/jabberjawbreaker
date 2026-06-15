# Jabber Jawbreaker

A mobile **5×5 letter-grid party game** — one shared board, a rotating roster of word
mini-games. This repo hosts the **single-player v0.2 prototype** as a static site on
GitHub Pages. Boxing theme (jab + jabber + jawbreaker).

## Play

Once GitHub Pages is enabled (see below), the game lives at:

```
https://mattdanusergrant.github.io/jabberjawbreaker/
```

On launch you pick **🥊 Start a Bout** or **🎯 Playtest the modes**.

## Bout mode (Slugfest)

A **3-round word-boxing match** against a seeded sparring partner. Each round is a timed
mini-game (45s) drawn from a skill-spread fight card; your score becomes **damage** to your
rival's **health bar** (and theirs to yours). Win rounds to drain their HP — a dominant round is
a **KNOCKDOWN**, emptying the bar is a **KO**. If it goes the distance, the higher remaining HP
wins, and close fights get a **judges'-card reveal** (Technician · Brawler · Stats →
unanimous/split/draw). The boxing scoring math (`backend/engine/boxing.mjs`: `resolveBout` +
`boxingCard`) runs hidden behind the bars — design rationale in the vault's `bout-design.md` and
`02_reference/2026-06-14-mobile-boxing-game-rules.md`.

## The mini-games

**Thirteen** mini-games rotate on a shared, seed-derived board, across four interaction styles:

*Trace a word along adjacent tiles:*
- **Word Hunt** — find as many valid words as you can before the 60s timer.
- **Snake** — trace one long word along a single connected path; longest wins.
- **Vowel Famine** — only words using at most two vowels count.
- **Bingo Lines** — cover a full row or column with your words for a bonus.
- **Knockout** 🥊 — trace a word and it shatters; tiles drop, fresh letters fall in, chain combos for a KO multiplier.

*Reshape the grid, then hunt:*
- **Jab Swap** 🥊 — swap up to 3 pairs of tiles, then hunt.
- **Roll With It** 🥊 — slide rows/columns (they wrap) up to 4 times, then hunt.
- **Bob & Weave** 🥊 — rotate 2×2 blocks up to 4 times, then hunt.
- **Anagram Anchors** 🥊 — reorder the tiles in each row into a 5-letter word.

*Build a word from any letters:*
- **Longest Word** — spell the single longest valid word.
- **Ladder** — climb a chain of words, each one letter longer than the last.
- **Trivia Spell** — read the clue, spell the answer from the board.
- **Trivia Sprint** — five quick clues in a row, against the clock.

Tap tiles to build/trace a word and **Submit** to score. Grid-manipulation games show a
**Mode: Arrange / Hunt** toggle (plus row/col + direction controls where relevant) — reshape
the board within your move budget, then switch to Hunt. Best scores per mini-game are saved locally.

## Playtest mode

This build runs as a **playtest harness**: it serves the 13 modes in a **random order**
(a shuffled bag, so you see every mode before any repeats), each on a fresh board. After
every mode you're asked to rate it — **🥊 love / 👍 good / 😐 meh / 👎 nope** — with an
optional one-line note. Rating it logs your feedback and serves the next random mode;
**Skip mode →** moves on without rating.

Feedback is stored in your browser (`localStorage`) and exports as JSON on demand via
**📋 Export feedback** (clipboard + `jabber-jawbreaker-feedback.json` download, with a per-mode
summary). When the Supabase sink is configured (below), each rating is **also sent straight to
your `feedback` table** in real time — the header shows `↑live` when the sink is active.

### Wiring feedback to Supabase (auto-collect)

So feedback lands in your own database instead of needing manual export:

1. In your Supabase project's **SQL editor**, run `backend/migrations/004_feedback.sql`
   (after `001`–`003` if you haven't), then `006_genericize.sql` — together they create a
   shared `feedback` table whose RLS allows **anonymous INSERT only** (playtesters can
   submit, but the table is **not readable** through the public API) and tag each row with a
   `game` slug so one **Games** project serves every game. See `backend/SHARED-BACKEND.md`.
2. In `app.mjs`, fill the `FEEDBACK` config with your **Project URL**, **anon public key**
   (Settings → API) and your **`game`** slug. The anon key is safe to ship publicly — RLS is
   what protects the data.
3. Push. Ratings now flow into your table as they happen (with a random per-browser
   `client_id`, the score, seed and user-agent — no personal data).

*Optional:* add a Supabase **Database Webhook** on `feedback` insert → email/Slack to get
pinged on every submission.

## Run locally

No build step, no dependencies. Serve the repo root (the engine imports + the ENABLE
dictionary are resolved relative to it):

```
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Enabling GitHub Pages

The site deploys automatically via GitHub Actions (`.github/workflows/deploy-pages.yml`)
on every push to `main`. To turn it on once:

1. Merge this branch into `main`.
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The next push to `main` (or a manual *Run workflow*) publishes the site.

## What's here

```
index.html              entry point (board UI)
app.mjs                 front-end game loop
online.mjs              optional Supabase score-submission adapter (off by default)
backend/engine/         pure, dependency-free ESM game engine (board + mini-games + standings)
backend/data/           ENABLE word dictionary
```

This is a static export of the `web-v2/` prototype from the ConductiveOS vault
(`07_projects/jabber-jawbreaker/`), which remains the canonical source. The game runs
**solo out of the box**; async multiplayer (Supabase) is configured via `CONFIG` in
`app.mjs` and is not enabled here.

#LLM-generated
