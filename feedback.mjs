// Optional feedback sink — inserts playtest ratings into Supabase straight from the
// static page. Insert-only with the public anon key (RLS allows anon INSERT and denies
// SELECT), so there's no sign-in and nothing is readable client-side. The data lands in
// your `feedback` table for you to read in the dashboard. See migrations/004_feedback.sql.
// #LLM-generated
let client = null;

export async function init({ url, anonKey }) {
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  client = createClient(url, anonKey, { auth: { persistSession: false } });
  return client;
}

export async function submit(row) {
  if (!client) throw new Error("feedback sink not initialised");
  const { error } = await client.from("feedback").insert(row);
  if (error) throw error;
}
