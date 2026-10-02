# crwnblog

Community blog for **Cyber Discovery**, **Tech Discovery** and **Celebrity News**.
Next.js (App Router) + Supabase (Postgres, Auth, Storage). Zero static/mock data — every post comes from the database.

## Setup (10 minutes)

### 1. Create the Supabase project
- Go to supabase.com → **New project** (free tier is fine).
- Pick a region close to your readers (e.g. `eu-west` or `us-east` for Nigeria traffic).

### 2. Run the schema
- Dashboard → **SQL Editor** → **New query**
- Paste everything from `supabase/schema.sql` → **Run**

This creates `profiles`, `categories`, `posts`, `comments`, all RLS policies, the signup trigger, the view counter, and the `covers` storage bucket.

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

## Deploy to Vercel
1. Push to GitHub.
2. Vercel → **Import Project** → pick the repo (it auto-detects Next.js).
3. Add the two `NEXT_PUBLIC_*` env vars in **Settings → Environment Variables**.
4. Deploy. Add your domain under **Settings → Domains**.

No extra config needed — no `vercel.json`, no custom runtime.

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
- Only the **anon** key is used client-side. Never put the `service_role` key in this app.

## Project map
```
src/
  app/
    page.tsx                 # homepage feed (lead story + grid)
    category/[slug]/page.tsx # cyber / tech / celebrity
    post/[slug]/page.tsx     # article + comments
    write/                   # rich-text submission form
    login/page.tsx           # sign in / sign up
    admin/page.tsx           # moderation queue
  components/
    Nav.tsx  PostCard.tsx  Editor.tsx  SetupNotice.tsx
  lib/
    actions.ts               # server actions (submit, moderate, comment)
    sanitize.ts              # XSS scrub, slugify, excerpt, reading time
    supabase/{client,server}.ts
supabase/schema.sql          # run this in the SQL editor
```

## Sensible next steps
- Cover image **upload** to the `covers` bucket (bucket + policies already exist; form currently takes a URL)
- Email the author when a post is approved/rejected (Supabase Edge Function + Resend)
- Rate limit submissions (e.g. 3 pending posts max per user)
- `sitemap.ts` + RSS feed for SEO
- Search across titles/bodies (Postgres full-text)
