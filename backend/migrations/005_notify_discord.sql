-- Jabber Jawbreaker — ping a Discord channel on each new feedback row.  #LLM-generated
-- Self-contained: a security-definer AFTER INSERT trigger uses pg_net to POST a Discord-
-- formatted message to your channel webhook. The webhook URL lives ONLY here (server-side
-- in your Supabase project) — never in the public static site. Paste yours below, then run.
-- (Want email instead? Swap net.http_post's target for your mail API — same shape.)

create extension if not exists pg_net;

create or replace function public.notify_feedback_discord()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  -- 👇 PASTE your Discord channel webhook URL (Server → Integrations → Webhooks → New)
  webhook text := 'https://discord.com/api/webhooks/REPLACE_ME';
  r       int  := coalesce(new.rating, 0);
  stars   text := repeat('★', r) || repeat('☆', 4 - r);
  msg     text;
begin
  if webhook is null or webhook like '%REPLACE_ME%' then
    return new;                       -- not configured yet: no-op, never blocks the insert
  end if;
  msg := format(E'🥊 **%s** — %s (%s/4)  · score %s%s',
    coalesce(new.label, new.minigame),
    stars,
    coalesce(new.rating::text, '—'),
    coalesce(new.score::text, '—'),
    case when coalesce(new.note, '') <> '' then E'\n> ' || new.note else '' end);
  perform net.http_post(
    url     := webhook,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := jsonb_build_object('content', msg)
  );
  return new;
end;
$$;

drop trigger if exists feedback_discord on public.feedback;
create trigger feedback_discord
  after insert on public.feedback
  for each row execute function public.notify_feedback_discord();
