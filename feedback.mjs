// Optional feedback sink — posts playtest ratings to the shared "Games" Neon project's
// Data API (PostgREST). Anonymous insert-only: no sign-in, nothing readable client-side.
// Configure with the project's Data API URL + this game's slug. See backend/neon/.
let endpoint = null;
let game = null;

export async function init({ dataApiUrl, game: g }) {
  if (!dataApiUrl) throw new Error("feedback sink: dataApiUrl required");
  endpoint = dataApiUrl.replace(/\/+$/, "") + "/feedback";
  game = g || null;
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
}
