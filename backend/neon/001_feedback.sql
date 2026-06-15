-- Ludus (Games) — Neon shared backend.  #LLM-generated
-- Anonymous playtest feedback, one table for every game, tagged by `game`.
-- Access: Data API (PostgREST). Unauthenticated playtesters INSERT via the `anonymous` role;
-- RLS allows INSERT only (no read-back) — you read in the SQL Editor / dashboard.
-- Run once in the Ludus project's SQL Editor.

create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  game       text not null,                          -- jabber-jawbreaker, ...
  minigame   text not null,
  label      text,
  rating     int check (rating between 1 and 4),     -- 4 love · 3 good · 2 meh · 1 nope
  note       text,
  score      int,
  seed       bigint,
  client_id  text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists feedback_game_idx on public.feedback(game);

alter table public.feedback enable row level security;

-- the only thing a client may do: insert a well-formed row (no select/update/delete policy)
create policy "anyone may submit feedback" on public.feedback
  for insert to anonymous, authenticated
  with check (
    char_length(game) <= 40
    and char_length(minigame) <= 40
    and (rating is null or rating between 1 and 4)
    and char_length(coalesce(note, '')) <= 500
  );

-- let the Data API's `anonymous` (and `authenticated`) roles INSERT; RLS gates the row shape.
-- (If your project names the unauthenticated role differently, adjust `anonymous` below.)
grant usage on schema public to anonymous, authenticated;
grant insert on public.feedback to anonymous, authenticated;
