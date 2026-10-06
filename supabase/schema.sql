-- ============================================================
-- CRWNBLOG — Supabase schema (Hardened)
-- Paste this whole file into: Supabase Dashboard > SQL Editor > New query > Run
-- ============================================================

-- ---------- PROFILES ----------
-- One row per auth user. Holds display name + role.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null check (char_length(username) between 3 and 30 and username ~ '^[a-zA-Z0-9_-]+$'),
  bio         text default '' check (char_length(bio) <= 500),
  avatar_url  text check (avatar_url is null or (char_length(avatar_url) <= 2048 and avatar_url ~* '^https?://')),
  role        text not null default 'writer' check (role in ('writer','admin')),
  created_at  timestamptz not null default now()
);

-- ---------- CATEGORIES ----------
create table if not exists public.categories (
  slug  text primary key,
  name  text not null,
  blurb text default '',
  accent text default '#241a12',
  kind  text not null default 'news' check (kind in ('news','review'))
);

-- Existing installs upgrading in place: see migrations/0002_new_desks_and_film_reviews.sql
alter table public.categories add column if not exists kind text not null default 'news';

-- Desk inks mirror src/lib/categories.ts (accent = newsprint, accentDark = walnut shell).
-- NOTE: `on conflict do nothing` will not update desks that already exist — existing
-- installs should run migrations/0002_new_desks_and_film_reviews.sql instead.
insert into public.categories (slug, name, blurb, accent, kind) values
  ('cyber',     'Cyber Discovery', 'Breaches, exploits, threat research and defence.',          '#1f4e5f', 'news'),
  ('tech',      'Tech Discovery',  'New tools, hardware, AI and engineering finds.',            '#3d5a3d', 'news'),
  ('celebrity', 'Celebrity News',  'Culture, entertainment and who did what.',                  '#7b2d26', 'news'),
  ('football',  'Football',        'Matches, transfers, tactics and the business of the game.', '#8c5a1f', 'news'),
  ('movies',    'Film & Screen',   'Reviews and recommendations, rated out of ten.',            '#4a3a63', 'review')
on conflict (slug) do nothing;

-- ---------- POSTS ----------
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.profiles(id) on delete cascade,
  category_slug text not null references public.categories(slug),
  title         text not null check (char_length(title) between 3 and 160),
  slug          text unique not null check (char_length(slug) between 3 and 100 and slug ~ '^[a-z0-9-]+$'),
  excerpt       text default '' check (char_length(excerpt) <= 500),
  body_html     text not null check (char_length(body_html) between 20 and 100000), -- sanitised server-side before insert
  cover_url     text check (cover_url is null or (char_length(cover_url) <= 2048 and cover_url ~* '^https?://')),
  -- Film & Screen review metadata (null for every other desk)
  poster_url    text check (poster_url is null or (char_length(poster_url) <= 2048 and poster_url ~* '^https?://')),
  rating        numeric(3,1) check (rating is null or (rating >= 0 and rating <= 10)),
  release_year  int check (release_year is null or (release_year between 1888 and 2100)),
  status        text not null default 'pending' check (status in ('pending','published','rejected')),
  reject_reason text check (reject_reason is null or char_length(reject_reason) <= 500),
  views         int not null default 0 check (views >= 0),
  created_at    timestamptz not null default now(),
  published_at  timestamptz
);

create index if not exists posts_status_pub_idx on public.posts (status, published_at desc);
create index if not exists posts_cat_idx        on public.posts (category_slug, status);
create index if not exists posts_author_idx     on public.posts (author_id);

-- ---------- COMMENTS ----------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);

-- ============================================================
-- ROW LEVEL SECURITY & PRIVILEGE GUARDS
-- ============================================================
alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.posts      enable row level security;
alter table public.comments   enable row level security;

-- helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

-- helper: count current user's pending posts (for anti-spam cap)
create or replace function public.pending_post_count(p_user uuid)
returns bigint language sql stable security definer set search_path = public as $$
  select count(*) from public.posts where author_id = p_user and status = 'pending';
$$;

-- Guard trigger: prevent non-admins from changing `role` on profiles
create or replace function public.guard_profile_updates()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Allow SQL Editor / service_role (where auth.uid() is null) or existing admins
  if new.role is distinct from old.role then
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'Only administrators can change user roles.';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists trg_guard_profile_updates on public.profiles;
create trigger trg_guard_profile_updates
  before update on public.profiles
  for each row execute function public.guard_profile_updates();

-- Guard trigger: prevent non-admin authors from self-publishing or forging views/timestamps on UPDATE
create or replace function public.guard_post_updates()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.author_id is distinct from old.author_id then
      raise exception 'Cannot change post author.';
    end if;
    if new.views is distinct from old.views then
      raise exception 'Cannot modify post view count directly.';
    end if;
    if new.status <> 'pending' then
      raise exception 'Non-admin edits must remain in pending status for review.';
    end if;
    new.published_at := null;
  end if;
  return new;
end; $$;

drop trigger if exists trg_guard_post_updates on public.posts;
create trigger trg_guard_post_updates
  before update on public.posts
  for each row execute function public.guard_post_updates();

-- Guard trigger: review metadata (rating / year / poster) only survives on review desks.
-- Reads `categories.kind`, so adding another review desk needs no change here.
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

-- profiles policies
drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id and role = 'writer');

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update
  using (auth.uid() = id or public.is_admin())
  with check (
    public.is_admin()
    or (auth.uid() = id and role = 'writer')
  );

-- categories policies
drop policy if exists "categories readable" on public.categories;
create policy "categories readable" on public.categories for select using (true);

-- posts policies
drop policy if exists "published posts public" on public.posts;
create policy "published posts public" on public.posts
  for select using (status = 'published' or author_id = auth.uid() or public.is_admin());

drop policy if exists "authors create pending posts" on public.posts;
create policy "authors create pending posts" on public.posts
  for insert with check (
    auth.uid() = author_id
    and (
      public.is_admin()
      or (
        status = 'pending'
        and published_at is null
        and views = 0
        and public.pending_post_count(auth.uid()) < 5
      )
    )
  );

drop policy if exists "authors edit own, admins edit all" on public.posts;
create policy "authors edit own, admins edit all" on public.posts
  for update
  using (
    public.is_admin()
    or (author_id = auth.uid() and status in ('pending', 'rejected'))
  )
  with check (
    public.is_admin()
    or (author_id = auth.uid() and status = 'pending' and published_at is null)
  );

drop policy if exists "authors delete own, admins delete all" on public.posts;
create policy "authors delete own, admins delete all" on public.posts
  for delete using (author_id = auth.uid() or public.is_admin());

-- comments policies
drop policy if exists "comments readable" on public.comments;
create policy "comments readable" on public.comments
  for select using (
    exists (
      select 1 from public.posts p
      where p.id = comments.post_id
        and (p.status = 'published' or p.author_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "logged in can comment" on public.comments;
create policy "logged in can comment" on public.comments
  for insert with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.posts p
      where p.id = comments.post_id and p.status = 'published'
    )
  );

drop policy if exists "delete own comment or admin" on public.comments;
create policy "delete own comment or admin" on public.comments
  for delete using (author_id = auth.uid() or public.is_admin());

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP (Collision-safe & sanitized)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  raw_name text;
  clean_name text;
  final_name text;
begin
  raw_name := coalesce(
    nullif(btrim(new.raw_user_meta_data->>'username'), ''),
    split_part(coalesce(new.email, 'user'), '@', 1)
  );
  -- Strip any characters outside [a-zA-Z0-9_-]
  clean_name := regexp_replace(raw_name, '[^a-zA-Z0-9_-]', '', 'g');
  if char_length(clean_name) < 3 then
    clean_name := 'user-' || substr(new.id::text, 1, 6);
  end if;
  clean_name := substr(clean_name, 1, 24);

  final_name := clean_name;
  if exists (select 1 from public.profiles where username = final_name) then
    final_name := substr(clean_name, 1, 19) || '-' || substr(new.id::text, 1, 4);
  end if;

  insert into public.profiles (id, username, role)
  values (new.id, final_name, 'writer')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- VIEW COUNTER (safe increment without exposing UPDATE)
-- ============================================================
create or replace function public.increment_views(p_slug text)
returns void language sql security definer set search_path = public as $$
  update public.posts
  set views = views + 1
  where slug = p_slug
    and status = 'published'
    and char_length(p_slug) <= 100;
$$;

-- ============================================================
-- STORAGE BUCKET FOR COVER IMAGES (Restricted MIME & Size)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'covers',
  'covers',
  true,
  5242880, -- 5 MB max
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "covers public read" on storage.objects;
create policy "covers public read" on storage.objects
  for select using (bucket_id = 'covers');

drop policy if exists "covers auth upload" on storage.objects;
create policy "covers auth upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "covers owner delete" on storage.objects;
create policy "covers owner delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- MAKE YOURSELF ADMIN (run AFTER you sign up)
-- update public.profiles set role = 'admin' where id = (
--   select id from auth.users where email = 'you@example.com'
-- );
-- ============================================================
