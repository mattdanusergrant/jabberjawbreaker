// Optional feedback sink — pings the Discord notify-relay on each rating, and (best-effort)
// stores the row in the shared "Games" Neon project's Data API. The Discord ping is
// INDEPENDENT of the Neon write, so notifications never depend on the store succeeding.
// Configure with the relay URL, this game's slug, and the Data API URL. See backend/neon/.
let endpoint = null;
let game = null;
let notifyUrl = null;

export async function init({ dataApiUrl, game: g, notifyUrl: n }) {
  endpoint = dataApiUrl ? dataApiUrl.replace(/\/+$/, "") + "/feedback" : null;
  game = g || null;
  notifyUrl = n || null;
  return true;
}

export async function submit(row) {
  const payload = { ...row, game };
  if (notifyUrl) ping(payload).catch((e) => console.warn("discord ping failed:", e));   // notify (independent)
  if (endpoint) {                                                                        // store in Neon (best-effort)
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) console.warn("feedback store failed (Neon): HTTP " + res.status);
    } catch (e) { console.warn("feedback store error (Neon):", e); }
  }
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
