-- Jabber Jawbreaker → shared "Games" backend — genericize the project so EVERY game reuses
-- ONE Supabase project (free tier = 2 projects total: one Games, one Apps).  #LLM-generated
-- Apply after 001→005, in the SQL editor of the project you're keeping as your "Games"
-- project. Each game is identified by a short `game` slug; jabber-jawbreaker is the first
-- tenant. Existing rows backfill to 'jabber-jawbreaker'. Safe, non-destructive, re-runnable.

-- ---- matches: tag each competition with its game ----
alter table public.matches add column if not exists game text not null default 'jabber-jawbreaker';
alter table public.matches alter column game drop default;          -- future games pass their slug
create index if not exists matches_game_idx on public.matches(game);

-- ---- feedback: ONE shared playtest table for all games, tagged by game ----
alter table public.feedback add column if not exists game text not null default 'jabber-jawbreaker';
alter table public.feedback alter column game drop default;
create index if not exists feedback_game_idx on public.feedback(game);

-- keep the anon-INSERT-only policy (no read-back); also bound the new slug
alter policy "anyone may submit feedback" on public.feedback
  with check (
    char_length(game) <= 40
    and char_length(minigame) <= 40
    and (rating is null or rating between 1 and 4)
    and char_length(coalesce(note, '')) <= 500
  );

-- ---- create_match now requires the game slug (replaces the old 2-arg version) ----
drop function if exists public.create_match(text, jsonb);
create or replace function public.create_match(p_game text,
                                               p_mode text default 'duel_ladder',
                                               p_config jsonb default '{}'::jsonb)
returns public.matches language plpgsql security definer set search_path = public as $$
declare m public.matches;
begin
  if p_game is null or char_length(p_game) = 0 then
    raise exception 'game slug is required';
  end if;
  insert into public.matches(game, mode, config, created_by)
    values (p_game, coalesce(p_mode,'duel_ladder'), coalesce(p_config,'{}'::jsonb), auth.uid())
    returning * into m;
  insert into public.match_members(match_id, user_id) values (m.id, auth.uid());
  return m;
end; $$;

-- profiles + scores are intentionally NOT tagged: profiles are one shared identity per
-- player across all your games, and scores derive their game from their parent match.

-- NOTE (optional): to show the game name in the Discord feedback ping, edit
-- notify_feedback_discord()'s `msg` to prepend `new.game`, then re-run 005_notify_discord.sql
-- WITH your real webhook URL pasted in (re-running 005 resets the webhook placeholder).
