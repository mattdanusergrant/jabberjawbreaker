# Jabber Jawbreaker

A mobile **5×5 letter-grid party game** — one shared board, a rotating roster of word
mini-games. This repo hosts the **single-player v0.2 prototype** as a static site on
GitHub Pages. Boxing theme (jab + jabber + jawbreaker).

## Play

Once GitHub Pages is enabled (see below), the game lives at:

```
https://mattdanusergrant.github.io/jabberjawbreaker/
```

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
the board within your move budget, then switch to Hunt. **Next round →** rotates the mini-game,
**New board** reseeds. Best scores per mini-game are saved locally.

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
