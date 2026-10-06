-- ============================================================
-- CRWNBLOG — migration 0002
-- New desks (Football, Film & Screen) + structured film reviews
-- ============================================================
-- RUN THIS in: Supabase Dashboard > SQL Editor > New query > Run
--
-- Safe to run more than once. Every statement is idempotent.
-- Fresh installs don't need this — schema.sql already contains it.
--
-- Why this file exists: `posts.category_slug` is a FOREIGN KEY to
-- `public.categories(slug)`. Adding a desk to src/lib/categories.ts alone will
-- make the write form reject submissions ("Pick a valid section.") or fail the
-- insert outright, until the row below exists in your live database.
-- ============================================================

-- ---------- 1. New desks ----------
insert into public.categories (slug, name, blurb, accent) values
  ('football', 'Football',      'Matches, transfers, tactics and the business of the game.', '#8c5a1f'),
  ('movies',   'Film & Screen', 'Reviews and recommendations, rated out of ten.',            '#4a3a63')
on conflict (slug) do update
  set name   = excluded.name,
      blurb  = excluded.blurb,
      accent = excluded.accent;

-- ---------- 2. Re-ink the existing desks to the broadsheet palette ----------
update public.categories set accent = '#1f4e5f' where slug = 'cyber';
update public.categories set accent = '#3d5a3d' where slug = 'tech';
update public.categories set accent = '#7b2d26' where slug = 'celebrity';

-- ---------- 3. Desk kind: 'review' desks collect rating / year / poster ----------
alter table public.categories
  add column if not exists kind text not null default 'news';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'categories_kind_check') then
    alter table public.categories
      add constraint categories_kind_check check (kind in ('news', 'review'));
  end if;
end $$;

update public.categories set kind = 'review' where slug = 'movies';
update public.categories set kind = 'news'   where slug <> 'movies';

-- ---------- 4. Review columns on posts ----------
alter table public.posts
  add column if not exists poster_url   text,
  add column if not exists rating       numeric(3,1),
  add column if not exists release_year int;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'posts_poster_url_check') then
    alter table public.posts add constraint posts_poster_url_check
      check (poster_url is null or (char_length(poster_url) <= 2048 and poster_url ~* '^https?://'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'posts_rating_range') then
    alter table public.posts add constraint posts_rating_range
      check (rating is null or (rating >= 0 and rating <= 10));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'posts_release_year_range') then
    alter table public.posts add constraint posts_release_year_range
      check (release_year is null or (release_year between 1888 and 2100));
  end if;
end $$;

-- ---------- 5. Defence in depth ----------
-- The server action already strips review metadata for non-review desks, but the
-- database should not rely on the app behaving. This trigger reads `categories.kind`,
-- so adding a second review desk later needs no change here.
create or replace function public.normalize_review_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.categories c
    where c.slug = new.category_slug and c.kind = 'review'
  ) then
    new.rating       := null;
    new.release_year := null;
    new.poster_url   := null;
  end if;
  return new;
end; $$;

drop trigger if exists trg_normalize_review_fields on public.posts;
create trigger trg_normalize_review_fields
  before insert or update on public.posts
  for each row execute function public.normalize_review_fields();

-- ---------- 6. Verify ----------
-- select slug, name, kind, accent from public.categories order by slug;
-- select column_name, data_type from information_schema.columns
--   where table_schema = 'public' and table_name = 'posts'
--     and column_name in ('poster_url','rating','release_year');
