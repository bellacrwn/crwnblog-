# crwnblog

A community broadsheet covering **Cyber Discovery**, **Tech Discovery**, **Celebrity News**, **Football** and **Film & Screen**.
Next.js (App Router) + Supabase (Postgres, Auth, Storage). Zero static/mock data — every dispatch comes from the database.

## The look

Two skins share one component vocabulary, driven by CSS custom properties in `src/app/globals.css`:

| Shell | Where | Palette |
|---|---|---|
| `.theme-newsprint` | `/`, `/category/*`, `/post/*` | Cream paper `#f4ece0`, brown ink `#241a12`, oxblood accent |
| `.theme-walnut` | `/write`, `/dashboard`, `/admin`, `/login` | Deep walnut `#1b130e`, cream text `#f2e8d8`, brass accent |

Route groups `src/app/(public)` and `src/app/(private)` each own a layout that mounts the matching
shell. Route groups don't affect URLs, so every path is unchanged.

Typography: **UnifrakturMaguntia** (nameplate), **Playfair Display** (headlines), **Libre Caslon
Text** (article body), **Plus Jakarta Sans** (UI), Geist Mono (kickers/datelines). Cover imagery gets
a light sepia duotone via `.newsprint-img`.

To retint the whole site, edit the variables under `:root, .theme-newsprint` and `.theme-walnut` —
no component needs touching.

## Setup (10 minutes)

### 1. Create the Supabase project
- Go to supabase.com → **New project** (free tier is fine).
- Pick a region close to your readers (e.g. `eu-west` or `us-east` for Nigeria traffic).

### 2. Run the schema
- Dashboard → **SQL Editor** → **New query**
- Paste everything from `supabase/schema.sql` → **Run**

This creates `profiles`, `categories`, `posts`, `comments`, all RLS policies, the signup trigger,
the view counter, the review-field guard trigger, and the `covers` storage bucket.

> **Already have a live project?** Don't re-run the whole schema. Run
> `supabase/migrations/0002_new_desks_and_film_reviews.sql` instead — it's idempotent and adds the
> two new desks, the film-review columns, and the desk `kind` column.

### 3. Wire up env vars
```bash
cp .env.local.example .env.local
```
Fill in from **Project Settings → API**:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Run it
```bash
npm install
npm run dev
```

### 5. Make yourself admin
Sign up at `/login`, then in the Supabase SQL Editor:
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```
Now `/admin` (the moderation queue) unlocks.

> Tip while testing: Supabase → **Authentication → Providers → Email** → turn *Confirm email* **off** so you can sign up instantly.

## Adding a section

A section lives in **three** places that must agree. Missing any of them fails at runtime, not at
build time:

1. `src/lib/categories.ts` — the UI source of truth (nav, footer, filters, write form).
2. `supabase/schema.sql` — the seed row, for fresh installs.
3. `supabase/migrations/` — an `insert ... on conflict` for **existing** installs, which you must
   run in the SQL Editor. `posts.category_slug` is a foreign key to `public.categories(slug)`, so
   submissions fail until the row exists.

The server-side allowlist in `src/lib/actions.ts` is derived from `categories.ts`, so it can never
drift out of sync again.

Each desk carries two inks (`accent` for newsprint, `accentDark` for walnut). Components should use
`deskVar(slug)` so the colour adapts to whichever shell is rendering it.

## Film & Screen reviews

The `movies` desk has `kind = 'review'`. Review posts collect:

| Field | Type | Notes |
|---|---|---|
| `rating` | `numeric(3,1)` | 0–10, rendered as 5 stars by `components/Stars.tsx` |
| `release_year` | `int` | 1888–2100 |
| `poster_url` | `text` | portrait 2:3 crops best; `cover_url` is still used on cards |

The write form reveals these fields only when a review desk is selected. Two guards stop junk
reaching the page:

- `src/lib/actions.ts` validates the ranges and nulls the fields for non-review desks.
- The `trg_normalize_review_fields` trigger nulls them again in the database, reading
  `categories.kind` — so a second review desk later needs no schema change.

## How posting works

| Who | What happens |
|---|---|
| Visitor | Reads published posts only |
| Registered user | Writes a post → status `pending` → invisible until approved |
| Admin | Writes → publishes instantly. Sees `/admin` queue: Approve / Reject (with reason) / Delete |

This is enforced **in the database** by RLS, not just in the UI — a user cannot POST their way to `status = 'published'` even with a crafted API call.

## Security notes
- All post HTML is run through `sanitize-html` **server-side** in `src/lib/actions.ts` before it ever touches the DB. The editor's output is treated as hostile.
- Only a whitelist of tags/attributes survives; `<script>`, `onerror=`, `javascript:` URLs are stripped.
- Links get `rel="nofollow noopener"` automatically.
- Cover and poster URLs are re-parsed with `new URL()` and restricted to `http`/`https`.
- Only the **anon** key is used client-side. Never put the `service_role` key in this app.

## Project map
```
src/
  app/
    layout.tsx               # <html>/<body>, fonts, globals.css
    (public)/
      layout.tsx             # newsprint shell
      page.tsx               # front page: lead story, Inside Today, section strips
      category/[slug]/       # cyber / tech / celebrity / football / movies
      post/[slug]/           # article + review box + letters
    (private)/
      layout.tsx             # walnut shell
      write/                 # rich-text submission form + review fields
      dashboard/             # writer workspace
      admin/                 # moderation queue
      login/                 # sign in / sign up
  components/
    Masthead.tsx             # public nameplate + dateline + section index
    Colophon.tsx             # public footer
    Nav.tsx                  # contributor bar
    PostCard.tsx  Editor.tsx  Stars.tsx  SetupNotice.tsx  ViewTracker.tsx
  lib/
    actions.ts               # server actions (submit, moderate, comment)
    categories.ts            # desk registry — start here to add a section
    format.ts                # dateline, edition number, relative time
    sanitize.ts              # XSS scrub, slugify, excerpt, reading time
    supabase/{client,server}.ts
supabase/
  schema.sql                 # fresh installs
  migrations/0002_*.sql      # existing installs
```

## Sensible next steps
- Cover image **upload** for the poster field (the bucket + policies already exist; form takes a URL or a file)
- Email the author when a post is approved/rejected (Supabase Edge Function + Resend)
- Rate limit submissions (e.g. 3 pending posts max per user)
- `sitemap.ts` + RSS feed for SEO
- Search across titles/bodies (Postgres full-text)
- Print stylesheet — the broadsheet layout would survive `@media print` well
