// Jabber Jawbreaker v0.2 — front-end. Renders the shared seeded board and plays the
// three mini-games, scoring via the backend engine. Solo by default; fill CONFIG to
// submit to Supabase (uses ./online.mjs, which loads supabase-js from a CDN).  #LLM-generated
import { boardForMatch, minigameForRound } from "./backend/engine/grid.mjs";
import { MINIGAMES } from "./backend/engine/minigames/index.mjs";
import { duelStandings } from "./backend/engine/standings.mjs";
import * as online from "./online.mjs";

// ----- config: leave blank for solo; fill all four to go online -----
const CONFIG = { supabaseUrl: "", supabaseAnonKey: "", matchId: "", seed: 20260613 };
const ONLINE = !!(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey && CONFIG.matchId);
const PROD = { minWords: 20, minMaxLen: 6, minLongest: 7 };

const $ = (id) => document.getElementById(id);
const S = { dict: null, prefixes: null, seed: CONFIG.seed, round: 0, board: null,
  game: null, prompt: {}, sel: [], words: [], score: 0, start: 0, timerId: null, ended: false };

// ---------- boot ----------
(async function boot() {
  const res = await fetch("./backend/data/enable1.txt");
  const text = await res.text();
  const words = text.toUpperCase().split(/\r?\n/).filter((w) => w.length >= 3 && w.length <= 15 && /^[A-Z]+$/.test(w));
  S.dict = new Set(words);
  const { buildPrefixSet } = await import("./backend/engine/grid.mjs");
  S.prefixes = buildPrefixSet(S.dict);
  if (ONLINE) { try { await online.init(CONFIG); $("mode").textContent = "online"; } catch (e) { console.warn(e); } }
  $("load").style.display = "none";
  wire();
  newRound(S.seed, 0);
})();

// ---------- round lifecycle ----------
function newRound(seed, round) {
  S.seed = seed; S.round = round;
  S.board = boardForMatch(seed, round, S.dict, { ...PROD, prefixes: S.prefixes });
  S.game = MINIGAMES[S.board.minigame];
  S.prompt = S.game.setup(S.board, seed) || {};
  S.sel = []; S.words = []; S.score = 0; S.ended = false; S.start = Date.now();
  clearInterval(S.timerId); S.timerId = null;
  $("overlay").classList.remove("show");
  if (S.game.id === "word_hunt") startTimer(60);
  else $("timer").textContent = S.game.id === "trivia_spell" ? "0s" : "—";
  render();
}

function startTimer(secs) {
  const end = Date.now() + secs * 1000;
  S.timerId = setInterval(() => {
    const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    $("timer").textContent = left + "s";
    if (left <= 0) { clearInterval(S.timerId); endRound(); }
  }, 250);
}

// ---------- rendering ----------
function render() {
  $("gtitle").firstChild.textContent = S.game.label + " ";
  $("gpill").textContent = S.board.fertile ? "shared board" : "fallback";
  $("ginstr").textContent = S.game.instructions;
  const isTrivia = S.game.id === "trivia_spell";
  $("clue").style.display = isTrivia ? "block" : "none";
  if (isTrivia) $("clue").textContent = `“${S.prompt.clue}”  (${S.prompt.answerLen} letters)`;
  $("score").textContent = S.score;
  $("meta").textContent = "R" + (S.round + 1); $("metaL").textContent = S.board.minigame.replace("_", " ");
  if (isTrivia && !S.ended) $("timer").textContent = Math.round((Date.now() - S.start) / 1000) + "s";

  $("current").textContent = S.sel.map((i) => S.board.letters[i]).join("");
  const b = $("board"); b.innerHTML = "";
  S.board.letters.forEach((ch, i) => {
    const el = document.createElement("div");
    const ord = S.sel.indexOf(i);
    el.className = "cell" + (ord >= 0 ? " sel" : "");
    el.innerHTML = ch + (ord >= 0 ? `<span class="ord">${ord + 1}</span>` : "");
    el.onclick = () => tap(i);
    b.appendChild(el);
  });
  $("act").textContent = S.game.id === "word_hunt" ? "Submit word" : "Submit";
  $("act").disabled = S.ended || S.sel.length === 0;
  const f = $("found"); f.innerHTML = "";
  for (const w of [...S.words].reverse())
    f.appendChild(Object.assign(document.createElement("span"), { className: "chip", innerHTML: w }));
}

// ---------- interaction ----------
const adjacent = (a, b) => a !== b && Math.abs(((a / 5) | 0) - ((b / 5) | 0)) <= 1 && Math.abs((a % 5) - (b % 5)) <= 1;

function tap(i) {
  if (S.ended) return;
  const pos = S.sel.indexOf(i);
  if (pos >= 0) { if (pos === S.sel.length - 1) S.sel.pop(); return render(); } // undo last
  if (S.game.id === "word_hunt" && S.sel.length && !adjacent(S.sel[S.sel.length - 1], i))
    return toast("Letters must be adjacent", true);
  S.sel.push(i); render();
}

function act() {
  if (S.sel.length === 0) return;
  const word = S.sel.map((i) => S.board.letters[i]).join("");
  const ctx = { board: S.board, dict: S.dict, prompt: S.prompt };
  if (S.game.id === "word_hunt") {
    if (S.words.includes(word)) { toast("Already found", true); S.sel = []; return render(); }
    const trial = S.game.score({ words: [...S.words, word] }, ctx);
    if (trial.detail.found.some((x) => x.w === word)) {
      S.words.push(word); S.score = trial.points; toast("+" + (trial.detail.found.find((x) => x.w === word).pts));
    } else toast("Not a valid word here", true);
    S.sel = []; render();
  } else if (S.game.id === "longest_word") {
    const r = S.game.score({ word }, ctx);
    if (!r.valid) { toast(r.detail.reason, true); S.sel = []; return render(); }
    S.score = r.points; endRound();
  } else { // trivia_spell
    const r = S.game.score({ guess: word, timeMs: Date.now() - S.start }, ctx);
    if (!r.valid) { toast("Not it — keep spelling!", true); S.sel = []; return render(); }
    S.score = r.points; endRound();
  }
}

// ---------- end of round ----------
async function endRound() {
  if (S.ended) return;
  S.ended = true; clearInterval(S.timerId);
  const best = Math.max(S.score, +(localStorage.getItem("jj-best-" + S.game.id) || 0));
  localStorage.setItem("jj-best-" + S.game.id, best);
  let standingsHtml = "";
  if (ONLINE) {
    try {
      await online.submit({ matchId: CONFIG.matchId, roundNo: S.round, minigame: S.game.id,
        score: S.score, detail: { words: S.words } });
      const rows = duelStandings(await online.standings(CONFIG.matchId));
      standingsHtml = `<div class="sub">Duel Ladder:<br>${rows.map((r, i) =>
        `${i + 1}. ${r.user_id.slice(0, 6)} — ${r.roundWins}W / ${r.points}pts`).join("<br>")}</div>`;
    } catch (e) { standingsHtml = `<div class="sub">（offline — score saved locally）</div>`; }
  }
  const ov = $("overlay");
  ov.innerHTML = `
    <h2>${S.game.label} — done</h2>
    <div class="big">${S.score}</div>
    <div class="sub">Best ${S.game.label}: ${best}${S.game.id === "trivia_spell" ? "" : ""}</div>
    ${standingsHtml}
    <button class="btn primary" id="ovNext" style="max-width:240px">Next round →</button>
    <button class="btn ghost" id="ovShare" style="max-width:240px">📋 Share</button>`;
  ov.classList.add("show");
  $("ovNext").onclick = () => newRound(S.seed, S.round + 1);
  $("ovShare").onclick = () => {
    navigator.clipboard?.writeText(`Jabber Jawbreaker — ${S.game.label}: ${S.score} 🥊`);
    toast("Copied!");
  };
  render();
}

// ---------- misc ----------
let tt = null;
function toast(msg, bad) {
  const el = $("toast"); el.textContent = msg; el.className = "toast show" + (bad ? " bad" : "");
  clearTimeout(tt); tt = setTimeout(() => (el.className = "toast"), 1100);
}
function wire() {
  $("act").onclick = act;
  $("clear").onclick = () => { S.sel = []; render(); };
  $("next").onclick = () => newRound(S.seed, S.round + 1);
  $("newseed").onclick = () => newRound((Math.random() * 2 ** 31) | 0, 0);
}
