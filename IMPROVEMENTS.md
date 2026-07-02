# Improvement Plan — jabberjawbreaker

> Generated 2026-07-02 from a full 12-repo portfolio audit (Claude Code session).
> Companion career report: ConductiveOS vault, `09_personal/2026-07-02-life-audit-and-career-plan.md`.

**What this is:** A mobile-first "word boxing" web game — 13 word mini-games on a shared seed-derived 5x5 board plus a 3-round HP-bar bout mode — shipped as a zero-dependency static PWA on GitHub Pages with a Supabase-backed playtest feedback pipeline.

**Stack:** Vanilla JavaScript (ES modules, no build step, no dependencies), HTML/CSS mobile-first DOM UI, Supabase (Postgres, RLS policies, pg_net, security-definer triggers), supabase-js v2 via esm.sh CDN, GitHub Actions (Pages deploy workflow), PWA (manifest.webmanifest, installable; no service worker), localStorage persistence, ENABLE word dictionary (172k words) · **Maturity:** dormant · **Live:** https://mattdanusergrant.github.io/jabberjawbreaker/
**Size:** ~630 lines JS/HTML at HEAD; ~1.4k at peak including the ~730-line pure game engine deleted in the last commit (plus a 173k-line dictionary data file, also deleted)

## What's genuinely good here

- Deterministic, state-free multiplayer architecture: board + mini-game are derived entirely from (matchSeed, roundNo) via mulberry32 PRNG + FNV-style subSeed (backend/engine/grid.mjs at fd60a2a^), so a server would only ever store a scores ledger, never game state — a genuinely sophisticated design insight, clearly articulated in code comments
- Clean engine/frontend separation: pure dependency-free ESM engine with a declarative mini-game registry (each game exposes interaction flags + a pure score(sub, ctx) function), and app.mjs routes all input off those flags — 13 games handled by one 463-line frontend
- Original game-design math in backend/engine/boxing.mjs (history): 10-point-must scoring scaled by score-share, three judge personas (Technician/Brawler/Statistician), KO/TKO stoppage logic, split/unanimous-decision reveal — pure and unit-testable
- Security-literate Supabase usage: feedback table with insert-only RLS for anon (length checks enforced inside the policy), anon key correctly treated as publishable, Discord webhook URL kept server-side in a security-definer pg_net trigger (migrations 004/005 in history)
- Real product instrumentation: the playtest harness serves modes as a shuffled bag, collects 4-point ratings + notes, keeps a local copy, streams live to Supabase with graceful degradation, and exports JSON with per-mode averages (recordFeedback/exportFeedback in app.mjs)
- Professional-grade commit messages and handoff comments throughout — the repo reads like documentation of its own reasoning, including reverts
- Shipped live on day one (initial commit to deployed Pages site on 2026-06-13), 23 commits of visible iteration over 10 days


## Issues found

- The live deploy is broken: commit fd60a2a removed backend/ but app.mjs lines 6-10 still import ./backend/engine/{grid,minigames/index,standings,manip,boxing}.mjs and boot() fetches ./backend/data/enable1.txt; deploy-pages.yml redeployed on that push, and the live site now 404s backend/engine/grid.mjs — the game never gets past the 'Lacing up…' loading screen (verified via curl)
- README.md is stale: the 'What's here' section and the feedback-wiring instructions reference backend/engine/, backend/data/, and backend/migrations/004-005 that no longer exist in the repo, and cite private vault paths (bout-design.md) readers can't access
- Zero tests ever, and CI is deploy-only: .github/workflows/deploy-pages.yml ships whatever is on main with no smoke check, which is exactly how a build with missing modules went live — while the sibling repo ronin-survivor already has a working smoke-test + CI pattern to copy
- PWA is manifest-only: no service worker, so an entirely client-side game (perfect offline candidate once the dictionary is cached) has no offline support
- The backend was 'moved out of the public frontend repo' with no pointer to where it went; the best code in the project is now only reachable via git archaeology at fd60a2a^
- online.mjs multiplayer path is dead code: CONFIG is blank, and even if filled it would crash at HEAD because the engine imports fail; duelStandings/standings flow has never been exercised
- Backend decision churn: Neon -> Supabase -> Neon -> Supabase across four commits in 3 days (af3a0a6, e4d9a97, bfc350c, 0c77b03, 8b321b0) — well-documented, but signals thrash
- Prototype-scale frontend smells in app.mjs: one global mutable state bag S, overlay UIs built via innerHTML template strings, inline onload/onerror handlers in showMenu — acceptable for a prototype but not showcase-grade


## Ranked improvements

### 1. Fix the broken live site (restore or re-point the engine)  `impact 5/5 · effort S`

**Why:** The README's headline link — and any portfolio link — currently opens a game that hangs on the loading screen; a broken live demo is actively worse than none. Everything else is secondary to this.

**How:** Either `git revert fd60a2a` to restore backend/engine/, backend/data/enable1.txt and the migrations (simplest — it's a static site, the 'backend' folder is just client-side ESM), or vendor the engine files back under engine/ and update the six import paths in app.mjs (lines 6-10, 35) and the fetch in boot() (line 31). Push to main so deploy-pages.yml republishes.

**Career angle:** Directly repairs the shipped-product signal; a recruiter clicking the live link currently sees a hang.

### 2. Add a Node smoke test and gate the Pages deploy on it  `impact 5/5 · effort M`

**Why:** A missing-module build shipped to production because nothing checks that app.mjs's import graph resolves or that the engine scores sanely. The engine is pure ESM, so a dependency-free test is trivial — and this exact failure becomes impossible.

**How:** Port ronin-survivor's test/smoke.js pattern: a Node script that imports boardForMatch/buildPrefixSet from engine/grid.mjs, runs every entry in MINIGAMES through setup+score on a seeded board, and asserts resolveBout/boxingCard invariants (HP in [0,100], KO implies stoppage, judges sum to 10-point-must totals). Add .github/workflows/test.yml running `node test/smoke.js` on push/PR, and make the deploy job in deploy-pages.yml `needs: test`.

**Career angle:** Demonstrates CI discipline and testing of pure logic — the top hygiene gap a hiring manager would spot across his repos.

### 3. README truth-pass + portfolio-grade 'How it works' section  `impact 4/5 · effort S`

**Why:** The README documents deleted files and private vault paths, and buries the repo's two most hire-worthy ideas (deterministic seed-derived rounds; insert-only RLS feedback pipeline) in passing mentions.

**How:** Rewrite 'What's here' to match the actual tree; remove vault references or link public equivalents; add 2-3 phone screenshots or a GIF of the bout mode; add an Architecture section explaining (1) why (matchSeed, roundNo) -> identical boards makes async PvP state-free (quote the grid.mjs header), (2) the anon-insert-only RLS + pg_net Discord trigger design from migrations 004/005, and (3) the playtest-harness feedback loop. Note explicitly that the engine lives at fd60a2a^ if not restored.

**Career angle:** Pure portfolio play: turns a confusing dormant repo into a legible case study of systems thinking and backend security design.

### 4. Ship the async PvP bout it was architected for  `impact 4/5 · effort L`

**Why:** The entire deterministic-seed design exists so two players can play identical rounds 'blind' and be adjudicated from score pairs — resolveBout already takes {a,b} rounds, online.mjs already inserts/reads a scores table, and opponentScore() in app.mjs (line 100) is explicitly a placeholder ('Real async PvP later swaps this for the opponent's actual rows'). This is the difference between a prototype and a game people can share.

**How:** Add a matches table + RLS to the Supabase Games project; generate a match link containing matchId+seed; in boutRoundEnd() submit via online.submit() and, when the opponent's row for that roundIdx exists, feed their real score into b.rounds instead of opponentScore(); poll or use supabase realtime for 'your rival has punched back' state on the menu.

**Career angle:** A live async-multiplayer word game with a state-free server is a standout full-stack portfolio piece and the only path to real users/monetization.

### 5. Publish the playtest results as a design writeup  `impact 4/5 · effort M`

**Why:** The repo's most distinctive feature is that it is a playtest instrument — 13 modes, shuffled-bag serving, live ratings into Postgres. The data exists in his Supabase feedback table; the analysis is the artifact game studios actually hire designers for.

**How:** Export the feedback table, compute per-mode n/avg/notes (the summary logic already exists in exportFeedback() in app.mjs), and write results.md: which of the 13 modes won, which got cut, and what the ratings changed about the bout fight-card (SKILL classes in app.mjs line 84). Cross-post to mattdanusergrant.com via the vault's case-study-forge flow.

**Career angle:** Evidence of data-informed design process — directly marketable for game design and product roles.

### 6. Add a service worker for full offline play  `impact 3/5 · effort S`

**Why:** The game is 100% client-side after load; caching the app shell + the ~1.7MB dictionary makes the installed PWA work offline, which is the whole point of the manifest that's already there.

**How:** Add sw.js with cache-first for index.html, app.mjs, online.mjs, feedback.mjs, assets/*, and engine/ + enable1.txt (network-first for the Supabase POSTs is automatic since the SW only caches GETs); register it in index.html; bump a CACHE_VERSION string on deploy.

**Career angle:** Rounds out the PWA story; minor but visible polish.

### 7. Extract the pure engine into a reusable, versioned module  `impact 3/5 · effort M`

**Why:** The engine is the best code in the project and currently unreachable; other word-game ideas (and future reboots — the last commit says the project 'will be rebooted from scratch if resumed') should not re-derive it.

**How:** Restore the engine from fd60a2a^ into its own repo or an engine/ package (grid.mjs, manip.mjs, boxing.mjs, minigames/, standings.mjs are already pure ESM with zero deps); give it its own smoke tests and a README; have jabberjawbreaker consume it as a git submodule or vendored copy with a pinned version note. This also fixes the 'backend moved somewhere unstated' dead end.

**Career angle:** Shows library/API design and code-reuse instincts beyond one-off prototypes.


## Skills this repo proves (for hiring managers)

- Deterministic-simulation architecture: seeded PRNG (mulberry32) + stable sub-seeding to make async multiplayer state-free — the server-stores-only-a-ledger insight is staff-level systems thinking
- Postgres/Supabase security design: row-level security with insert-only anon policies (validation constraints inside the policy), security-definer triggers, pg_net server-side webhooks, correct public-anon-key threat modeling
- Zero-dependency frontend engineering: 13 interaction-distinct games driven by one declarative registry and a flag-routing input loop in 463 lines, mobile-first CSS with safe-area insets, no framework
- Game systems/scoring design: adapting real boxing's 10-point-must system with multi-judge personas and stoppage rules into deterministic, testable math
- Product instrumentation and playtest ops: end-to-end feedback pipeline (client rating UI -> RLS table -> Discord notification) with offline fallback and JSON export
- CI/CD with GitHub Actions and GitHub Pages (deploy-on-push with concurrency control)
- Rapid scoping: prototype to deployed 13-mode playtest harness with bout mode in 10 days
- AI-assisted development workflow: #LLM-generated tagging and Avatar-prefixed commits show a disciplined, auditable human+LLM pipeline


## Career signals

- Ships fast and publicly: initial commit to live GitHub Pages deploy same-day (2026-06-13), then 23 well-messaged commits in 10 days — strong bias-to-action signal
- Commit messages and code comments are handoff-quality (reverts explain reasoning, headers explain architecture) — reads like someone who has internalized working on teams/with agents
- Security instincts are above prototype grade (RLS policies with in-policy validation, secrets kept server-side) — a differentiator for full-stack/backend roles
- Negative signal to fix before showing anyone: the live demo is broken at HEAD and the final commit message says the project 'will be rebooted from scratch if resumed' — a hiring manager clicking through sees an abandoned, non-booting app
- No tests or lint anywhere in the repo's history, and CI exists only to deploy — inconsistent with ronin-survivor's smoke-test discipline, suggesting hygiene depends on the session rather than habit
- Backend flip-flopping (Neon<->Supabase four times in 3 days) shows exploration but also unfinished decision-making; the writeups partially redeem it
- The deterministic-rounds + ledger-only-server design, if surfaced in a README/blog post, is interview-story material for distributed-systems and game-backend questions
- Transparent LLM-assisted authorship (#LLM-generated tags) is a genuine asset for AI-native engineering roles if framed as a workflow, not a disclaimer


## Monetization angles

- Finish async PvP + a daily shared-seed challenge (everyone plays the same board, Wordle-style shareable result card with the judges' scorecard) — the deterministic-seed architecture makes this nearly free to build and it is the viral loop word games monetize on
- Wrap the PWA with Capacitor for iOS/Android app stores: ad-supported free bouts + one-time 'championship' unlock (cosmetic gloves, extra bot personalities, longer fight cards)
- Package the playtest pipeline (harness UI + RLS feedback migrations + Discord trigger) as a paid template or Gumroad kit for indie devs — it is already generic and documented
- License the format: 13-mini-game rotating party structure with boxing adjudication is a pitchable mobile/party game design doc, strengthened by real playtest ratings data


## Standout artifacts to show off

- backend/engine/boxing.mjs (git history, fd60a2a^) — pure bout adjudication: 10-point-must with score-share tiers, three judge personas, KO/TKO stoppage scan, championship-rounds tiebreak; genuinely original, testable design math
- backend/engine/grid.mjs (git history, fd60a2a^) — deterministic board derivation with the state-free multiplayer rationale written in the header; mulberry32 + subSeed + DFS wordPath in 179 clean lines
- backend/migrations/004_feedback.sql + 005_notify_discord.sql (git history, fd60a2a^) — insert-only RLS with validation inside the policy, and a security-definer pg_net trigger that keeps the Discord webhook server-side; textbook Supabase security
- app.mjs — one 463-line frontend routing 13 interaction-distinct mini-games plus a full bout mode off declarative registry flags
- The playtest harness flow in app.mjs (recordFeedback/exportFeedback/nextMode) — end-to-end product instrumentation with live-sink + local-fallback + per-mode summary export


## Cross-repo connections

- Port ronin-survivor's test/smoke.js + .github/workflows/test.yml pattern here verbatim — same no-build vanilla-JS philosophy, same author, and it would have caught the broken deploy; conversely, jabberjawbreaker's deploy-pages.yml concurrency setup matches ronin-survivor's Pages flow
- The hardcoded Supabase 'Games' project (URL in app.mjs line 19) plus migrations 004/005 is a ready-made shared telemetry/feedback backend for the other game repos (fortkickass, cartomancy, dankomphalos, mustdesigngames prototypes) — commit af3a0a6 already attempted exactly this genericization before it was reverted
- Extract the pure ESM engine (grid.mjs dictionary/prefix-set/path-finding, manip.mjs, boxing.mjs) as a shared word/game utility library — any future word-adjacent prototype (invisible-ink, keepingcadence) can reuse the ENABLE dictionary loader and wordPath DFS
- The ConductiveOS vault already holds this project's design docs (07_projects/jabber-jawbreaker/, bout-design.md, the name-tournament run) — use the vault's case-study-forge skill to publish an anonymized design case study of the 13-mode playtest onto mattdanusergrant (the personal-site repo), turning a dormant repo into portfolio content
- The pg_net Discord-notification trigger pattern (005_notify_discord.sql in history) is directly reusable for daily-dividend-lab alerts or any repo needing zero-server event notifications
- The playtest-harness UX (shuffled-bag serving + rating overlay + live sink) is a reusable 'indie playtest kit' that mustdesigngames could package as a template or article series


#LLM-generated
