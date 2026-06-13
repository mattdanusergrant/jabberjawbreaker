# Jabber Jawbreaker

A mobile **5×5 letter-grid party game** — one shared board, a rotating roster of word
mini-games. This repo hosts the **single-player v0.2 prototype** as a static site on
GitHub Pages. Boxing theme (jab + jabber + jawbreaker).

## Play

Once GitHub Pages is enabled (see below), the game lives at:

```
https://mattdanusergrant.github.io/jabberjawbreaker/
```

Three mini-games rotate on a shared, seed-derived board:

- **Word Hunt** — find as many valid words as you can on adjacent tiles before the 60s timer.
- **Longest Word** — spell the single longest valid word you can from the board.
- **Trivia Spell** — read the clue, then spell the answer from the board's letters.

Tap tiles to build a word, **Submit** to score, **Next round →** for the next mini-game,
**New board** for a fresh random seed. Best scores per mini-game are saved locally.

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
