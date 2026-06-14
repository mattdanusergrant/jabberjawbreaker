-- Jabber Jawbreaker — playtest feedback sink (apply after 001→003).  #LLM-generated
-- Anonymous playtesters INSERT their per-mode ratings straight from the static page
-- using the public anon key. RLS allows anon INSERT only — no SELECT/UPDATE/DELETE — so
-- feedback is write-only from the client and readable only by you (dashboard / service role).

create table public.feedback (
  id         uuid primary key default gen_random_uuid(),
  minigame   text not null,
  label      text,
  rating     int  check (rating between 1 and 4),   -- 4 love · 3 good · 2 meh · 1 nope
  note       text,
  score      int,
  seed       bigint,
  client_id  text,            -- random per-browser id (not PII) to group a tester's runs
  user_agent text,
  created_at timestamptz not null default now()
);
create index on public.feedback(minigame);
create index on public.feedback(created_at);

alter table public.feedback enable row level security;

-- The only thing the client may do: insert a well-formed row. No read-back.
create policy "anyone may submit feedback" on public.feedback
  for insert to anon, authenticated
  with check (
    char_length(minigame) <= 40
    and (rating is null or rating between 1 and 4)
    and char_length(coalesce(note, '')) <= 500
  );
-- (no select/update/delete policies => owner reads via the Supabase dashboard only)
