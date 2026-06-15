// Optional feedback sink — inserts playtest ratings into Supabase straight from the
// static page. Insert-only with the public anon key (RLS allows anon INSERT and denies
// SELECT), so there's no sign-in and nothing is readable client-side. The data lands in
// the shared `feedback` table — ONE table for every game in your "Games" project, tagged
// by `game` so each title's feedback stays separable. See migrations/004_feedback.sql +
// 006_genericize.sql.  #LLM-generated
let client = null;
let game = null;

export async function init({ url, anonKey, game: g }) {
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  client = createClient(url, anonKey, { auth: { persistSession: false } });
  game = g || null;
  return client;
}

export async function submit(row) {
  if (!client) throw new Error("feedback sink not initialised");
  const { error } = await client.from("feedback").insert({ ...row, game });
  if (error) throw error;
}
