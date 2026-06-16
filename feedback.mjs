// Optional feedback sink — posts playtest ratings to the shared "Games" Neon project's
// Data API (PostgREST), and (optionally) pings the Discord notify-relay. Anonymous
// insert-only: no sign-in, nothing readable client-side. Configure with the Data API
// URL, this game's slug, and (optionally) the relay URL. See backend/neon/.
let endpoint = null;
let game = null;
let notifyUrl = null;

export async function init({ dataApiUrl, game: g, notifyUrl: n }) {
  if (!dataApiUrl) throw new Error("feedback sink: dataApiUrl required");
  endpoint = dataApiUrl.replace(/\/+$/, "") + "/feedback";
  game = g || null;
  notifyUrl = n || null;
  return true;
}

export async function submit(row) {
  if (!endpoint) throw new Error("feedback sink not initialised");
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...row, game }),
  });
  if (!res.ok) throw new Error("feedback insert failed: HTTP " + res.status);
  if (notifyUrl) ping(row).catch(() => {});   // fire-and-forget Discord ping (never blocks feedback)
}

function ping(row) {
  const r = row.rating || 0;
  const stars = "★".repeat(r) + "☆".repeat(4 - r);
  const title = `🥊 ${row.label || row.minigame} — ${stars} (${row.rating ?? "—"}/4) · score ${row.score ?? "—"}`;
  return fetch(notifyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: game, event: "feedback", title, text: row.note ? `> ${row.note}` : "" }),
  });
}
