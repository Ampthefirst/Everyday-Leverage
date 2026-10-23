# Accounts: switching them on

Accounts let a handful of people keep their saved designs across devices, using an email and a password.
Until the steps below are done, the site works exactly as before: designs are saved in the browser, and no
sign-in button appears anywhere.

**What an account stores:** the email address, and each saved design's name, design type, sizes, chosen
task and the step it stopped at. Never the task-finder answers, and nothing about health.

## 1. Create the database (Supabase, free tier)

1. Go to [supabase.com](https://supabase.com), sign in, and choose **New project**. Pick any name and a
   region close to you. Save the database password somewhere safe (the app does not need it).
2. Open **SQL Editor → New query**, paste the block below, and press **Run**:

```sql
create table public.projects (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id         text not null check (id ~ '^[A-Za-z0-9_-]{1,40}$'),
  name       text not null check (char_length(name) between 1 and 80),
  family_id  text not null check (family_id in ('A1','A2','A3','B1','B2','B3','C1','C2','C3')),
  params     jsonb not null,
  preset_id  text,
  step       text not null check (step in ('brief','measure','check','print')),
  updated_at timestamptz not null,
  primary key (user_id, id)
);

-- Each person can only see and change their own designs.
alter table public.projects enable row level security;
create policy "own rows: read"   on public.projects for select using (user_id = auth.uid());
create policy "own rows: add"    on public.projects for insert with check (user_id = auth.uid());
create policy "own rows: change" on public.projects for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows: remove" on public.projects for delete using (user_id = auth.uid());
```

3. Open **Authentication → Sign In / Providers → Email** and check that email sign-in is on.
   - **Confirm email** on (recommended): new accounts get a link by email before their first sign-in.
     The app already says “Check your email”. Supabase's built-in mailer sends only a few emails an hour,
     which is plenty for fewer than ten accounts.
   - **Confirm email** off: accounts work straight away. Fine for a closed presentation.
4. Open **Authentication → URL Configuration** and set **Site URL** to `https://everyday-leverage.vercel.app`
   (so confirmation links open the live site).

## 2. Give Vercel the two values

In Supabase, copy two values:

- the **Project URL**, which looks like `https://abcd1234.supabase.co`. Find it in any of these places:
  - **Project Settings → Data API**;
  - the **Connect** button at the top of the project page;
  - or build it yourself: the dashboard address is `supabase.com/dashboard/project/<ref>`, and the URL is
    `https://<ref>.supabase.co`.
- the **publishable** key (`sb_publishable_…`) from **Project Settings → API Keys**. The older **anon** key
  works too. Never use the **secret** / `service_role` key: the app does not need it.

In Vercel, open the project → **Settings → Environment Variables** and add, for Production (and Preview if
you want to test there):

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | the Project URL |
| `SUPABASE_ANON_KEY` | the anon / publishable key |

Do not prefix them with `VITE_` and do not paste them anywhere else: only the `/api` functions read them.
Then **redeploy** (Deployments → ⋯ → Redeploy) so the functions pick them up.

## 3. Check it

1. Open the site. A **Sign in** button appears in the header, next to Menu.
2. Create an account, save a design in the designer, then open the site in another browser and sign in:
   the design is on the shelf.
3. In Supabase, **Table Editor → projects** shows one row per saved design, and **Authentication → Users**
   lists the accounts. To remove someone, delete them there; their designs are deleted with them.

To switch accounts off again, delete the two environment variables and redeploy. Designs already in
people's browsers stay there.

## How it works (for developers)

- `api/auth.ts` and `api/projects.ts` are thin routes over `api/_accounts/handlers.ts`, which talks to an
  `AccountsBackend` (`api/_accounts/types.ts`). `supabase.ts` implements it over Supabase's REST APIs with
  plain `fetch`; `memory.ts` implements it in memory for the unit tests (`tests/unit/accounts.test.ts`).
  Another database (for example Postgres on Neon) means one more adapter; nothing else changes.
- Sessions live in two cookies (`el_at`, `el_rt`): HttpOnly, Secure, SameSite=Lax, scoped to `/api`.
  Page scripts never see a token. Expired access tokens are refreshed on the next request.
- Every write checks the request's origin and caps the body size (2 KB for sign-in, 64 KB for a design).
  Sign-in attempts are limited to 30 per IP address and 8 per email address every 15 minutes, per warm
  function instance, with Supabase's own limits behind that.
- Designs are validated field by field on the server and copied into a fresh object, so nothing a client
  adds (finder answers, notes) can be stored. Row-level security keeps each account's rows private.
- In the browser, `src/accounts/sync.ts` keeps the shelf in local storage as before. When someone is
  signed in, every change also goes to the account. On sign-in the two lists are merged by id, and the
  newer copy of each design wins. Offline, the shelf keeps working, and changes upload on the next visit while signed in.
- `GET /api/auth` reports `{ configured, user }`. The header's `AccountEntry` shows nothing until
  `configured` is true.
