-- ============================================================
-- CRWNBLOG — Supabase schema
-- Paste this whole file into: Supabase Dashboard > SQL Editor > New query > Run
-- ============================================================

-- ---------- PROFILES ----------
-- One row per auth user. Holds display name + role.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  bio         text default '',
  avatar_url  text,
  role        text not null default 'writer' check (role in ('writer','admin')),
  created_at  timestamptz not null default now()
);

-- ---------- CATEGORIES ----------
create table if not exists public.categories (
  slug  text primary key,
  name  text not null,
  blurb text default '',
  accent text default '#6366f1'
);

insert into public.categories (slug, name, blurb, accent) values
  ('cyber',     'Cyber Discovery', 'Breaches, exploits, threat research and defence.', '#22d3ee'),
  ('tech',      'Tech Discovery',  'New tools, hardware, AI and engineering finds.',   '#a78bfa'),
  ('celebrity', 'Celebrity News',  'Culture, entertainment and who did what.',         '#fb7185')
on conflict (slug) do nothing;

-- ---------- POSTS ----------
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.profiles(id) on delete cascade,
  category_slug text not null references public.categories(slug),
  title         text not null check (char_length(title) between 3 and 160),
  slug          text unique not null,
  excerpt       text default '',
  body_html     text not null,          -- sanitised server-side before insert
  cover_url     text,
  status        text not null default 'pending' check (status in ('pending','published','rejected')),
  reject_reason text,
  views         int not null default 0,
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
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);

-- ============================================================
-- ROW LEVEL SECURITY
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

-- profiles
drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update using (auth.uid() = id or public.is_admin());

-- categories
drop policy if exists "categories readable" on public.categories;
create policy "categories readable" on public.categories for select using (true);

-- posts
drop policy if exists "published posts public" on public.posts;
create policy "published posts public" on public.posts
  for select using (status = 'published' or author_id = auth.uid() or public.is_admin());

drop policy if exists "authors create pending posts" on public.posts;
create policy "authors create pending posts" on public.posts
  for insert with check (
    auth.uid() = author_id
    and (status = 'pending' or public.is_admin())   -- normal users CANNOT self-publish
  );

drop policy if exists "authors edit own, admins edit all" on public.posts;
create policy "authors edit own, admins edit all" on public.posts
  for update using (author_id = auth.uid() or public.is_admin());

drop policy if exists "authors delete own, admins delete all" on public.posts;
create policy "authors delete own, admins delete all" on public.posts
  for delete using (author_id = auth.uid() or public.is_admin());

-- comments
drop policy if exists "comments readable" on public.comments;
create policy "comments readable" on public.comments for select using (true);

drop policy if exists "logged in can comment" on public.comments;
create policy "logged in can comment" on public.comments
  for insert with check (auth.uid() = author_id);

drop policy if exists "delete own comment or admin" on public.comments;
create policy "delete own comment or admin" on public.comments
  for delete using (author_id = auth.uid() or public.is_admin());

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'username',''),
      split_part(new.email,'@',1) || '-' || substr(new.id::text,1,4)
    )
  )
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
  update public.posts set views = views + 1 where slug = p_slug and status = 'published';
$$;

-- ============================================================
-- STORAGE BUCKET FOR COVER IMAGES
-- ============================================================
insert into storage.buckets (id, name, public) values ('covers','covers', true)
on conflict (id) do nothing;

drop policy if exists "covers public read" on storage.objects;
create policy "covers public read" on storage.objects
  for select using (bucket_id = 'covers');

drop policy if exists "covers auth upload" on storage.objects;
create policy "covers auth upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'covers');

-- ============================================================
-- MAKE YOURSELF ADMIN (run AFTER you sign up)
-- update public.profiles set role = 'admin' where id = (
--   select id from auth.users where email = 'you@example.com'
-- );
-- ============================================================
